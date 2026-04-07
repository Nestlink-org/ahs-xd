"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { generateOtp, otpExpiryDate, isOtpExpired } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { createSession, deleteSession } from "@/lib/session";
import { cookies } from "next/headers";
import { getRoleHome } from "@/lib/roles";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoginState =
  | { errors?: { email?: string; password?: string }; message?: string }
  | undefined;

type OtpState = { message?: string } | undefined;

// ─── Step 1: Email + Password ─────────────────────────────────────────────────

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  // Basic validation
  if (!email || !email.includes("@")) {
    return { errors: { email: "Please enter a valid email address." } };
  }
  if (!password || password.length < 6) {
    return { errors: { password: "Password must be at least 6 characters." } };
  }

  try {
    await connectDB();
    const user = await User.findOne({ email, isActive: true }).lean();

    // Use same error for both not-found and wrong password (prevent enumeration)
    if (!user) {
      return { message: "Invalid email or password." };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return { message: "Invalid email or password." };
    }

    // Generate OTP and save to DB
    const otp = generateOtp();
    const otpExpiry = otpExpiryDate();

    await User.updateOne({ _id: user._id }, { otp, otpExpiry });

    // Store email in a short-lived cookie to carry it to the verify step
    const cookieStore = await cookies();
    cookieStore.set("pending_email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60, // 5 minutes
      sameSite: "lax",
      path: "/",
    });

    // Send OTP email
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error("[loginAction]", err);
    return { message: "Something went wrong. Please try again." };
  }

  redirect("/verify");
}

// ─── Step 2: OTP Verification ─────────────────────────────────────────────────

export async function verifyOtpAction(
  _prev: OtpState,
  formData: FormData,
): Promise<OtpState> {
  const otp = (formData.get("otp") as string)?.trim();

  if (!otp || otp.length !== 4) {
    return { message: "Please enter the complete 4-digit code." };
  }

  const cookieStore = await cookies();
  const email = cookieStore.get("pending_email")?.value;

  if (!email) {
    return { message: "Session expired. Please log in again." };
  }

  try {
    await connectDB();
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      return { message: "Invalid session. Please log in again." };
    }

    if (isOtpExpired(user.otpExpiry)) {
      return {
        message: "Code has expired. Please log in again to get a new code.",
      };
    }

    if (user.otp !== otp) {
      return { message: "Incorrect code. Please try again." };
    }

    // Clear OTP fields + update last login
    const needsPasswordChange = !!user.mustChangePassword;
    user.otp = null;
    user.otpExpiry = null;
    user.lastLogin = new Date();
    await user.save();

    // Clear pending email cookie
    cookieStore.delete("pending_email");

    if (needsPasswordChange) {
      // Store uid for set-password step
      cookieStore.set("set_password_uid", user._id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60,
        sameSite: "lax",
        path: "/",
      });
    } else {
      await createSession(
        user._id.toString(),
        user.role,
        user.email,
        user.name,
      );
    }
  } catch (err) {
    console.error("[verifyOtpAction]", err);
    return { message: "Something went wrong. Please try again." };
  }

  const cookieStore2 = await cookies();
  const uid = cookieStore2.get("set_password_uid")?.value;
  if (uid) redirect("/set-password");

  // Redirect to role-based home
  const cookieStore3 = await cookies();
  const role = cookieStore3.get("role")?.value ?? "viewer";
  redirect(getRoleHome(role));
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

// ─── Set new password (first login / forgot password) ─────────────────────────

type SetPasswordState = { message?: string; success?: boolean } | undefined;

