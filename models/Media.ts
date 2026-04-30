import mongoose, { Schema, Document } from "mongoose";

export interface IMedia extends Document {
  url: string;
  publicId: string;
  type: "image" | "video";
  filename: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Media ||
  mongoose.model<IMedia>("Media", MediaSchema);
