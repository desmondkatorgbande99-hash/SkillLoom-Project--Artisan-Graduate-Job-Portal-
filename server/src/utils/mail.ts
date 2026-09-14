import { Resend } from "resend";
import nodemailer from "nodemailer";

const EMAIL_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Sends an email using either Resend (HTTP API) or Nodemailer (SMTP),
 * whichever is configured. Resend is preferred on platforms like Render
 * because SMTP ports (25, 465, 587) are often blocked by firewalls.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const mailFrom = process.env.MAIL_FROM || "onboarding@resend.dev";
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  // 1. Prefer Resend HTTP API if key is present (never blocked by host firewalls)
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const resendPromise = resend.emails.send({
        from: mailFrom,
        to,
        subject,
        html,
      });

      const { error } = await withTimeout(resendPromise, EMAIL_TIMEOUT_MS, "Resend email send");
      if (error) {
        console.error("[Resend API Error]:", error);
        throw new Error(error.message || "Resend failed to send email.");
      }

      console.log(`[Email sent via Resend] To: ${to} | Subject: ${subject}`);
      return;
    } catch (err) {
      console.error("[Resend sending error]:", err);
      // Fall through to SMTP if Gmail credentials exist
      if (!gmailUser || !gmailPass) {
        throw err;
      }
    }
  }

  // 2. Fallback to Gmail SMTP if configured, with strict timeouts
  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
    });

    const smtpPromise = transporter.sendMail({
      from: gmailUser,
      to,
      subject,
      html,
    });

    await withTimeout(smtpPromise, EMAIL_TIMEOUT_MS, "SMTP email send");
    console.log(`[Email sent via Gmail SMTP] To: ${to} | Subject: ${subject}`);
    return;
  }

  console.warn("[Email Warning]: No email service is configured (RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD).");
}
