"use server";

import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";
import { getSession } from "@/lib/session";
import mongoose from "mongoose";

type ActionResult = { success: boolean; message: string; data?: any };

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function requireOpsAccess() {
  const session = await getSession();
  if (!session || !["superadmin", "admin", "ops"].includes(session.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ─── Upload media to Cloudinary ───────────────────────────────────────────────

export async function uploadMedia(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireOpsAccess();

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, message: "No file provided." };
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    // Determine resource type
    const resourceType = file.type.startsWith("video/") ? "video" : "image";

    // Upload to Cloudinary with extended timeout for large files
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: resourceType,
      folder: "xdmails",
      timeout: 600000, // 10 minutes for large videos
      chunk_size: 6000000, // 6MB chunks for large files
      transformation:
        resourceType === "image"
          ? [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }]
          : undefined,
    });

    // Save to database
    await connectDB();
    const media = await Media.create({
      url: result.secure_url,
      publicId: result.public_id,
      type: resourceType,
      filename: file.name,
      size: file.size,
      uploadedBy: new mongoose.Types.ObjectId(session.userId),
    });

    return {
      success: true,
      message: "Media uploaded successfully.",
      data: {
        id: media._id.toString(),
        url: result.secure_url,
        type: resourceType,
        filename: file.name,
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[uploadMedia]", err);
    return {
      success: false,
      message:
        err instanceof Error && err.message.includes("Timeout")
          ? "Upload timeout. Please try a smaller file or check your connection."
          : "Failed to upload media.",
    };
  }
}

// ─── Get all media ────────────────────────────────────────────────────────────

export async function getMedia(type?: "image" | "video") {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await connectDB();

  const query = type ? { type } : {};
  const media = await Media.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return JSON.parse(JSON.stringify(media));
}

// ─── Delete media ─────────────────────────────────────────────────────────────

export async function deleteMedia(id: string): Promise<ActionResult> {
  try {
    await requireOpsAccess();
    await connectDB();

    const media = await Media.findById(id);
    if (!media) {
      return { success: false, message: "Media not found." };
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.type,
    });

    // Delete from database
    await Media.findByIdAndDelete(id);

    return { success: true, message: "Media deleted." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[deleteMedia]", err);
    return { success: false, message: "Failed to delete media." };
  }
}
