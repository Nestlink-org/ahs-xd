import mongoose, { Schema, Document } from "mongoose";

export interface IDriveFolder extends Document {
  name: string;
  parentFolder: mongoose.Types.ObjectId | null;
  color: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DriveFolderSchema = new Schema<IDriveFolder>(
  {
    name: { type: String, required: true },
    parentFolder: {
      type: Schema.Types.ObjectId,
      ref: "DriveFolder",
      default: null,
    },
    color: { type: String, default: "#3b82f6" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export default mongoose.models.DriveFolder ||
  mongoose.model<IDriveFolder>("DriveFolder", DriveFolderSchema);
