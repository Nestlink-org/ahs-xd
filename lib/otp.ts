import crypto from "crypto";

const OTP_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

/** Generates a cryptographically random 4-digit OTP */
export function generateOtp(): string {
  const num = crypto.randomInt(1000, 9999);
  return String(num).padStart(4, "0");
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MS);
}

export function isOtpExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > expiry;
}
