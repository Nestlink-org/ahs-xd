import mongoose, { Schema, Document } from "mongoose";

export interface IEmailCampaign extends Document {
  subject: string;
  htmlContent: string;
  recipients: string[];
  attachments: { filename: string; path: string }[];
  status: "draft" | "queued" | "sending" | "sent" | "failed";
  sentCount: number;
  failedCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  sentAt?: Date;
}

const EmailCampaignSchema = new Schema<IEmailCampaign>(
  {
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    recipients: [{ type: String, required: true }],
    attachments: [
      {
        filename: String,
        path: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "queued", "sending", "sent", "failed"],
      default: "draft",
    },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentAt: Date,
  },
  { timestamps: true },
);

export default mongoose.models.EmailCampaign ||
  mongoose.model<IEmailCampaign>("EmailCampaign", EmailCampaignSchema);
