import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationType =
  | "CASH_RISK"
  | "LOW_RUNWAY"
  | "BURN_EXCEEDING"
  | "NEGATIVE_CASHFLOW"
  | "DEAL_CLOSED"
  | "LOW_CONVERSION"
  | "MISSING_LOG"
  | "LOW_PIPELINE"
  | "USER_CREATED"
  | "OPERATION_UPDATED"
  | "FINANCE_SYNCED";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
