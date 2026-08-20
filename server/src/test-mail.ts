import "dotenv/config";
import { sendEmail } from "./utils/mail";

async function testEmail() {
  try {
    await sendEmail(
      process.env.MAIL_USER!,
      "SkillLoom Email Test",
      `
        <div style="font-family: Arial, sans-serif;">
          <h1>SkillLoom</h1>
          <p>This is a test email from the SkillLoom backend.</p>
          <p><strong>Weaving skills into opportunity.</strong></p>
        </div>
      `
    );

    console.log("✅ SkillLoom email sent successfully.");
  } catch (error) {
    console.error("❌ SkillLoom email test failed.");
    console.error(error);
    process.exitCode = 1;
  }
}

testEmail();