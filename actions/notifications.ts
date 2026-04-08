"use server";

import { connectDB } from "@/lib/db";
import Notification, {
  type NotificationType,
  type NotificationSeverity,
} from "@/models/Notification";
import User from "@/models/User";
import { getSession } from "@/lib/session";
import mongoose from "mongoose";

// ─── Broadcast to all relevant users ─────────────────────────────────────────
// roles: which roles should receive this notification
// If empty, sends to all active users

async function broadcastNotification(
  type: NotificationType,
  title: string,
  message: string,
  severity: NotificationSeverity = "info",
  roles: string[] = [],
) {
  await connectDB();

  const query =
    roles.length > 0
      ? { isActive: true, role: { $in: roles } }
      : { isActive: true };

  const users = await User.find(query, "_id").lean();

  const docs = users.map((u) => ({
    userId: u._id,
    type,
    title,
    message,
    severity,
    read: false,
  }));

  if (docs.length > 0) {
    await Notification.insertMany(docs);
  }
}

// ─── Create notification for a single user ────────────────────────────────────

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  severity: NotificationSeverity = "info",
) {
  await connectDB();
  await Notification.create({
    userId: new mongoose.Types.ObjectId(userId),
    type,
    title,
    message,
    severity,
  });
}

// ─── Get notifications for current user (with 24h cleanup) ───────────────────