export async function setPasswordAction(
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 8) {
    return { message: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(password)) {
    return { message: "Password must contain at least one uppercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { message: "Password must contain at least one number." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { message: "Password must contain at least one special character." };
  }
  if (password !== confirm) {
    return { message: "Passwords do not match." };
  }

  const cookieStore = await cookies();
  const uid = cookieStore.get("set_password_uid")?.value;
  if (!uid) return { message: "Session expired. Please log in again." };

  try {
    await connectDB();
    const user = await User.findById(uid);
    if (!user) return { message: "User not found." };

    user.passwordHash = await bcrypt.hash(password, 12);
    user.mustChangePassword = false;
    await user.save();

    cookieStore.delete("set_password_uid");
    await createSession(user._id.toString(), user.role, user.email, user.name);
  } catch (err) {
    console.error("[setPasswordAction]", err);
    return { message: "Something went wrong. Please try again." };
  }

  redirect(getRoleHome((await cookies()).get("role")?.value ?? "viewer"));
}

// ─── Forgot password — step 1: send OTP ──────────────────────────────────────

type ForgotState = { message?: string; success?: boolean } | undefined;

export async function forgotPasswordAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { message: "Please enter a valid email address." };
  }

  try {
    await connectDB();
    const user = await User.findOne({ email, isActive: true });

    // Always show success to prevent email enumeration
    if (user) {
      const otp = generateOtp();
      const otpExpiry = otpExpiryDate();
      await User.updateOne({ _id: user._id }, { otp, otpExpiry });
      await sendOtpEmail(email, otp);
    }

    const cookieStore = await cookies();
    cookieStore.set("forgot_email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60,
      sameSite: "lax",
      path: "/",
    });
  } catch (err) {
    console.error("[forgotPasswordAction]", err);
    return { message: "Something went wrong. Please try again." };
  }

  redirect("/forgot-password/verify");
}

// ─── Forgot password — step 2: verify OTP ────────────────────────────────────

export async function forgotVerifyOtpAction(
  _prev: OtpState,
  formData: FormData,
): Promise<OtpState> {
  const otp = (formData.get("otp") as string)?.trim();
  if (!otp || otp.length !== 4) {
    return { message: "Please enter the complete 4-digit code." };
  }

  const cookieStore = await cookies();
  const email = cookieStore.get("forgot_email")?.value;
  if (!email) return { message: "Session expired. Please start again." };

  try {
    await connectDB();
    const user = await User.findOne({ email, isActive: true });
    if (!user) return { message: "Invalid session." };
    if (isOtpExpired(user.otpExpiry)) {
      return { message: "Code expired. Please request a new one." };
    }
    if (user.otp !== otp) return { message: "Incorrect code. Try again." };

    await User.updateOne({ _id: user._id }, { otp: null, otpExpiry: null });
    cookieStore.delete("forgot_email");

    cookieStore.set("set_password_uid", user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      sameSite: "lax",
      path: "/",
    });
  } catch (err) {
    console.error("[forgotVerifyOtpAction]", err);
    return { message: "Something went wrong. Please try again." };
  }

  redirect("/set-password");
}

// ─── Resend OTP (login flow) ──────────────────────────────────────────────────

export async function resendOtpAction(): Promise<{ message?: string }> {
  const cookieStore = await cookies();
  const email = cookieStore.get("pending_email")?.value;

  if (!email) return { message: "Session expired. Please log in again." };

  try {
    await connectDB();
    const user = await User.findOne({ email, isActive: true });
    if (!user) return { message: "User not found." };

    const otp = generateOtp();
    const otpExpiry = otpExpiryDate();
    await User.updateOne({ _id: user._id }, { otp, otpExpiry });
    await sendOtpEmail(email, otp);

    return {};
  } catch (err) {
    console.error("[resendOtpAction]", err);
    return { message: "Failed to resend code. Please try again." };
  }
}

// ─── Resend OTP (forgot password flow) ───────────────────────────────────────

export async function resendForgotOtpAction(): Promise<{ message?: string }> {
  const cookieStore = await cookies();
  const email = cookieStore.get("forgot_email")?.value;

  if (!email) return { message: "Session expired. Please start again." };

  try {
    await connectDB();
    const user = await User.findOne({ email, isActive: true });
    if (!user) return { message: "User not found." };

    const otp = generateOtp();
    const otpExpiry = otpExpiryDate();
    await User.updateOne({ _id: user._id }, { otp, otpExpiry });
    await sendOtpEmail(email, otp);

    return {};
  } catch (err) {
    console.error("[resendForgotOtpAction]", err);
    return { message: "Failed to resend code. Please try again." };
  }
}
