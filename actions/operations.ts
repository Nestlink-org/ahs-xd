"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Operation from "@/models/Operation";
import Transaction from "@/models/Transaction";
import Wallet from "@/models/Wallet";
import FinanceConfig from "@/models/FinanceConfig";
import { getSession } from "@/lib/session";
import {
  createNotification,
  triggerFinanceNotifications,
} from "@/actions/notifications";
import mongoose from "mongoose";

type ActionResult = { success: boolean; message: string };

async function requireOpsAccess() {
  const session = await getSession();
  if (
    !session ||
    !["superadmin", "admin", "ops", "sales"].includes(session.role)
  ) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ─── Status probability for weighted pipeline ─────────────────────────────────
const STATUS_PROBABILITY: Record<string, number> = {
  Lead: 0.1,
  Ongoing: 0.5,
  Closed: 1.0,
};

// ─── Add operation ────────────────────────────────────────────────────────────

export async function addOperation(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireOpsAccess();

    const date = new Date(formData.get("date") as string);
    const type = formData.get("type") as "SafeSport" | "ResultShield";
    const client = (formData.get("client") as string)?.trim();
    const school = (formData.get("school") as string)?.trim() ?? "";
    const athletes = parseInt(formData.get("athletes") as string) || 0;
    const revenue = parseFloat(formData.get("revenue") as string) || 0;
    const cost = parseFloat(formData.get("cost") as string) || 0;
    const status = formData.get("status") as "Lead" | "Ongoing" | "Closed";
    const contract = formData.get("contract") === "true";

    if (!client || !type || !status) {
      return {
        success: false,
        message: "Client, type and status are required.",
      };
    }

    await connectDB();

    const op = await Operation.create({
      date,
      type,
      client,
      school,
      athletes,
      revenue,
      cost,
      status,
      contract,
      financeLinked: false,
      createdBy: new mongoose.Types.ObjectId(session.userId),
    });

    // Auto-sync finance if Closed
    if (status === "Closed") {
      await syncOperationToFinance(op._id.toString(), session.userId);
    }

    revalidatePath("/dashboard/ops");

    const { notifyDealAdded, notifyDealClosed } =
      await import("@/actions/notifications");
    notifyDealAdded(session.email, client, type, status).catch(() => {});
    if (status === "Closed") {
      notifyDealClosed(session.email, client, type, revenue).catch(() => {});
    }

    return { success: true, message: "Operation added." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[addOperation]", err);
    return { success: false, message: "Failed to add operation." };
  }
}

// ─── Update operation status ──────────────────────────────────────────────────

export async function updateOperationStatus(
  id: string,
  status: "Lead" | "Ongoing" | "Closed",
): Promise<ActionResult> {
  try {
    const session = await requireOpsAccess();
    await connectDB();

    const op = await Operation.findById(id);
    if (!op) return { success: false, message: "Operation not found." };

    op.status = status;
    await op.save();

    if (status === "Closed" && !op.financeLinked) {
      await syncOperationToFinance(id, session.userId);
    }

    revalidatePath("/dashboard/ops");

    const { notifyDealStatusChanged, notifyDealClosed } =
      await import("@/actions/notifications");
    notifyDealStatusChanged(session.email, op.client, op.status, status).catch(
      () => {},
    );
    if (status === "Closed") {
      notifyDealClosed(session.email, op.client, op.type, op.revenue).catch(
        () => {},
      );
    }

    return { success: true, message: `Status updated to ${status}.` };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[updateOperationStatus]", err);
    return { success: false, message: "Failed to update status." };
  }
}

// ─── Finance sync (internal) ──────────────────────────────────────────────────

async function syncOperationToFinance(opId: string, userId: string) {
  const op = await Operation.findById(opId);
  if (!op || op.financeLinked) return;

  // Revenue transaction
  if (op.revenue > 0) {
    await Wallet.findOneAndUpdate(
      { type: "primary" },
      { $inc: { balance: op.revenue } },
    );
    await Transaction.create({
      date: op.date,
      type: "revenue",
      category: "Product Sale",
      platform: op.type,
      amount: op.revenue,
      wallet: "primary",
      services: [op.client],
      notes: `Auto-synced from deal: ${op.client}`,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  }

  // Cost → expense
  if (op.cost > 0) {
    await Wallet.findOneAndUpdate(
      { type: "primary" },
      { $inc: { balance: -op.cost } },
    );
    await Transaction.create({
      date: op.date,
      type: "expense",
      category: "Operations",
      platform: op.type,
      amount: op.cost,
      wallet: "primary",
      services: [op.client],
      notes: `Auto-synced cost from deal: ${op.client}`,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  }

  op.financeLinked = true;
  await op.save();

  // Notify
  await createNotification(
    userId,
    "FINANCE_SYNCED",
    `💰 Finance Synced — ${op.client}`,
    `Deal closed: ${op.client} (${op.type}). Revenue ${op.revenue.toLocaleString()} auto-added to Primary Wallet.`,
    "info",
  );

  // Notify deal closed
  await createNotification(
    userId,
    "DEAL_CLOSED",
    `🎯 Deal Closed — ${op.client}`,
    `${op.type} deal with ${op.client} has been closed. Revenue: ${op.revenue.toLocaleString()}.`,
    "info",
  );

  // Re-check finance alerts
  const config = (await FinanceConfig.findOne().lean()) ?? {
    minCashThreshold: 50000,
    minRunwayMonths: 3,
    revenueTarget: 100000,
  };
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [wallets, periodStats] = await Promise.all([
    Wallet.find().lean(),
    Transaction.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
  ]);
  const primaryBalance =
    wallets.find((w) => w.type === "primary")?.balance ?? 0;
  const revenue2 = periodStats.find((s) => s._id === "revenue")?.total ?? 0;
  const expenses = periodStats.find((s) => s._id === "expense")?.total ?? 0;
  await triggerFinanceNotifications(
    userId,
    primaryBalance,
    revenue2,
    expenses,
    config as any,
  );
}

// ─── Get operations ───────────────────────────────────────────────────────────

export async function getOperations(filters?: {
  type?: string;
  status?: string;
  search?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await connectDB();

  const query: Record<string, unknown> = {};
  if (filters?.type && filters.type !== "all") query.type = filters.type;
  if (filters?.status && filters.status !== "all")
    query.status = filters.status;
  if (filters?.search) {
    query.client = { $regex: filters.search, $options: "i" };
  }

  const ops = await Operation.find(query).sort({ date: -1 }).limit(100).lean();
  return JSON.parse(JSON.stringify(ops));
}

// ─── Get ops stats ────────────────────────────────────────────────────────────

export async function getOpsStats() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await connectDB();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    pipeline,
    safesportStats,
    productBreakdown,
    statusDist,
    monthlyRevTrend,
  ] = await Promise.all([
    // Pipeline metrics
    Operation.aggregate([
      { $match: { status: { $ne: "Closed" } } },
      {
        $group: {
          _id: null,
          totalPipeline: { $sum: "$revenue" },
          weightedPipeline: {
            $sum: {
              $multiply: [
                "$revenue",
                {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$status", "Lead"] }, then: 0.1 },
                      { case: { $eq: ["$status", "Ongoing"] }, then: 0.5 },
                    ],
                    default: 1.0,
                  },
                },
              ],
            },
          },
        },
      },
    ]),

    // SafeSport metrics
    Operation.aggregate([
      { $match: { type: "SafeSport" } },
      {
        $group: {
          _id: null,
          totalAthletes: { $sum: "$athletes" },
          totalRevenue: { $sum: "$revenue" },
        },
      },
    ]),

    // Revenue by product
    Operation.aggregate([
      { $match: { status: "Closed" } },
      {
        $group: {
          _id: "$type",
          revenue: { $sum: "$revenue" },
          count: { $sum: 1 },
        },
      },
    ]),

    // Status distribution
    Operation.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

    // Monthly revenue trend (last 6 months)
    Operation.aggregate([
      {
        $match: {
          status: "Closed",
          date: { $gte: new Date(new Date().setMonth(now.getMonth() - 5, 1)) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          revenue: { $sum: "$revenue" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const p = pipeline[0] ?? { totalPipeline: 0, weightedPipeline: 0 };
  const ss = safesportStats[0] ?? { totalAthletes: 0, totalRevenue: 0 };

  const config = (await FinanceConfig.findOne().lean()) ?? {
    revenueTarget: 100000,
  };
  const pipelineCoverage =
    (config as any).revenueTarget > 0
      ? (p.weightedPipeline / (config as any).revenueTarget) * 100
      : 0;

  const dealsClosed = productBreakdown.reduce(
    (s: number, p: any) => s + p.count,
    0,
  );
  const revenuePerAthlete =
    ss.totalAthletes > 0 ? ss.totalRevenue / ss.totalAthletes : 0;

  // Low pipeline alert
  if (p.weightedPipeline < (config as any).revenueTarget * 3) {
    const session2 = await getSession();
    if (session2) {
      const { createNotification: cn } =
        await import("@/actions/notifications");
      const Notification = (await import("@/models/Notification")).default;
      const recent = await Notification.findOne({
        userId: new mongoose.Types.ObjectId(session2.userId),
        type: "LOW_PIPELINE",
        read: false,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      if (!recent) {
        await cn(
          session2.userId,
          "LOW_PIPELINE",
          "📊 Low Pipeline",
          `Weighted pipeline (${p.weightedPipeline.toLocaleString()}) is below 3× monthly target.`,
          "warning",
        );
      }
    }
  }

  return JSON.parse(
    JSON.stringify({
      totalPipeline: p.totalPipeline,
      weightedPipeline: p.weightedPipeline,
      pipelineCoverage: pipelineCoverage,
      dealsClosed,
      totalAthletes: ss.totalAthletes,
      safesportRevenue: ss.totalRevenue,
      revenuePerAthlete,
      productBreakdown,
      statusDistribution: statusDist,
      monthlyRevTrend,
    }),
  );
}

// ─── Update full operation ────────────────────────────────────────────────────

export async function updateOperation(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireOpsAccess();

    const id = formData.get("id") as string;
    const date = new Date(formData.get("date") as string);
    const type = formData.get("type") as "SafeSport" | "ResultShield";
    const client = (formData.get("client") as string)?.trim();
    const school = (formData.get("school") as string)?.trim() ?? "";
    const athletes = parseInt(formData.get("athletes") as string) || 0;
    const revenue = parseFloat(formData.get("revenue") as string) || 0;
    const cost = parseFloat(formData.get("cost") as string) || 0;
    const status = formData.get("status") as "Lead" | "Ongoing" | "Closed";
    const contract = formData.get("contract") === "true";

    if (!id || !client || !type || !status) {
      return { success: false, message: "Required fields missing." };
    }

    await connectDB();
    const existing = await Operation.findById(id);
    if (!existing) return { success: false, message: "Operation not found." };

    const wasNotClosed = existing.status !== "Closed";
    existing.date = date;
    existing.type = type;
    existing.client = client;
    existing.school = school;
    existing.athletes = athletes;
    existing.revenue = revenue;
    existing.cost = cost;
    existing.status = status;
    existing.contract = contract;
    await existing.save();

    // Sync finance if newly closed
    if (status === "Closed" && wasNotClosed && !existing.financeLinked) {
      await syncOperationToFinance(id, session.userId);
    }

    revalidatePath("/dashboard/ops");

    const { notifyDealStatusChanged } = await import("@/actions/notifications");
    notifyDealStatusChanged(
      session.email,
      client,
      existing.status,
      status,
    ).catch(() => {});

    return { success: true, message: "Deal updated." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[updateOperation]", err);
    return { success: false, message: "Failed to update deal." };
  }
}
