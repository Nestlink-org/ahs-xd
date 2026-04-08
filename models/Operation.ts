import mongoose, { Schema, Document, Model } from "mongoose";

export type OperationType = "SafeSport" | "ResultShield";
export type OperationStatus = "Lead" | "Ongoing" | "Closed";

export interface IOperation extends Document {
  date: Date;
  type: OperationType;
  client: string;
  school: string;
  athletes: number;
  revenue: number;
  cost: number;
  status: OperationStatus;
  contract: boolean;
  financeLinked: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OperationSchema = new Schema<IOperation>(
  {
    date: { type: Date, required: true },
    type: { type: String, enum: ["SafeSport", "ResultShield"], required: true },
    client: { type: String, required: true, trim: true },
    school: { type: String, default: "", trim: true },
    athletes: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Lead", "Ongoing", "Closed"],
      default: "Lead",
    },
    contract: { type: Boolean, default: false },
    financeLinked: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

OperationSchema.index({ date: -1 });
OperationSchema.index({ type: 1, status: 1 });

const Operation: Model<IOperation> =
  mongoose.models.Operation ??
  mongoose.model<IOperation>("Operation", OperationSchema);

export default Operation;
