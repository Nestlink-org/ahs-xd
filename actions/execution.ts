"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import ExecutionLog from "@/models/ExecutionLog";
import { getSession } from "@/lib/session";
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

// ─── Add / update execution log ───────────────────────────────────────────────

export async function saveExecutionLog(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireOpsAccess();

    const date = new Date(formData.get("date") as string);
    const calls = parseInt(formData.get("calls") as string) || 0;
    const meetings = parseInt(formData.get("meetings") as string) || 0;
    const followUps = parseInt(formData.get("followUps") as string) || 0;
    const closings = parseInt(formData.get("closings") as string) || 0;
    const revenueWon = parseFloat(formData.get("revenueWon") as string) || 0;
    const notes = (formData.get("notes") as string)?.trim() ?? "";

    if (isNaN(date.getTime())) {
      return { success: false, message: "Invalid date." };
    }

    await connectDB();

    // Normalize to start of day for uniqueness
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Upsert — one log per user per day
    await ExecutionLog.findOneAndUpdate(
      {
        createdBy: new mongoose.Types.ObjectId(session.userId),
        date: { $gte: dayStart, $lt: dayEnd },
      },
      {
        date: dayStart,
        calls,
        meetings,
        followUps,
        closings,
        revenueWon,
        notes,
        createdBy: new mongoose.Types.ObjectId(session.userId),
      },
      { upsert: true, new: true },
    );

    revalidatePath("/dashboard/ops");

    const { notifyExecutionLog } = await import("@/actions/notifications");
    notifyExecutionLog(
      session.email,
      dayStart.toLocaleDateString("en-KE", { day: "2-digit", month: "short" }),
      calls,
      meetings,
      closings,
    ).catch(() => {});

    return { success: true, message: "Execution log saved." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[saveExecutionLog]", err);
    return { success: false, message: "Failed to save log." };
  }
}

// ─── Get execution logs ───────────────────────────────────────────────────────

export async function getExecutionLogs(
  period: "week" | "month" | "all" = "month",
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await connectDB();

  const now = new Date();
  const start = new Date(now);
  if (period === "week") {
    start.setDate(now.getDate() - 7);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setFullYear(2000);
  }

  const query = period === "all" ? {} : { date: { $gte: start, $lte: now } };

  const logs = await ExecutionLog.find(query)
    .sort({ date: -1 })
    .limit(100)
    .lean();

  return JSON.parse(JSON.stringify(logs));
}

// ─── Get execution stats ──────────────────────────────────────────────────────

export async function getExecutionStats() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await connectDB();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [monthStats, weekStats, todayStats, trend] = await Promise.all([
    // Month aggregation
    ExecutionLog.aggregate([
      { $match: { date: { $gte: monthStart, $lte: now } } },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: "$calls" },
          totalMeetings: { $sum: "$meetings" },
          totalFollowUps: { $sum: "$followUps" },
          totalClosings: { $sum: "$closings" },
          totalRevenueWon: { $sum: "$revenueWon" },
          days: { $sum: 1 },
        },
      },
    ]),

    // Week meetings
    ExecutionLog.aggregate([
      { $match: { date: { $gte: weekStart, $lte: now } } },
      {
        $group: {
          _id: null,
          meetings: { $sum: "$meetings" },
          calls: { $sum: "$calls" },
        },
      },
    ]),

    // Today
    ExecutionLog.aggregate([
      { $match: { date: { $gte: todayStart, $lte: now } } },
      {
        $group: {
          _id: null,
          calls: { $sum: "$calls" },
          meetings: { $sum: "$meetings" },
        },
      },
    ]),

    // Daily trend last 14 days
    ExecutionLog.aggregate([
      { $match: { date: { $gte: new Date(now.getTime() - 14 * 86400000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          calls: { $sum: "$calls" },
          meetings: { $sum: "$meetings" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const m = monthStats[0] ?? {
    totalCalls: 0,
    totalMeetings: 0,
    totalFollowUps: 0,
    totalClosings: 0,
    totalRevenueWon: 0,
    days: 1,
  };
  const w = weekStats[0] ?? { meetings: 0, calls: 0 };
  const t = todayStats[0] ?? { calls: 0, meetings: 0 };

  const callsPerDay = m.days > 0 ? m.totalCalls / m.days : 0;
  const conversionRate =
    m.totalMeetings > 0 ? (m.totalClosings / m.totalMeetings) * 100 : 0;
  const revenuePerCall =
    m.totalCalls > 0 ? m.totalRevenueWon / m.totalCalls : 0;

  return JSON.parse(
    JSON.stringify({
      callsToday: t.calls,
      meetingsToday: t.meetings,
      meetingsWeek: w.meetings,
      callsPerDay: callsPerDay,
      conversionRate: conversionRate,
      revenuePerCall: revenuePerCall,
      totalCalls: m.totalCalls,
      totalMeetings: m.totalMeetings,
      totalClosings: m.totalClosings,
      totalRevenueWon: m.totalRevenueWon,
      trend,
    }),
  );
}

// ─── Update execution log by ID ───────────────────────────────────────────────

export async function updateExecutionLog(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireOpsAccess();

    const id = formData.get("id") as string;
    const calls = parseInt(formData.get("calls") as string) || 0;
    const meetings = parseInt(formData.get("meetings") as string) || 0;
    const followUps = parseInt(formData.get("followUps") as string) || 0;
    const closings = parseInt(formData.get("closings") as string) || 0;
    const revenueWon = parseFloat(formData.get("revenueWon") as string) || 0;
    const notes = (formData.get("notes") as string)?.trim() ?? "";

    if (!id) return { success: false, message: "Missing log ID." };

    await connectDB();
    await ExecutionLog.findByIdAndUpdate(id, {
      calls,
      meetings,
      followUps,
      closings,
      revenueWon,
      notes,
    });

    revalidatePath("/dashboard/ops");
    return { success: true, message: "Log updated." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[updateExecutionLog]", err);
    return { success: false, message: "Failed to update log." };
  }
}
