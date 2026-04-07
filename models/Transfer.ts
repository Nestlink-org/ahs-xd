import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransfer extends Document {
  amount: number;
  note: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TransferSchema = new Schema<ITransfer>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, default: "", trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const Transfer: Model<ITransfer> =
  mongoose.models.Transfer ??
  mongoose.model<ITransfer>("Transfer", TransferSchema);

export default Transfer;
