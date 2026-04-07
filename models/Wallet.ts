import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWallet extends Document {
  type: "primary" | "profit";
  name: string;
  balance: number;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    type: {
      type: String,
      enum: ["primary", "profit"],
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Wallet: Model<IWallet> =
  mongoose.models.Wallet ?? mongoose.model<IWallet>("Wallet", WalletSchema);

export default Wallet;
