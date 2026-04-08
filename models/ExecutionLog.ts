import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExecutionLog extends Document {
  date: Date;
  calls: number;
  meetings: number;
  followUps: number;
  closings: number;
  revenueWon: number;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionLogSchema = new Schema<IExecutionLog>(
  {
    date: { type: Date, required: true },
    calls: { type: Number, default: 0, min: 0 },
    meetings: { type: Number, default: 0, min: 0 },
    followUps: { type: Number, default: 0, min: 0 },
    closings: { type: Number, default: 0, min: 0 },
    revenueWon: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "", trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

ExecutionLogSchema.index({ date: -1 });
ExecutionLogSchema.index({ createdBy: 1, date: -1 });

const ExecutionLog: Model<IExecutionLog> =
  mongoose.models.ExecutionLog ??
  mongoose.model<IExecutionLog>("ExecutionLog", ExecutionLogSchema);

export default ExecutionLog;
