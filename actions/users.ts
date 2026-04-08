"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User, { type UserRole } from "@/models/User";
import { getSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/mailer";

type ActionResult = { success: boolean; message: string };

// ─── Guard: superadmin only ───────────────────────────────────────────────────
async function requireSuperadmin() {
  const session = await getSession();
  if (!session || session.role !== "superadmin") {
    throw new Error("Unauthorized");
  }
  return session;
}

// ─── List users ───────────────────────────────────────────────────────────────
export async function getUsers() {
  const session = await getSession();
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    throw new Error("Unauthorized");
  }
  await connectDB();
  const users = await User.find({}, "-passwordHash -otp -otpExpiry")
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(users));
}

// ─── Create user ──────────────────────────────────────────────────────────────
const TEMP_PASSWORD = "Pass123!";

export async function createUser(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const role = formData.get("role") as UserRole;

    if (!name || !email || !role) {
      return { success: false, message: "All fields are required." };
    }

    await connectDB();
    const exists = await User.findOne({ email });
    if (exists) {
      return {
        success: false,
        message: "A user with this email already exists.",
      };
    }

    const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 12);
    await User.create({
      name,
      email,
      passwordHash,
      role,
      isActive: true,
      mustChangePassword: true,
    });

    // Send welcome email (non-blocking — don't fail user creation if email fails)
    sendWelcomeEmail(email, name, role, TEMP_PASSWORD).catch((err) =>
      console.error("[createUser] welcome email failed:", err),
    );

    revalidatePath("/dashboard/superadmin");

    const { notifyUserCreated } = await import("@/actions/notifications");
    notifyUserCreated(email, role).catch(() => {});

    return { success: true, message: `User ${email} created successfully.` };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[createUser]", err);
    return { success: false, message: "Failed to create user." };
  }
}

// ─── Update user ──────────────────────────────────────────────────────────────
export async function updateUser(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();

    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const role = formData.get("role") as UserRole;
    const password = formData.get("password") as string;

    if (!id || !name || !role) {
      return { success: false, message: "Missing required fields." };
    }

    await connectDB();
    const update: Record<string, unknown> = { name };

    // Superadmin cannot change their own role
    const session = await getSession();
    if (id !== session?.userId) {
      update.role = role;
    }

    if (password && password.length > 0) {
      if (password.length < 8) {
        return {
          success: false,
          message: "Password must be at least 8 characters.",
        };
      }
      update.passwordHash = await bcrypt.hash(password, 12);
    }

    await User.findByIdAndUpdate(id, update);
    revalidatePath("/dashboard/superadmin");
    return { success: true, message: "User updated successfully." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[updateUser]", err);
    return { success: false, message: "Failed to update user." };
  }
}

// ─── Suspend / Unsuspend ──────────────────────────────────────────────────────
export async function toggleSuspendUser(
  userId: string,
  suspend: boolean,
): Promise<ActionResult> {
  try {
    const session = await requireSuperadmin();
    if (session.userId === userId) {
      return {
        success: false,
        message: "You cannot suspend your own account.",
      };
    }
    await connectDB();
    await User.findByIdAndUpdate(userId, { isActive: !suspend });
    revalidatePath("/dashboard/superadmin");
    return {
      success: true,
      message: suspend ? "User suspended." : "User reactivated.",
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[toggleSuspendUser]", err);
    return { success: false, message: "Failed to update user status." };
  }
}

// ─── Soft delete ──────────────────────────────────────────────────────────────
export async function softDeleteUser(userId: string): Promise<ActionResult> {
  try {
    const session = await requireSuperadmin();

    if (session.userId === userId) {
      return { success: false, message: "You cannot delete your own account." };
    }

    await connectDB();
    // Soft delete: deactivate + mark email so it can't be reused accidentally
    await User.findByIdAndUpdate(userId, {
      isActive: false,
      email: `deleted_${Date.now()}_${userId}`,
    });

    revalidatePath("/dashboard/superadmin");
    return { success: true, message: "User deleted." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[softDeleteUser]", err);
    return { success: false, message: "Failed to delete user." };
  }
}

// ─── Stats for overview ───────────────────────────────────────────────────────
export async function getUserStats() {
  const session = await getSession();
  if (!session || session.role !== "superadmin")
    throw new Error("Unauthorized");

  await connectDB();
  const [total, active, suspended, pending] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true, mustChangePassword: false }),
    User.countDocuments({ isActive: false }),
    User.countDocuments({ mustChangePassword: true }),
  ]);

  const byRole = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);

  return JSON.parse(
    JSON.stringify({ total, active, suspended, pending, byRole }),
  );
}
