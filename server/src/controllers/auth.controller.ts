import { Request, Response } from "express";
import prisma from "../config/database";
import {
  hashPassword,
  comparePassword,
} from "../utils/password";
import { generateToken } from "../utils/jwt";
import { createAndSendVerificationEmail } from "../services/email-verification.service";

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

    const user = await prisma.$transaction(
      async (tx) => {
        const createdUser =
          await tx.user.create({
            data: {
              fullName: fullName.trim(),
              email: normalizedEmail,
              passwordHash,
              role,
              status:
                "PENDING_VERIFICATION",
              isEmailVerified: false,
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
     * Send verification email after the account
     * and profile have been successfully created.
     */
    try {
      await createAndSendVerificationEmail(
        user.id,
        user.email,
        user.fullName
      );
    } catch (emailError) {
      console.error(
        "Verification email failed:",
        emailError
      );

      /*
       * The account remains pending verification.
       * The user can use the resend-verification
       * endpoint later.
       */
    }

    return res.status(201).json({
      success: true,
      message:
        "SkillLoom account created successfully. Please check your email to verify your account.",
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

    if (!user.isEmailVerified) {
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
        },
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