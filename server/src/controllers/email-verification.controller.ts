import { Request, Response } from "express";
import prisma from "../config/database";
import { hashVerificationToken } from "../utils/email-verification";
import { createAndSendVerificationEmail } from "../services/email-verification.service";

export async function verifyEmail(
  req: Request,
  res: Response
) {
  try {
    const token = req.query.token;

    if (typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
      });
    }

    const tokenHash = hashVerificationToken(
      token.trim()
    );

    const verificationToken =
      await prisma.emailVerificationToken.findUnique({
        where: {
          tokenHash,
        },
        include: {
          user: true,
        },
      });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token.",
      });
    }

    if (verificationToken.usedAt) {
      return res.status(400).json({
        success: false,
        message:
          "This verification token has already been used.",
      });
    }

    if (
      verificationToken.expiresAt.getTime() <
      Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This verification token has expired. Please request a new verification email.",
      });
    }

    const user = verificationToken.user;

    /*
     * If the account has already been verified,
     * treat the request as successful instead of
     * making the user think something went wrong.
     */
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message:
          "Your email address is already verified. You can sign in.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          status: "ACTIVE",
        },
      });

      await tx.emailVerificationToken.update({
        where: {
          id: verificationToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      });
    });

    return res.status(200).json({
      success: true,
      message:
        "Email verified successfully. Your SkillLoom account is now active. You can now sign in.",
    });
  } catch (error) {
    console.error(
      "Email verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred during email verification.",
    });
  }
}

export async function resendVerificationEmail(
  req: Request,
  res: Response
) {
  try {
    const { email } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    /*
     * Do not reveal whether an email exists.
     */
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists and requires verification, a verification email has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message:
          "This email address has already been verified.",
      });
    }

    if (user.status === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended.",
      });
    }

    let verificationUrl: string | undefined;
    let emailSent = false;

    try {
      const result = await createAndSendVerificationEmail(
        user.id,
        user.email,
        user.fullName
      );
      verificationUrl = result.verificationUrl;
      emailSent = result.emailSent;
    } catch (error) {
      console.error(
        "Verification email generation error:",
        error
      );
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? "A new verification email has been sent to your inbox."
        : "Verification link generated. You can verify your account directly.",
      data: {
        verificationUrl,
        emailSent,
      },
    });
  } catch (error) {
    console.error(
      "Resend verification email error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while processing your request.",
    });
  }
}