import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole =
  | "superadmin"
  | "admin"
  | "finance"
  | "ops"
  | "sales"
  | "viewer";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  otp: string | null;
  otpExpiry: Date | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "finance", "ops", "sales", "viewer"],
      default: "viewer",
    },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true },
);

// Prevent model re-compilation in dev hot reloads
const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
