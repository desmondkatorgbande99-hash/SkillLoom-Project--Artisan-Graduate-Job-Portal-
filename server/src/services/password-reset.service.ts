import crypto from "node:crypto";
import prisma from "../config/database";
import { sendEmail } from "../utils/mail";

const RESET_TOKEN_EXPIRY_HOURS = 1;

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getResetUrl(token: string): string {
  const frontendUrl = (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");

  return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function createAndSendPasswordResetEmail(
  userId: string,
  email: string,
  fullName: string
): Promise<void> {
  // Invalidate any existing unused reset tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = getResetUrl(rawToken);
  const safeFullName = escapeHtml(fullName);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset your SkillLoom password</title>
      </head>
      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f5f7fb;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2937;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          "
        >
          <div
            style="
              padding: 28px;
              background: #111827;
              color: #ffffff;
            "
          >
            <h1 style="margin: 0; font-size: 28px;">SkillLoom</h1>
            <p style="margin: 8px 0 0; color: #d1d5db;">
              Weaving skills into opportunity.
            </p>
          </div>

          <div style="padding: 32px;">
            <h2 style="margin-top: 0; color: #111827;">Reset your password</h2>

            <p>Hello ${safeFullName},</p>

            <p>
              We received a request to reset your password for your SkillLoom account.
              Click the button below to choose a new password:
            </p>

            <p style="margin: 32px 0;">
              <a
                href="${resetUrl}"
                style="
                  display: inline-block;
                  padding: 14px 24px;
                  background: #2563eb;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                "
              >
                Reset Password
              </a>
            </p>

            <p>
              This link is valid for <strong>1 hour</strong>.
            </p>

            <p>
              If you didn't request a password reset, you can safely ignore this email.
              Your password will remain unchanged.
            </p>

            <p style="margin-top: 32px;">
              Regards,<br />
              <strong>The SkillLoom Team</strong>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(email, "Reset your SkillLoom password", html);
}
export { hashResetToken };
