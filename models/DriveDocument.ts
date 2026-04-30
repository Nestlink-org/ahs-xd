import mongoose, { Schema, Document } from "mongoose";

export interface IDriveDocument extends Document {
  name: string;
  type: "receipt" | "invoice" | "statement" | "contract" | "report" | "other";
  fileUrl: string;
  fileType: string; // pdf, jpg, png, etc
  fileSize: number; // in bytes
  folder: mongoose.Types.ObjectId | null;
  description?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DriveDocumentSchema = new Schema<IDriveDocument>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["receipt", "invoice", "statement", "contract", "report", "other"],
      required: true,
    },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    folder: { type: Schema.Types.ObjectId, ref: "DriveFolder", default: null },
    description: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export default mongoose.models.DriveDocument ||
  mongoose.model<IDriveDocument>("DriveDocument", DriveDocumentSchema);
