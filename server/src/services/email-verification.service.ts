import prisma from "../config/database";
import {
  generateVerificationToken,
  hashVerificationToken,
} from "../utils/email-verification";
import { sendEmail } from "../utils/mail";

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

function getVerificationUrl(token: string): string {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173";

  return `${frontendUrl}/verify-email?token=${encodeURIComponent(
    token
  )}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function createAndSendVerificationEmail(
  userId: string,
  email: string,
  fullName: string
) {
  /*
   * Invalidate any previous unused verification tokens.
   */
  await prisma.emailVerificationToken.updateMany({
    where: {
      userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  const rawToken = generateVerificationToken();

  const tokenHash = hashVerificationToken(rawToken);

  const expiresAt = new Date(
    Date.now() +
      VERIFICATION_TOKEN_EXPIRY_HOURS *
        60 *
        60 *
        1000
  );

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const verificationUrl = getVerificationUrl(rawToken);
  const safeFullName = escapeHtml(fullName);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>Verify your SkillLoom account</title>
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
            <h1 style="margin: 0; font-size: 28px;">
              SkillLoom
            </h1>

            <p
              style="
                margin: 8px 0 0;
                color: #d1d5db;
              "
            >
              Weaving skills into opportunity.
            </p>
          </div>

          <div style="padding: 32px;">
            <h2
              style="
                margin-top: 0;
                color: #111827;
              "
            >
              Verify your email address
            </h2>

            <p>
              Hello ${safeFullName},
            </p>

            <p>
              Thank you for creating your SkillLoom account.
              Please verify your email address to activate
              your account.
            </p>

            <p style="margin: 32px 0;">
              <a
                href="${verificationUrl}"
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
                Verify Email Address
              </a>
            </p>

            <p>
              This verification link will expire in
              <strong>24 hours</strong>.
            </p>

            <p>
              If you did not create this account, you can
              safely ignore this email.
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

  return sendEmail(
    email,
    "Verify your SkillLoom account",
    html
  );
}