export async function getNotifications() {
  const session = await getSession();
  if (!session) return { notifications: [], unreadCount: 0 };

  await connectDB();

  // Clean up old notifications
  await Notification.deleteMany({
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  const notifications = await Notification.find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = notifications.filter((n) => !n.read).length;
  return JSON.parse(JSON.stringify({ notifications, unreadCount }));
}

// ─── Mark single as read ──────────────────────────────────────────────────────

export async function markNotificationRead(id: string) {
  const session = await getSession();
  if (!session) return;
  await connectDB();
  await Notification.findOneAndUpdate(
    { _id: id, userId: session.userId },
    { read: true },
  );
}

// ─── Mark all as read ─────────────────────────────────────────────────────────

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return;
  await connectDB();
  await Notification.updateMany(
    { userId: session.userId, read: false },
    { read: true },
  );
}

// ─── Finance: transaction added ───────────────────────────────────────────────

export async function notifyTransactionAdded(
  actorName: string,
  txType: "revenue" | "expense",
  amount: number,
  category: string,
  wallet: string,
  currency = "KES",
) {
  const isRevenue = txType === "revenue";
  await broadcastNotification(
    isRevenue ? "FINANCE_SYNCED" : "FINANCE_SYNCED",
    isRevenue ? `💰 Revenue Added` : `💸 Expense Recorded`,
    `${actorName} added ${isRevenue ? "revenue" : "expense"}: ${currency} ${amount.toLocaleString()} (${category}) from ${wallet} wallet.`,
    isRevenue ? "info" : "info",
    ["superadmin", "admin", "finance"],
  );
}

// ─── Finance: transfer made ───────────────────────────────────────────────────

export async function notifyTransfer(
  actorName: string,
  amount: number,
  currency = "KES",
) {
  await broadcastNotification(
    "FINANCE_SYNCED",
    "🔄 Wallet Transfer",
    `${actorName} transferred ${currency} ${amount.toLocaleString()} from Primary to Profit Wallet.`,
    "info",
    ["superadmin", "admin", "finance"],
  );
}

// ─── Operations: deal added / updated ────────────────────────────────────────

export async function notifyDealAdded(
  actorName: string,
  client: string,
  productType: string,
  status: string,
) {
  await broadcastNotification(
    "OPERATION_UPDATED",
    `📋 New Deal — ${client}`,
    `${actorName} added a ${productType} deal for ${client} with status: ${status}.`,
    "info",
    ["superadmin", "admin", "ops", "sales"],
  );
}

export async function notifyDealClosed(
  actorName: string,
  client: string,
  productType: string,
  revenue: number,
  currency = "KES",
) {
  await broadcastNotification(
    "DEAL_CLOSED",
    `🎯 Deal Closed — ${client}`,
    `${actorName} closed a ${productType} deal with ${client}. Revenue: ${currency} ${revenue.toLocaleString()} auto-synced to Finance.`,
    "info",
    ["superadmin", "admin", "ops", "sales", "finance"],
  );
}

export async function notifyDealStatusChanged(
  actorName: string,
  client: string,
  oldStatus: string,
  newStatus: string,
) {
  await broadcastNotification(
    "OPERATION_UPDATED",
    `📊 Deal Updated — ${client}`,
    `${actorName} changed ${client} status from ${oldStatus} → ${newStatus}.`,
    "info",
    ["superadmin", "admin", "ops", "sales"],
  );
}

// ─── Execution: log saved ─────────────────────────────────────────────────────

export async function notifyExecutionLog(
  actorName: string,
  date: string,
  calls: number,
  meetings: number,
  closings: number,
) {
  await broadcastNotification(
    "MISSING_LOG",
    `📝 Execution Log — ${date}`,
    `${actorName} logged: ${calls} calls, ${meetings} meetings, ${closings} closings.`,
    "info",
    ["superadmin", "admin", "ops"],
  );
}

// ─── User management ──────────────────────────────────────────────────────────

export async function notifyUserCreated(newUserEmail: string, role: string) {
  await broadcastNotification(
    "USER_CREATED",
    "👤 New User Created",
    `A new ${role} account was created for ${newUserEmail}.`,
    "info",
    ["superadmin"],
  );
}

// ─── Finance alerts (30-min repeat while condition persists) ──────────────────

export async function triggerFinanceNotifications(
  userId: string,
  primaryBalance: number,
  monthlyRevenue: number,
  monthlyExpenses: number,
  config: {
    minCashThreshold: number;
    minRunwayMonths: number;
    revenueTarget: number;
  },
) {
  await connectDB();
  const monthlyBurn = monthlyExpenses || 1;
  const runway = primaryBalance / monthlyBurn;
  const net = monthlyRevenue - monthlyExpenses;

  const checks = [
    {
      condition: primaryBalance < config.minCashThreshold,
      type: "CASH_RISK" as NotificationType,
      title: "⚠️ Cash Risk",
      message: `Primary wallet (${primaryBalance.toLocaleString()}) is below the minimum threshold of ${config.minCashThreshold.toLocaleString()}.`,
      severity: "critical" as NotificationSeverity,
    },
    {
      condition: runway < config.minRunwayMonths,
      type: "LOW_RUNWAY" as NotificationType,
      title: "⚠️ Low Runway",
      message: `Runway is ${runway.toFixed(1)} months — below the ${config.minRunwayMonths}-month minimum.`,
      severity: "critical" as NotificationSeverity,
    },
    {
      condition: monthlyExpenses > monthlyRevenue && monthlyRevenue > 0,
      type: "BURN_EXCEEDING" as NotificationType,
      title: "🔥 Burn Exceeding Revenue",
      message: `Monthly expenses (${monthlyExpenses.toLocaleString()}) exceed revenue (${monthlyRevenue.toLocaleString()}).`,
      severity: "warning" as NotificationSeverity,
    },
    {
      condition: net < 0,
      type: "NEGATIVE_CASHFLOW" as NotificationType,
      title: "📉 Negative Cash Flow",
      message: `Net cash flow is negative this month: ${net.toLocaleString()}.`,
      severity: "warning" as NotificationSeverity,
    },
  ];

  for (const check of checks) {
    if (!check.condition) continue;
    // Re-fire every 30 minutes while unresolved
    const recent = await Notification.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      type: check.type,
      read: false,
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    });
    if (!recent) {
      // Broadcast to all finance-relevant roles
      await broadcastNotification(
        check.type,
        check.title,
        check.message,
        check.severity,
        ["superadmin", "admin", "finance"],
      );
    }
  }
}
