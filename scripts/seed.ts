/**
 * Seed script — superadmin + wallets + finance config
 * Run with: npx tsx scripts/seed.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not set in .env.local");
  process.exit(1);
}

// ─── Schemas (inline to avoid Next.js module issues) ─────────────────────────

const UserModel =
  mongoose.models.User ??
  mongoose.model(
    "User",
    new mongoose.Schema(
      {
        name: String,
        email: { type: String, unique: true, lowercase: true },
        passwordHash: String,
        role: { type: String, default: "viewer" },
        otp: { type: String, default: null },
        otpExpiry: { type: Date, default: null },
        isActive: { type: Boolean, default: true },
        mustChangePassword: { type: Boolean, default: false },
        lastLogin: { type: Date, default: null },
      },
      { timestamps: true },
    ),
  );

const WalletModel =
  mongoose.models.Wallet ??
  mongoose.model(
    "Wallet",
    new mongoose.Schema(
      {
        type: { type: String, unique: true },
        name: String,
        balance: { type: Number, default: 0 },
      },
      { timestamps: true },
    ),
  );

const FinanceConfigModel =
  mongoose.models.FinanceConfig ??
  mongoose.model(
    "FinanceConfig",
    new mongoose.Schema(
      {
        minCashThreshold: { type: Number, default: 50000 },
        minRunwayMonths: { type: Number, default: 3 },
        revenueTarget: { type: Number, default: 100000 },
        currency: { type: String, default: "KES" },
      },
      { timestamps: true },
    ),
  );

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected to MongoDB\n");

  // Superadmin
  const email = "melvinssimon@gmail.com";
  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.log("ℹ️   Superadmin already exists — skipping.");
  } else {
    const passwordHash = await bcrypt.hash("Simon123.", 12);
    await UserModel.create({
      name: "Melvin Simon",
      email,
      passwordHash,
      role: "superadmin",
      isActive: true,
      mustChangePassword: false,
    });
    console.log("✅  Superadmin created");
    console.log("    Email   :", email);
    console.log("    Password: Simon123.");
  }

  // Wallets
  for (const w of [
    { type: "primary", name: "Primary Wallet" },
    { type: "profit", name: "Profit Wallet" },
  ]) {
    const exists = await WalletModel.findOne({ type: w.type });
    if (!exists) {
      await WalletModel.create(w);
      console.log(`✅  Created ${w.name}`);
    } else {
      console.log(`ℹ️   ${w.name} already exists`);
    }
  }

  // Finance config
  const cfg = await FinanceConfigModel.findOne();
  if (!cfg) {
    await FinanceConfigModel.create({});
    console.log("✅  Finance config created with defaults");
  } else {
    console.log("ℹ️   Finance config already exists");
  }

  await mongoose.disconnect();
  console.log("\n✅  Seed complete");
}

main().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
