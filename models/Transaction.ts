import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType = "revenue" | "expense";
export type WalletType = "primary" | "profit";

export interface ITransaction extends Document {
  date: Date;
  type: TransactionType;
  category: string;
  platform: string;
  amount: number;
  wallet: WalletType;
  services: string[]; // up to 2 named services for expense distribution
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    date: { type: Date, required: true },
    type: { type: String, enum: ["revenue", "expense"], required: true },
    category: { type: String, required: true, trim: true },
    platform: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    wallet: { type: String, enum: ["primary", "profit"], required: true },
    services: {
      type: [String],
      default: [],
      validate: [(v: string[]) => v.length <= 2, "Max 2 services allowed"],
    },
    notes: { type: String, default: "", trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Index for fast period-based aggregations
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ wallet: 1, date: -1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ??
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
