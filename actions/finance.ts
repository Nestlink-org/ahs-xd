"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import Wallet from "@/models/Wallet";
import Transfer from "@/models/Transfer";
import FinanceConfig from "@/models/FinanceConfig";
import { getSession } from "@/lib/session";
import mongoose from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult = { success: boolean; message: string };

export type Alert = {
  type:
    | "CASH_RISK"
    | "BURN_EXCEEDING_REVENUE"
    | "NEGATIVE_CASH_FLOW"
    | "LOW_RUNWAY";
  severity: "critical" | "warning";
  message: string;
};

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireFinanceAccess() {
  const session = await getSession();
  if (
    !session ||
    !["superadmin", "admin", "finance", "sales"].includes(session.role)
  ) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ─── Alert engine (runs after every write) ────────────────────────────────────

async function computeAlerts(
  primaryBalance: number,
  monthlyRevenue: number,
  monthlyExpenses: number,
  config: { minCashThreshold: number; minRunwayMonths: number },
): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const netCashFlow = monthlyRevenue - monthlyExpenses;
  const monthlyBurn = monthlyExpenses || 1;
  const runway = primaryBalance / monthlyBurn;

  if (primaryBalance < config.minCashThreshold) {
    alerts.push({
      type: "CASH_RISK",
      severity: "critical",
      message: `Primary wallet balance is below the minimum threshold of ${config.minCashThreshold.toLocaleString()}.`,
    });
  }
  if (monthlyExpenses > monthlyRevenue) {
    alerts.push({
      type: "BURN_EXCEEDING_REVENUE",
      severity: "warning",
      message: "Monthly expenses are exceeding revenue this period.",
    });
  }
  if (netCashFlow < 0) {
    alerts.push({
      type: "NEGATIVE_CASH_FLOW",
      severity: "warning",
      message: "Net cash flow is negative this month.",
    });
  }
  if (runway < config.minRunwayMonths) {
    alerts.push({
      type: "LOW_RUNWAY",
      severity: "critical",
      message: `Runway is ${runway.toFixed(1)} months, below the ${config.minRunwayMonths}-month minimum.`,
    });
  }
  return alerts;
}

// ─── Add transaction ──────────────────────────────────────────────────────────

export async function addTransaction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireFinanceAccess();

    const type = formData.get("type") as "revenue" | "expense";
    const category = (formData.get("category") as string)?.trim();
    const platform = (formData.get("platform") as string)?.trim();
    const amount = parseFloat(formData.get("amount") as string);
    const wallet = formData.get("wallet") as "primary" | "profit";
    const date = new Date(formData.get("date") as string);
    const notes = (formData.get("notes") as string)?.trim() ?? "";

    // Up to 2 named services (expense only, used in donut chart)
    const s1 = (formData.get("service1") as string)?.trim();
    const s2 = (formData.get("service2") as string)?.trim();
    const services =
      type === "expense" ? ([s1, s2].filter(Boolean) as string[]) : [];

    if (
      !type ||
      !category ||
      !platform ||
      !wallet ||
      isNaN(amount) ||
      amount <= 0
    ) {
      return {
        success: false,
        message: "All required fields must be filled correctly.",
      };
    }
    if (!["revenue", "expense"].includes(type)) {
      return { success: false, message: "Invalid transaction type." };
    }
    if (!["primary", "profit"].includes(wallet)) {
      return { success: false, message: "Invalid wallet." };
    }

    await connectDB();

    // Atomic wallet balance update
    const balanceDelta = type === "revenue" ? amount : -amount;
    const updated = await Wallet.findOneAndUpdate(
      { type: wallet },
      { $inc: { balance: balanceDelta } },
      { new: true },
    );

    if (!updated) {
      return {
        success: false,
        message: "Wallet not found. Please run the seed script.",
      };
    }

    await Transaction.create({
      date,
      type,
      category,
      platform,
      amount,
      wallet,
      services,
      notes,
      createdBy: new mongoose.Types.ObjectId(session.userId),
    });

    revalidatePath("/dashboard/finance");
    return { success: true, message: "Transaction added successfully." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[addTransaction]", err);
    return { success: false, message: "Failed to add transaction." };
  }
}

