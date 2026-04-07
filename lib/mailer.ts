import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

function otpEmailTemplate(otp: string, expiryMinutes = 2): string {
  const year = new Date().getFullYear();
  const digits = otp.split("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your AHS-XD Login Code</title>
</head>
<body style="margin:0;padding:0;background:#080c08;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080c08;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

          <!-- Brand header -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <p style="margin:0 0 4px;font-size:26px;font-weight:900;letter-spacing:8px;text-transform:uppercase;color:#a3e635;">
                AHS-XD<span style="font-size:12px;font-weight:400;color:#4b5563;vertical-align:super;letter-spacing:2px;margin-left:3px;">v2.7</span>
              </p>
              <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#374151;">
                Executive Dashboard
              </p>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#0d1117;border:1px solid #1f2937;border-radius:20px;padding:44px 40px 36px;box-shadow:0 0 60px rgba(163,230,53,0.04);">

              <!-- Lock icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1a2e1a,#0f1f0f);border:1px solid #2d4a1e;border-radius:50%;width:56px;height:56px;text-align:center;line-height:56px;font-size:24px;">
                          🔐
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f9fafb;text-align:center;letter-spacing:-0.3px;">
                Verify your identity
              </p>
              <p style="margin:0 0 36px;font-size:14px;color:#6b7280;text-align:center;line-height:1.7;">
                Enter this code in the AHS-XD login screen.<br/>
                Expires in <strong style="color:#a3e635;">${expiryMinutes} minutes</strong>.
              </p>

              <!-- OTP dotted card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" style="border:2px dashed #2d4a1e;border-radius:16px;padding:28px 36px;background:#0a160a;">
                      <tr>
                        <td align="center" style="padding-bottom:10px;">
                          <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#4b5563;">
                            One-time code
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              ${digits
                                .map(
                                  (d, i) => `
                              <td style="padding:0 ${i === 1 ? "6px 0 6px" : "5px"};">
                                <div style="width:54px;height:64px;background:#111f11;border:1px solid #2d4a1e;border-radius:12px;text-align:center;line-height:64px;font-size:32px;font-weight:900;color:#a3e635;font-family:'Courier New',monospace;">
                                  ${d}
                                </div>
                              </td>`,
                                )
                                .join("")}
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top:14px;">
                          <p style="margin:0;font-size:11px;color:#374151;letter-spacing:1px;">
                            Do not share this code
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #161d16;"></td>
                </tr>
              </table>

              <!-- Warning banner -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1a1500;border:1px solid #2a2000;border-radius:10px;padding:14px 18px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;">
                      ⚠️&nbsp; If you didn't request this, someone may be trying to access your account.
                      <strong style="color:#f9fafb;">Never share this code</strong> with anyone — including AHS staff.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #1f2937;padding-top:20px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;color:#374151;letter-spacing:1px;">
                      © ${year} AHS-XD &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; Authorized personnel only
                    </p>
                    <p style="margin:0;font-size:10px;color:#1f2937;">
                      This is an automated message — please do not reply
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"AHS-XD" <${process.env.ZOHO_EMAIL}>`,
    to,
    subject: `${otp} — Your AHS-XD login code`,
    html: otpEmailTemplate(otp),
    text: `Your AHS-XD login code is: ${otp}\n\nThis code expires in 2 minutes.\n\nIf you did not request this, please ignore this email.`,
  });
}

function welcomeEmailTemplate(
  name: string,
  email: string,
  role: string,
  tempPassword: string,
): string {
  const year = new Date().getFullYear();
  const loginUrl = "https://ahs-xd.ayothealthsolutions.ke/login";

  const roleLabels: Record<string, string> = {
    superadmin: "Superadmin",
    admin: "Admin",
    finance: "Finance",
    ops: "Operations",
    sales: "Sales",
    viewer: "Viewer",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to AHS-XD</title>
</head>
<body style="margin:0;padding:0;background:#080c08;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080c08;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <p style="margin:0 0 4px;font-size:26px;font-weight:900;letter-spacing:8px;text-transform:uppercase;color:#a3e635;">
                AHS-XD<span style="font-size:12px;font-weight:400;color:#4b5563;vertical-align:super;letter-spacing:2px;margin-left:3px;">v2.7</span>
              </p>
              <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#374151;">
                Executive Dashboard
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0d1117;border:1px solid #1f2937;border-radius:20px;padding:44px 40px 36px;box-shadow:0 0 60px rgba(163,230,53,0.04);">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1a2e1a,#0f1f0f);border:1px solid #2d4a1e;border-radius:50%;width:56px;height:56px;text-align:center;line-height:56px;font-size:26px;">
                          👋
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f9fafb;text-align:center;">
                Welcome, ${name}
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#6b7280;text-align:center;line-height:1.7;">
                Your account has been created on <strong style="color:#a3e635;">AHS-XD</strong>.<br/>
                You have been assigned the <strong style="color:#f9fafb;">${roleLabels[role] ?? role}</strong> role.
              </p>

              <!-- Credentials card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border:2px dashed #2d4a1e;border-radius:16px;padding:24px 28px;background:#0a160a;">
                    <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#4b5563;text-align:center;">
                      Your login credentials
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 3px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Email</p>
                          <p style="margin:0;font-size:15px;font-weight:600;color:#f9fafb;font-family:'Courier New',monospace;">${email}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top:1px solid #1f2937;padding-top:12px;">
                          <p style="margin:0 0 3px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Temporary password</p>
                          <p style="margin:0;font-size:20px;font-weight:900;color:#a3e635;font-family:'Courier New',monospace;letter-spacing:2px;">${tempPassword}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}"
                      style="display:inline-block;background:#a3e635;color:#0a0a0a;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.5px;">
                      Login to AHS-XD →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="border-top:1px solid #161d16;"></td></tr>
              </table>

              <!-- Note -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1a1500;border:1px solid #2a2000;border-radius:10px;padding:14px 18px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;">
                      🔒&nbsp; You will be asked to <strong style="color:#f9fafb;">set a new password</strong> on your first login.
                      Keep your credentials secure and do not share them.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #1f2937;padding-top:20px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;color:#374151;letter-spacing:1px;">
                      © ${year} AHS-XD &nbsp;·&nbsp; Ayot Health Solutions &nbsp;·&nbsp; Confidential
                    </p>
                    <p style="margin:0;font-size:10px;color:#1f2937;">
                      This is an automated message — please do not reply
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  role: string,
  tempPassword: string,
): Promise<void> {
  await transporter.sendMail({
    from: `"AHS-XD" <${process.env.ZOHO_EMAIL}>`,
    to,
    subject: `Welcome to AHS-XD — Your account is ready`,
    html: welcomeEmailTemplate(name, to, role, tempPassword),
    text: `Hi ${name},\n\nYour AHS-XD account has been created.\n\nEmail: ${to}\nTemporary password: ${tempPassword}\nRole: ${role}\n\nLogin at: https://ahs-xd.ayothealthsolutions.ke/login\n\nYou will be asked to set a new password on first login.\n\nAHS-XD Team`,
  });
}
