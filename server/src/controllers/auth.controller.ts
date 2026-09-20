import { Request, Response } from "express";
import prisma from "../config/database";
import {
  hashPassword,
  comparePassword,
} from "../utils/password";
import { generateToken } from "../utils/jwt";
import { createAndSendVerificationEmail } from "../services/email-verification.service";
import {
  createAndSendPasswordResetEmail,
  hashResetToken,
} from "../services/password-reset.service";

const PUBLIC_ROLES = [
  "EMPLOYER",
  "GRADUATE",
  "ARTISAN",
] as const;

type PublicRole = (typeof PUBLIC_ROLES)[number];

function isPublicRole(role: string): role is PublicRole {
  return PUBLIC_ROLES.includes(
    role as PublicRole
  );
}

export async function register(
  req: Request,
  res: Response
) {
  try {
    const {
      fullName,
      email,
      password,
      role,
      companyName,
      trade,
    } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, email, password and role are required.",
      });
    }

    if (
      typeof fullName !== "string" ||
      fullName.trim().length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name must contain at least 2 characters.",
      });
    }

    if (typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message:
          "A valid email address is required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long.",
      });
    }

    if (
      typeof role !== "string" ||
      !isPublicRole(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Choose EMPLOYER, GRADUATE or ARTISAN.",
      });
    }

    if (role === "EMPLOYER") {
      if (
        typeof companyName !== "string" ||
        companyName.trim().length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Company name is required when registering as an employer.",
        });
      }
    }

    if (role === "ARTISAN") {
      if (
        typeof trade !== "string" ||
        trade.trim().length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Trade is required when registering as an artisan.",
        });
      }
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const passwordHash =
      await hashPassword(password);

    const requireVerification =
      process.env.REQUIRE_EMAIL_VERIFICATION !== "false";

    const user = await prisma.$transaction(
      async (tx) => {
        const createdUser =
          await tx.user.create({
            data: {
              fullName: fullName.trim(),
              email: normalizedEmail,
              passwordHash,
              role,
              status: requireVerification
                ? "PENDING_VERIFICATION"
                : "ACTIVE",
              isEmailVerified: !requireVerification,
            },
          });

        if (role === "EMPLOYER") {
          await tx.employerProfile.create({
            data: {
              userId: createdUser.id,
              companyName:
                companyName.trim(),
            },
          });
        }

        if (role === "GRADUATE") {
          await tx.graduateProfile.create({
            data: {
              userId: createdUser.id,
            },
          });
        }

        if (role === "ARTISAN") {
          await tx.artisanProfile.create({
            data: {
              userId: createdUser.id,
              trade: trade.trim(),
            },
          });
        }

        return createdUser;
      }
    );

    /*
     * Send verification email in background if required
     * so registration is instantaneous and never hangs.
     */
    if (requireVerification) {
      createAndSendVerificationEmail(
        user.id,
        user.email,
        user.fullName
      ).catch((emailError) => {
        console.error(
          "Verification email failed:",
          emailError
        );
      });
    }

    return res.status(201).json({
      success: true,
      message: requireVerification
        ? "SkillLoom account created successfully. Please check your email to verify your account."
        : "SkillLoom account created successfully. You can now sign in.",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          isEmailVerified:
            user.isEmailVerified,
        },
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred during registration.",
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password must be valid strings.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const passwordIsValid =
      await comparePassword(
        password,
        user.passwordHash
      );

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    if (user.status === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message:
          "This account has been suspended.",
      });
    }

    const requireVerification =
      process.env.REQUIRE_EMAIL_VERIFICATION !== "false";

    if (requireVerification && !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email address before logging in.",
      });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    const lastLoginAt = new Date();

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt,
      },
    });

    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        isEmailVerified: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        graduateProfile: true,
        artisanProfile: true,
        employerProfile: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          isEmailVerified:
            user.isEmailVerified,
          lastLoginAt,
          graduateProfile: userWithProfile?.graduateProfile,
          artisanProfile: userWithProfile?.artisanProfile,
          employerProfile: userWithProfile?.employerProfile,
        },
        profile: userWithProfile,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred during login.",
    });
  }
}

export async function forgotPassword(
  req: Request,
  res: Response
) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.status !== "SUSPENDED") {
      createAndSendPasswordResetEmail(
        user.id,
        user.email,
        user.fullName
      ).catch((err) => {
        console.error("Password reset email failed:", err);
      });
    }

    // Always respond with success so email addresses cannot be enumerated
    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, we have sent instructions to reset your password.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
}

export async function resetPassword(
  req: Request,
  res: Response
) {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password reset token is required.",
      });
    }

    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    const tokenHash = hashResetToken(token.trim());

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset link. Please request a new one.",
      });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: newPasswordHash,
          isEmailVerified: true,
          status:
            resetRecord.user.status === "PENDING_VERIFICATION"
              ? "ACTIVE"
              : resetRecord.user.status,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Your password has been successfully reset. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while resetting your password.",
    });
  }
}