// ─── Delete transaction ───────────────────────────────────────────────────────

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    const session = await requireFinanceAccess();
    if (!["superadmin", "admin"].includes(session.role)) {
      return {
        success: false,
        message: "Only admins can delete transactions.",
      };
    }

    await connectDB();
    const tx = await Transaction.findById(id);
    if (!tx) return { success: false, message: "Transaction not found." };

    // Reverse the wallet balance
    const reverseDelta = tx.type === "revenue" ? -tx.amount : tx.amount;
    await Wallet.findOneAndUpdate(
      { type: tx.wallet },
      { $inc: { balance: reverseDelta } },
    );

    await Transaction.findByIdAndDelete(id);
    revalidatePath("/dashboard/finance");
    return { success: true, message: "Transaction deleted." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[deleteTransaction]", err);
    return { success: false, message: "Failed to delete transaction." };
  }
}

// ─── Transfer to profit wallet ────────────────────────────────────────────────

export async function transferToProfit(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireFinanceAccess();
    if (!["superadmin", "admin"].includes(session.role)) {
      return { success: false, message: "Only admins can transfer funds." };
    }

    const amount = parseFloat(formData.get("amount") as string);
    const note = (formData.get("note") as string)?.trim() ?? "";

    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: "Enter a valid amount." };
    }

    await connectDB();
    const primary = await Wallet.findOne({ type: "primary" });
    if (!primary || primary.balance < amount) {
      return {
        success: false,
        message: "Insufficient balance in Primary Wallet.",
      };
    }

    // Atomic debit primary, credit profit
    await Wallet.findOneAndUpdate(
      { type: "primary" },
      { $inc: { balance: -amount } },
    );
    await Wallet.findOneAndUpdate(
      { type: "profit" },
      { $inc: { balance: amount } },
    );

    await Transfer.create({
      amount,
      note,
      createdBy: new mongoose.Types.ObjectId(session.userId),
    });

    revalidatePath("/dashboard/finance");
    return {
      success: true,
      message: `Transferred ${amount.toLocaleString()} to Profit Wallet.`,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[transferToProfit]", err);
    return { success: false, message: "Failed to transfer funds." };
  }
}

// ─── Get finance dashboard data ───────────────────────────────────────────────

