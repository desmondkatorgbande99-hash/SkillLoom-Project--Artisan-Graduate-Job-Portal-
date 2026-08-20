import { Response } from "express";
import prisma from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

/**
 * Get the authenticated user's profile
 *
 * GET /api/profiles/me
 *
 * EMPLOYER / GRADUATE / ARTISAN
 */
export async function getMyProfile(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        status: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,

        graduateProfile: true,
        artisanProfile: true,
        employerProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        profile: user,
      },
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching your profile.",
    });
  }
}

/**
 * Update the authenticated user's profile
 *
 * PATCH /api/profiles/me
 *
 * EMPLOYER / GRADUATE / ARTISAN
 */
export async function updateMyProfile(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      fullName,
      avatarUrl,

      // Graduate fields
      headline,
      bio,
      phone,
      location,
      education,
      cvUrl,
      isAvailable,

      // Artisan fields
      trade,
      yearsExperience,
      hourlyRate,
      contractRate,
      currency,

      // Employer fields
      companyName,
      logoUrl,
      description,
      industry,
      website,
    } = req.body;

    /**
     * Validate common user fields
     */

    if (
      fullName !== undefined &&
      (
        typeof fullName !== "string" ||
        fullName.trim().length < 2 ||
        fullName.trim().length > 120
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name must be between 2 and 120 characters.",
      });
    }

    if (
      avatarUrl !== undefined &&
      avatarUrl !== null &&
      typeof avatarUrl !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Avatar URL must be a string.",
      });
    }

    if (
      typeof avatarUrl === "string" &&
      avatarUrl.trim()
    ) {
      try {
        new URL(avatarUrl.trim());
      } catch {
        return res.status(400).json({
          success: false,
          message: "Avatar URL must be a valid URL.",
        });
      }
    }

    /**
     * Validate availability
     */

    if (
      isAvailable !== undefined &&
      typeof isAvailable !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be a boolean.",
      });
    }

    /**
     * Validate years of experience
     */

    if (
      yearsExperience !== undefined &&
      yearsExperience !== null &&
      (
        !Number.isInteger(Number(yearsExperience)) ||
        Number(yearsExperience) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Years of experience must be a non-negative whole number.",
      });
    }

    /**
     * Validate numeric rates
     */

    if (
      hourlyRate !== undefined &&
      hourlyRate !== null &&
      Number.isNaN(Number(hourlyRate))
    ) {
      return res.status(400).json({
        success: false,
        message: "Hourly rate must be a valid number.",
      });
    }

    if (
      contractRate !== undefined &&
      contractRate !== null &&
      Number.isNaN(Number(contractRate))
    ) {
      return res.status(400).json({
        success: false,
        message: "Contract rate must be a valid number.",
      });
    }

    /**
     * Validate CV URL
     */

    if (
      cvUrl !== undefined &&
      cvUrl !== null &&
      typeof cvUrl !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "CV URL must be a string.",
      });
    }

    if (
      typeof cvUrl === "string" &&
      cvUrl.trim()
    ) {
      try {
        new URL(cvUrl.trim());
      } catch {
        return res.status(400).json({
          success: false,
          message: "CV URL must be a valid URL.",
        });
      }
    }

    /**
     * Validate employer website
     */

    if (
      website !== undefined &&
      website !== null &&
      typeof website !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Website must be a string.",
      });
    }

    if (
      typeof website === "string" &&
      website.trim()
    ) {
      try {
        new URL(website.trim());
      } catch {
        return res.status(400).json({
          success: false,
          message: "Website must be a valid URL.",
        });
      }
    }

    /**
     * Validate role-specific fields
     */

    if (
      headline !== undefined &&
      headline !== null &&
      typeof headline !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Headline must be a string.",
      });
    }

    if (
      bio !== undefined &&
      bio !== null &&
      typeof bio !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Bio must be a string.",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone must be a string.",
      });
    }

    if (
      location !== undefined &&
      location !== null &&
      typeof location !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Location must be a string.",
      });
    }

    if (
      education !== undefined &&
      education !== null &&
      typeof education !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Education must be a string.",
      });
    }

    if (
      trade !== undefined &&
      trade !== null &&
      typeof trade !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Trade must be a string.",
      });
    }

    if (
      currency !== undefined &&
      currency !== null &&
      typeof currency !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a string.",
      });
    }

    if (
      companyName !== undefined &&
      (
        typeof companyName !== "string" ||
        companyName.trim().length < 2
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Company name must contain at least 2 characters.",
      });
    }

    /**
     * Find user
     */

    const existingUser = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    /**
     * Update common User fields
     */

    await prisma.user.update({
      where: {
        id: req.user.userId,
      },
      data: {
        ...(fullName !== undefined && {
          fullName: fullName.trim(),
        }),

        ...(avatarUrl !== undefined && {
          avatarUrl:
            avatarUrl === null
              ? null
              : avatarUrl.trim() || null,
        }),
      },
    });

    /**
     * Update Graduate profile
     */

    if (existingUser.role === "GRADUATE") {
      const graduate = await prisma.graduateProfile.findUnique({
        where: {
          userId: req.user.userId,
        },
      });

      if (!graduate) {
        return res.status(404).json({
          success: false,
          message:
            "Graduate profile not found. Please complete your graduate profile.",
        });
      }

      await prisma.graduateProfile.update({
        where: {
          userId: req.user.userId,
        },
        data: {
          ...(headline !== undefined && {
            headline:
              headline === null
                ? null
                : headline.trim() || null,
          }),

          ...(bio !== undefined && {
            bio:
              bio === null
                ? null
                : bio.trim() || null,
          }),

          ...(phone !== undefined && {
            phone:
              phone === null
                ? null
                : phone.trim() || null,
          }),

          ...(location !== undefined && {
            location:
              location === null
                ? null
                : location.trim() || null,
          }),

          ...(education !== undefined && {
            education:
              education === null
                ? null
                : education.trim() || null,
          }),

          ...(cvUrl !== undefined && {
            cvUrl:
              cvUrl === null
                ? null
                : cvUrl.trim() || null,
          }),

          ...(isAvailable !== undefined && {
            isAvailable,
          }),
        },
      });
    }

    /**
     * Update Artisan profile
     */

    if (existingUser.role === "ARTISAN") {
      const artisan = await prisma.artisanProfile.findUnique({
        where: {
          userId: req.user.userId,
        },
      });

      if (!artisan) {
        return res.status(404).json({
          success: false,
          message:
            "Artisan profile not found. Please complete your artisan profile.",
        });
      }

      await prisma.artisanProfile.update({
        where: {
          userId: req.user.userId,
        },
        data: {
          ...(trade !== undefined && {
            trade:
              trade === null
                ? null
                : trade.trim() || null,
          }),

          ...(bio !== undefined && {
            bio:
              bio === null
                ? null
                : bio.trim() || null,
          }),

          ...(phone !== undefined && {
            phone:
              phone === null
                ? null
                : phone.trim() || null,
          }),

          ...(location !== undefined && {
            location:
              location === null
                ? null
                : location.trim() || null,
          }),

          ...(yearsExperience !== undefined && {
            yearsExperience:
              yearsExperience === null
                ? null
                : Number(yearsExperience),
          }),

          ...(hourlyRate !== undefined && {
            hourlyRate:
              hourlyRate === null
                ? null
                : Number(hourlyRate),
          }),

          ...(contractRate !== undefined && {
            contractRate:
              contractRate === null
                ? null
                : Number(contractRate),
          }),

          ...(currency !== undefined && {
            currency:
              currency === null
                ? "NGN"
                : currency.trim().toUpperCase(),
          }),

          ...(isAvailable !== undefined && {
            isAvailable,
          }),
        },
      });
    }

    /**
     * Update Employer profile
     */

    if (existingUser.role === "EMPLOYER") {
      const employer = await prisma.employerProfile.findUnique({
        where: {
          userId: req.user.userId,
        },
      });

      if (!employer) {
        return res.status(404).json({
          success: false,
          message:
            "Employer profile not found. Please complete your employer profile.",
        });
      }

      await prisma.employerProfile.update({
        where: {
          userId: req.user.userId,
        },
        data: {
          ...(companyName !== undefined && {
            companyName: companyName.trim(),
          }),

          ...(logoUrl !== undefined && {
            logoUrl:
              logoUrl === null
                ? null
                : logoUrl.trim() || null,
          }),

          ...(description !== undefined && {
            description:
              description === null
                ? null
                : description.trim() || null,
          }),

          ...(industry !== undefined && {
            industry:
              industry === null
                ? null
                : industry.trim() || null,
          }),

          ...(website !== undefined && {
            website:
              website === null
                ? null
                : website.trim() || null,
          }),

          ...(phone !== undefined && {
            phone:
              phone === null
                ? null
                : phone.trim() || null,
          }),

          ...(location !== undefined && {
            location:
              location === null
                ? null
                : location.trim() || null,
          }),
        },
      });
    }

    /**
     * Return the updated profile
     */

    const updatedUser = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        status: true,
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
      message: "Profile updated successfully.",
      data: {
        profile: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update my profile error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while updating your profile.",
    });
  }
}