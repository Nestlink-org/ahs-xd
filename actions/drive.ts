"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import DriveFolder from "@/models/DriveFolder";
import DriveDocument from "@/models/DriveDocument";
import { getSession } from "@/lib/session";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type ActionResult = { success: boolean; message: string; data?: any };

async function requireFinanceAccess() {
  const session = await getSession();
  if (
    !session ||
    !["superadmin", "admin", "finance", "ceo"].includes(session.role)
  ) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ─── Folder Actions ───────────────────────────────────────────────────────────

export async function createFolder(
  name: string,
  parentFolderId: string | null,
  color: string = "#3b82f6",
): Promise<ActionResult> {
  try {
    const session = await requireFinanceAccess();
    await connectDB();

    const folder = await DriveFolder.create({
      name,
      parentFolder: parentFolderId
        ? new mongoose.Types.ObjectId(parentFolderId)
        : null,
      color,
      createdBy: new mongoose.Types.ObjectId(session.userId),
    });

    revalidatePath("/dashboard/finance");

    return {
      success: true,
      message: "Folder created successfully",
      data: { id: folder._id.toString() },
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[createFolder]", err);
    return { success: false, message: "Failed to create folder." };
  }
}

export async function getFolders(parentFolderId: string | null = null) {
  try {
    const session = await requireFinanceAccess();
    await connectDB();

    const folders = await DriveFolder.find({
      parentFolder: parentFolderId
        ? new mongoose.Types.ObjectId(parentFolderId)
        : null,
    })
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(folders));
  } catch (err) {
    console.error("[getFolders]", err);
    return [];
  }
}

export async function deleteFolder(folderId: string): Promise<ActionResult> {
  try {
    await requireFinanceAccess();
    await connectDB();

    // Delete all documents in this folder
    const documents = await DriveDocument.find({
      folder: new mongoose.Types.ObjectId(folderId),
    });

    // Delete from Cloudinary
    for (const doc of documents) {
      try {
        const publicId = doc.fileUrl
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(`xddrive/${publicId}`);
      } catch (error) {
        console.error("Failed to delete from Cloudinary:", error);
      }
    }

    // Delete documents from DB
    await DriveDocument.deleteMany({
      folder: new mongoose.Types.ObjectId(folderId),
    });

    // Delete subfolders recursively
    const subfolders = await DriveFolder.find({
      parentFolder: new mongoose.Types.ObjectId(folderId),
    });
    for (const subfolder of subfolders) {
      await deleteFolder(subfolder._id.toString());
    }

    // Delete the folder itself
    await DriveFolder.findByIdAndDelete(folderId);

    revalidatePath("/dashboard/finance");

    return { success: true, message: "Folder deleted successfully" };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[deleteFolder]", err);
    return { success: false, message: "Failed to delete folder." };
  }
}

export async function renameFolder(
  folderId: string,
  newName: string,
): Promise<ActionResult> {
  try {
    await requireFinanceAccess();
    await connectDB();

    await DriveFolder.findByIdAndUpdate(folderId, { name: newName });

    revalidatePath("/dashboard/finance");

    return { success: true, message: "Folder renamed successfully" };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[renameFolder]", err);
    return { success: false, message: "Failed to rename folder." };
  }
}

// ─── Document Actions ─────────────────────────────────────────────────────────

export async function uploadDocument(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireFinanceAccess();

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;
    const folderId = formData.get("folderId") as string | null;
    const file = formData.get("file") as File;

    if (!name || !type || !file) {
      return { success: false, message: "Missing required fields" };
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    // Determine resource type for Cloudinary
    const resourceType = file.type.startsWith("image/") ? "image" : "raw";

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: resourceType,
      folder: "xddrive",
      timeout: 600000, // 10 minutes
    });

    await connectDB();

    const document = await DriveDocument.create({
      name,
      type,
      description,
      fileUrl: result.secure_url,
      fileType: file.type,
      fileSize: file.size,
      folder: folderId ? new mongoose.Types.ObjectId(folderId) : null,
      uploadedBy: new mongoose.Types.ObjectId(session.userId),
    });

    revalidatePath("/dashboard/finance");

    return {
      success: true,
      message: "Document uploaded successfully",
      data: { id: document._id.toString() },
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[uploadDocument]", err);
    return { success: false, message: "Failed to upload document." };
  }
}

export async function getDocuments(folderId: string | null = null) {
  try {
    await requireFinanceAccess();
    await connectDB();

    const documents = await DriveDocument.find({
      folder: folderId ? new mongoose.Types.ObjectId(folderId) : null,
    })
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(documents));
  } catch (err) {
    console.error("[getDocuments]", err);
    return [];
  }
}

export async function deleteDocument(
  documentId: string,
): Promise<ActionResult> {
  try {
    await requireFinanceAccess();
    await connectDB();

    const document = await DriveDocument.findById(documentId);
    if (!document) {
      return { success: false, message: "Document not found" };
    }

    // Delete from Cloudinary
    try {
      const publicId = document.fileUrl
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      await cloudinary.uploader.destroy(`xddrive/${publicId}`, {
        resource_type: "raw",
      });
    } catch (error) {
      console.error("Failed to delete from Cloudinary:", error);
    }

    await DriveDocument.findByIdAndDelete(documentId);

    revalidatePath("/dashboard/finance");

    return { success: true, message: "Document deleted successfully" };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[deleteDocument]", err);
    return { success: false, message: "Failed to delete document." };
  }
}

export async function moveDocument(
  documentId: string,
  targetFolderId: string | null,
): Promise<ActionResult> {
  try {
    await requireFinanceAccess();
    await connectDB();

    await DriveDocument.findByIdAndUpdate(documentId, {
      folder: targetFolderId
        ? new mongoose.Types.ObjectId(targetFolderId)
        : null,
    });

    revalidatePath("/dashboard/finance");

    return { success: true, message: "Document moved successfully" };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[moveDocument]", err);
    return { success: false, message: "Failed to move document." };
  }
}

export async function searchDocuments(query: string) {
  try {
    await requireFinanceAccess();
    await connectDB();

    const documents = await DriveDocument.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return JSON.parse(JSON.stringify(documents));
  } catch (err) {
    console.error("[searchDocuments]", err);
    return [];
  }
}