export async function getFinanceData(
  period: "month" | "quarter" | "year" = "month",
) {
  const session = await getSession();
  if (
    !session ||
    !["superadmin", "admin", "finance", "sales"].includes(session.role)
  ) {
    throw new Error("Unauthorized");
  }

  await connectDB();

  // Period boundaries
  const now = new Date();
  const start = new Date(now);
  if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    start.setMonth(q * 3, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  const [
    wallets,
    config,
    periodStats,
    recentTx,
    monthlyTrend,
    categoryBreakdown,
    serviceBreakdown,
    walletTotals,
  ] = await Promise.all([
    // Wallet balances
    Wallet.find().lean(),

    // Config
    FinanceConfig.findOne().lean(),

    // Period aggregation
    Transaction.aggregate([
      { $match: { date: { $gte: start, $lte: now } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),

    // Recent 50 transactions
    Transaction.find().sort({ date: -1 }).limit(50).lean(),

    // Monthly trend (last 6 months) — split by type AND wallet
    Transaction.aggregate([
      {
        $match: {
          date: { $gte: new Date(new Date().setMonth(now.getMonth() - 5, 1)) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
            wallet: "$wallet",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Expense breakdown by category (current period)
    Transaction.aggregate([
      { $match: { type: "expense", date: { $gte: start, $lte: now } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),

    // Expense breakdown by service name (donut — current period)
    Transaction.aggregate([
      {
        $match: {
          type: "expense",
          date: { $gte: start, $lte: now },
          services: { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$services" },
      { $group: { _id: "$services", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),

    // All-time wallet totals (revenue in, expenses out) for gauge
    Transaction.aggregate([
      {
        $group: {
          _id: { wallet: "$wallet", type: "$type" },
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const revenue = periodStats.find((s) => s._id === "revenue")?.total ?? 0;
  const expenses = periodStats.find((s) => s._id === "expense")?.total ?? 0;
  const primaryBalance =
    wallets.find((w) => w.type === "primary")?.balance ?? 0;
  const profitBalance = wallets.find((w) => w.type === "profit")?.balance ?? 0;

  // Gauge data: total in vs total out per wallet (all-time)
  function walletGauge(walletType: string) {
    const totalIn =
      walletTotals.find(
        (t: any) => t._id.wallet === walletType && t._id.type === "revenue",
      )?.total ?? 0;
    const totalOut =
      walletTotals.find(
        (t: any) => t._id.wallet === walletType && t._id.type === "expense",
      )?.total ?? 0;
    return { totalIn, totalOut };
  }
  const primaryGauge = walletGauge("primary");
  const profitGauge = walletGauge("profit");

  const cfg = config ?? {
    minCashThreshold: 50000,
    minRunwayMonths: 3,
    revenueTarget: 100000,
    currency: "KES",
  };

  const monthsInPeriod = period === "month" ? 1 : period === "quarter" ? 3 : 12;
  const monthlyBurn = expenses / monthsInPeriod || 1;
  const runway = primaryBalance / monthlyBurn;

  const alerts = await computeAlerts(primaryBalance, revenue, expenses, cfg);

  return JSON.parse(
    JSON.stringify({
      kpi: {
        revenue,
        expenses,
        netCashFlow: revenue - expenses,
        primaryBalance,
        profitBalance,
        monthlyBurn,
        runway,
        primaryGauge,
        profitGauge,
      },
      wallets,
      config: cfg,
      alerts,
      transactions: recentTx,
      monthlyTrend,
      categoryBreakdown,
      serviceBreakdown,
      period,
    }),
  );
}

// ─── Update finance config ────────────────────────────────────────────────────

export async function updateFinanceConfig(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "superadmin") {
      return { success: false, message: "Only superadmin can update config." };
    }

    const minCashThreshold = parseFloat(
      formData.get("minCashThreshold") as string,
    );
    const minRunwayMonths = parseFloat(
      formData.get("minRunwayMonths") as string,
    );
    const revenueTarget = parseFloat(formData.get("revenueTarget") as string);
    const currency = (formData.get("currency") as string)?.trim();

    if ([minCashThreshold, minRunwayMonths, revenueTarget].some(isNaN)) {
      return { success: false, message: "All numeric fields are required." };
    }

    await connectDB();
    await FinanceConfig.findOneAndUpdate(
      {},
      {
        minCashThreshold,
        minRunwayMonths,
        revenueTarget,
        currency,
        updatedBy: new mongoose.Types.ObjectId(session.userId),
      },
      { upsert: true },
    );

    revalidatePath("/dashboard/finance");
    return { success: true, message: "Configuration updated." };
  } catch (err) {
    console.error("[updateFinanceConfig]", err);
    return { success: false, message: "Failed to update config." };
  }
}

// ─── Batch add expenses ───────────────────────────────────────────────────────

export type BatchExpenseItem = {
  service: string;
  category: string;
  amount: number;
  notes: string;
  wallet: "primary" | "profit";
  date: string;
};

export async function addBatchExpenses(
  items: BatchExpenseItem[],
): Promise<ActionResult> {
  try {
    const session = await requireFinanceAccess();

    if (!items.length)
      return { success: false, message: "No expenses to save." };

    for (const item of items) {
      if (!item.service || !item.category || !item.amount || item.amount <= 0) {
        return {
          success: false,
          message: `Invalid entry: ${item.service || "unnamed"}`,
        };
      }
    }

    await connectDB();

    for (const item of items) {
      const balanceDelta = -item.amount;
      const updated = await Wallet.findOneAndUpdate(
        { type: item.wallet },
        { $inc: { balance: balanceDelta } },
        { new: true },
      );
      if (!updated) throw new Error(`Wallet ${item.wallet} not found`);

      await Transaction.create({
        date: new Date(item.date),
        type: "expense",
        category: item.category,
        platform: "Internal",
        amount: item.amount,
        wallet: item.wallet,
        services: [item.service],
        notes: item.notes,
        createdBy: new mongoose.Types.ObjectId(session.userId),
      });
    }

    revalidatePath("/dashboard/finance");
    return {
      success: true,
      message: `${items.length} expense${items.length > 1 ? "s" : ""} saved.`,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[addBatchExpenses]", err);
    return { success: false, message: "Failed to save expenses." };
  }
}
