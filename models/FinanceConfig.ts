import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFinanceConfig extends Document {
  minCashThreshold: number;
  minRunwayMonths: number;
  revenueTarget: number;
  currency: string;
  updatedBy: mongoose.Types.ObjectId | null;
  updatedAt: Date;
}

const FinanceConfigSchema = new Schema<IFinanceConfig>(
  {
    minCashThreshold: { type: Number, default: 50000 },
    minRunwayMonths: { type: Number, default: 3 },
    revenueTarget: { type: Number, default: 100000 },
    currency: { type: String, default: "KES" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

const FinanceConfig: Model<IFinanceConfig> =
  mongoose.models.FinanceConfig ??
  mongoose.model<IFinanceConfig>("FinanceConfig", FinanceConfigSchema);

export default FinanceConfig;
