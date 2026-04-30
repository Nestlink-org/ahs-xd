"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import EmailCampaign from "@/models/EmailCampaign";
import { getSession } from "@/lib/session";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

type ActionResult = { success: boolean; message: string; data?: any };

async function requireOpsAccess() {
  const session = await getSession();
  if (!session || !["superadmin", "admin", "ops"].includes(session.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

function createEmailTemplate(htmlContent: string): string {
  const year = new Date().getFullYear();

  // STEP 1: Wrap all emojis with fixed-size spans to prevent scaling
  // This regex matches most common emoji unicode ranges
  let processedContent = htmlContent.replace(
    /([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{231A}-\u{23FF}\u{25A0}-\u{27BF}])/gu,
    '<span style="display:inline-block;font-size:16px;line-height:1;width:16px;height:16px;vertical-align:-2px;">$1</span>',
  );

  // STEP 2: Add inline styles to headings (Gmail ignores CSS classes)
  processedContent = processedContent
    .replace(
      /<h1>/g,
      '<h1 style="font-size:24px;font-weight:bold;margin:16px 0;line-height:1.3;">',
    )
    .replace(
      /<h2>/g,
      '<h2 style="font-size:20px;font-weight:bold;margin:14px 0;line-height:1.3;">',
    )
    .replace(
      /<h3>/g,
      '<h3 style="font-size:18px;font-weight:bold;margin:12px 0;line-height:1.3;">',
    )
    .replace(/<p>/g, '<p style="font-size:16px;line-height:1.5;margin:8px 0;">')
    .replace(
      /<ul>/g,
      '<ul style="font-size:16px;line-height:1.5;margin:8px 0;padding-left:24px;">',
    )
    .replace(
      /<ol>/g,
      '<ol style="font-size:16px;line-height:1.5;margin:8px 0;padding-left:24px;">',
    )
    .replace(/<li>/g, '<li style="margin:4px 0;">')
    .replace(/<strong>/g, '<strong style="font-weight:bold;">')
    .replace(/<em>/g, '<em style="font-style:italic;">')
    .replace(/<a /g, '<a style="color:#a3e635;text-decoration:underline;" ');

  // STEP 3: Add inline styles to images (content images, not emojis)
  processedContent = processedContent.replace(
    /<img(?![^>]*style=["'][^"']*font-size:16px)/g,
    '<img style="max-width:600px;width:100%;height:auto;display:block;margin:10px auto;border-radius:8px;"',
  );

  // STEP 4: Replace video tags (Gmail doesn't support video)
  processedContent = processedContent.replace(
    /<video[^>]*>\s*<source[^>]+src=["']([^"']+)["'][^>]*>[^<]*<\/video>/gi,
    (match, videoUrl) => {
      return `<div style="max-width:600px;margin:20px auto;text-align:center;padding:20px;background:#f3f4f6;border-radius:8px;">
        <p style="margin:0 0 10px;font-size:16px;color:#374151;">📹 Video Content</p>
        <a href="${videoUrl}" style="display:inline-block;padding:10px 20px;background:#a3e635;color:#000;text-decoration:none;border-radius:6px;font-weight:bold;">Watch Video</a>
      </div>`;
    },
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AHS Communication</title>
  <style>
    /* Reset and base styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: #1f2937;
    }
    
    /* Gmail emoji image fix - CRITICAL */
    /* Target Gmail's converted emoji images specifically */
    img[goomoji],
    img[data-goomoji],
    img[data-emoji],
    img.emoji,
    img[src*="gstatic.com/s/e/notoemoji"],
    img[src*="fonts.gstatic.com"],
    img[src*="mail.google.com/mail/e/"] {
      display: inline-block !important;
      width: 16px !important;
      height: 16px !important;
      max-width: 16px !important;
      max-height: 16px !important;
      min-width: 16px !important;
      min-height: 16px !important;
      margin: 0 2px !important;
      padding: 0 !important;
      vertical-align: -2px !important;
      border: none !important;
      background: none !important;
      border-radius: 0 !important;
      object-fit: contain !important;
    }
    
    /* Emoji wrapper spans */
    span[style*="font-size:16px"][style*="width:16px"] {
      display: inline-block !important;
      font-size: 16px !important;
      line-height: 1 !important;
      width: 16px !important;
      height: 16px !important;
      vertical-align: -2px !important;
    }
    
    @media only screen and (max-width: 600px) {
      img:not([goomoji]):not([data-emoji]):not(.emoji):not([src*="gstatic.com"]):not([src*="mail.google.com"]) {
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2e1a,#0f1f0f);padding:32px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:28px;font-weight:900;letter-spacing:6px;text-transform:uppercase;color:#a3e635;">
                AHS
              </p>
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9ca3af;">
                Ayot Health Solutions
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;font-size:16px;line-height:1.5;color:#1f2937;">
              ${processedContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-align:center;">
                © ${year} Ayot Health Solutions. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                info@ayothealthsolutions.ke
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Save draft campaign ──────────────────────────────────────────────────────

export async function saveDraftCampaign(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireOpsAccess();

    const subject = (formData.get("subject") as string)?.trim();
    const htmlContent = (formData.get("htmlContent") as string)?.trim();
    const recipientsRaw = (formData.get("recipients") as string)?.trim();

    if (!subject || !htmlContent || !recipientsRaw) {
      return {
        success: false,
        message: "Subject, content, and recipients are required.",
      };
    }

    const recipients = recipientsRaw
      .split(/[,;\n]/)
      .map((e) => e.trim())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (recipients.length === 0) {
      return {
        success: false,
        message: "No valid email addresses found.",
      };
    }

    await connectDB();

    const campaign = await EmailCampaign.create({
      subject,
      htmlContent,
      recipients,
      attachments: [],
      status: "draft",
      createdBy: new mongoose.Types.ObjectId(session.userId),
    });

    revalidatePath("/dashboard/ops");

    return {
      success: true,
      message: `Draft saved with ${recipients.length} recipients.`,
      data: { id: campaign._id.toString() },
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[saveDraftCampaign]", err);
    return { success: false, message: "Failed to save draft." };
  }
}

// ─── Send campaign ────────────────────────────────────────────────────────────

export async function sendCampaign(campaignId: string): Promise<ActionResult> {
  try {
    const session = await requireOpsAccess();
    await connectDB();

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      return { success: false, message: "Campaign not found." };
    }

    if (campaign.status === "sent") {
      return { success: false, message: "Campaign already sent." };
    }

    campaign.status = "sending";
    await campaign.save();

    let sentCount = 0;
    let failedCount = 0;

    const wrappedHtml = createEmailTemplate(campaign.htmlContent);

    for (const recipient of campaign.recipients) {
      try {
        await transporter.sendMail({
          from: `"Ayot Health Solutions" <${process.env.ZOHO_EMAIL}>`,
          to: recipient,
          subject: campaign.subject,
          html: wrappedHtml,
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${recipient}:`, error);
        failedCount++;
      }
    }

    campaign.status =
      failedCount === campaign.recipients.length ? "failed" : "sent";
    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    campaign.sentAt = new Date();
    await campaign.save();

    revalidatePath("/dashboard/ops");

    return {
      success: true,
      message: `Campaign sent: ${sentCount} successful, ${failedCount} failed.`,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[sendCampaign]", err);
    return { success: false, message: "Failed to send campaign." };
  }
}

// ─── Get campaigns ────────────────────────────────────────────────────────────

export async function getCampaigns() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await connectDB();

  const campaigns = await EmailCampaign.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return JSON.parse(JSON.stringify(campaigns));
}

// ─── Delete campaign ──────────────────────────────────────────────────────────

export async function deleteCampaign(id: string): Promise<ActionResult> {
  try {
    await requireOpsAccess();
    await connectDB();

    const campaign = await EmailCampaign.findByIdAndDelete(id);
    if (!campaign) {
      return { success: false, message: "Campaign not found." };
    }

    revalidatePath("/dashboard/ops");

    return { success: true, message: "Campaign deleted." };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return { success: false, message: "Unauthorized." };
    }
    console.error("[deleteCampaign]", err);
    return { success: false, message: "Failed to delete campaign." };
  }
}
