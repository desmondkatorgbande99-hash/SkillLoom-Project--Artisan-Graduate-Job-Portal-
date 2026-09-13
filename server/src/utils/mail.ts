import { Resend } from "resend";

function getResendClient(): { resend: Resend; mailFrom: string } {
  const resendApiKey = process.env.RESEND_API_KEY;
  const mailFromEnv = process.env.MAIL_FROM;

  if (!resendApiKey || !mailFromEnv) {
    throw new Error(
      "Email configuration is missing. RESEND_API_KEY and MAIL_FROM are required."
    );
  }

  return {
    resend: new Resend(resendApiKey),
    mailFrom: mailFromEnv,
  };
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  try {
    const { resend, mailFrom } = getResendClient();

    const { data, error } =
      await resend.emails.send({
        from: mailFrom,
        to,
        subject,
        html,
      });

    if (error) {
      console.error(
        "[Resend API Error]:",
        error
      );

      throw new Error(
        error.message ||
          "Resend failed to send the email."
      );
    }

    console.log(
      `[Email sent successfully] To: ${to} | Subject: ${subject} | ID: ${
        data?.id ?? "unknown"
      }`
    );

    return data;
  } catch (error) {
    console.error(
      "[Email sending exception]:",
      error
    );

    throw error instanceof Error
      ? error
      : new Error(
          "An unexpected error occurred while sending the email."
        );
  }
}