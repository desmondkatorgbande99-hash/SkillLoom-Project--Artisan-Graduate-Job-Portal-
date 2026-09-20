import { Response } from "express";
import prisma from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const APPLICATION_STATUSES = [
  "PENDING",
  "REVIEWING",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
  "WITHDRAWN",
] as const;

type ApplicationStatus =
  (typeof APPLICATION_STATUSES)[number];

function isApplicationStatus(
  value: string
): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(
    value as ApplicationStatus
  );
}

function getId(
  req: AuthenticatedRequest
): string | null {
  const { id } = req.params;

  if (typeof id !== "string" || !id.trim()) {
    return null;
  }

  return id.trim();
}

/**
 * Create a job application
 *
 * GRADUATE / ARTISAN only
 *
 * POST /api/applications
 */
export async function createApplication(
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

    if (
      req.user.role !== "GRADUATE" &&
      req.user.role !== "ARTISAN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only graduates and artisans can apply for jobs.",
      });
    }

    const { jobId, coverLetter } = req.body;

    if (
      typeof jobId !== "string" ||
      !jobId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required.",
      });
    }

    if (
      coverLetter !== undefined &&
      coverLetter !== null &&
      typeof coverLetter !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cover letter must be a string.",
      });
    }

    const job = await prisma.job.findUnique({
      where: {
        id: jobId.trim(),
      },
      select: {
        id: true,
        title: true,
        status: true,
        applicationDeadline: true,
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    if (job.status !== "OPEN") {
      return res.status(400).json({
        success: false,
        message:
          "This job is not currently accepting applications.",
      });
    }

    if (
      job.applicationDeadline &&
      new Date() > job.applicationDeadline
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The application deadline for this job has passed.",
      });
    }

    let graduateId: string | null = null;
    let artisanId: string | null = null;
    let cvUrl: string | null = null;

    if (req.user.role === "GRADUATE") {
      const graduate =
        await prisma.graduateProfile.findUnique({
          where: {
            userId: req.user.userId,
          },
          select: {
            id: true,
            cvUrl: true,
          },
        });

      if (!graduate) {
        return res.status(404).json({
          success: false,
          message: "Graduate profile not found.",
        });
      }

      graduateId = graduate.id;
      cvUrl = graduate.cvUrl;
    }

    if (req.user.role === "ARTISAN") {
      const artisan =
        await prisma.artisanProfile.findUnique({
          where: {
            userId: req.user.userId,
          },
          select: {
            id: true,
          },
        });

      if (!artisan) {
        return res.status(404).json({
          success: false,
          message: "Artisan profile not found.",
        });
      }

      artisanId = artisan.id;
    }

    const existingApplication =
      await prisma.jobApplication.findUnique({
        where: {
          jobId_applicantId: {
            jobId: job.id,
            applicantId: req.user.userId,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message:
          "You have already applied for this job.",
        data: {
          application: existingApplication,
        },
      });
    }

    const application =
      await prisma.jobApplication.create({
        data: {
          jobId: job.id,
          applicantId: req.user.userId,
          graduateId,
          artisanId,
          coverLetter:
            typeof coverLetter === "string"
              ? coverLetter.trim() || null
              : null,
          cvUrl,
          status: "PENDING",
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              jobType: true,
              status: true,
              applicationDeadline: true,
            },
          },
          applicant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          graduate: {
            select: {
              id: true,
              userId: true,
            },
          },
          artisan: {
            select: {
              id: true,
              userId: true,
              trade: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: {
        application,
      },
    });
  } catch (error: any) {
    console.error(
      "Create application error:",
      error
    );

    /**
     * Prisma unique constraint protection.
     *
     * This handles a race condition where two
     * application requests arrive at almost
     * exactly the same time.
     */
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "You have already applied for this job.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while submitting the application.",
    });
  }
}

/**
 * Get applications belonging to the authenticated
 * graduate or artisan.
 *
 * GET /api/applications/my-applications
 *
 * GRADUATE / ARTISAN only
 */
export async function getMyApplications(
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

    if (
      req.user.role !== "GRADUATE" &&
      req.user.role !== "ARTISAN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only graduates and artisans can view their applications.",
      });
    }

    const applications =
      await prisma.jobApplication.findMany({
        where: {
          applicantId: req.user.userId,
        },
        orderBy: {
          appliedAt: "desc",
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              description: true,
              requirements: true,
              location: true,
              salaryMin: true,
              salaryMax: true,
              currency: true,
              jobType: true,
              status: true,
              applicationDeadline: true,
              createdAt: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        applications,
        total: applications.length,
      },
    });
  } catch (error) {
    console.error(
      "Get my applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching your applications.",
    });
  }
}

/**
 * Get all applications for one of the employer's jobs
 *
 * EMPLOYER only
 *
 * GET /api/applications/job/:id
 */
export async function getJobApplications(
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

    if (req.user.role !== "EMPLOYER") {
      return res.status(403).json({
        success: false,
        message:
          "Only employers can view job applications.",
      });
    }

    const jobId = getId(req);

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required.",
      });
    }

    const employer =
      await prisma.employerProfile.findUnique({
        where: {
          userId: req.user.userId,
        },
        select: {
          id: true,
        },
      });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer profile not found.",
      });
    }

    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
        employerId: true,
        title: true,
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    if (job.employerId !== employer.id) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view applications for this job.",
      });
    }

    const applications =
      await prisma.jobApplication.findMany({
        where: {
          jobId,
        },
        orderBy: {
          appliedAt: "desc",
        },
        include: {
          applicant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          graduate: {
            select: {
              id: true,
              userId: true,
            },
          },
          artisan: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      data: {
        job: {
          id: job.id,
          title: job.title,
        },
        applications,
        total: applications.length,
      },
    });
  } catch (error) {
    console.error(
      "Get job applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching job applications.",
    });
  }
}

/**
 * Get one application
 *
 * EMPLOYER only
 *
 * GET /api/applications/:id
 */
export async function getApplicationById(
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

    if (req.user.role !== "EMPLOYER") {
      return res.status(403).json({
        success: false,
        message:
          "Only employers can view application details.",
      });
    }

    const applicationId = getId(req);

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required.",
      });
    }

    const employer =
      await prisma.employerProfile.findUnique({
        where: {
          userId: req.user.userId,
        },
        select: {
          id: true,
        },
      });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer profile not found.",
      });
    }

    const application =
      await prisma.jobApplication.findUnique({
        where: {
          id: applicationId,
        },
        include: {
          job: {
            select: {
              id: true,
              employerId: true,
              title: true,
              location: true,
              jobType: true,
              status: true,
            },
          },
          applicant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          graduate: {
            select: {
              id: true,
              userId: true,
            },
          },
          artisan: {
            select: {
              id: true,
              userId: true,
              trade: true,
            },
          },
        },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (
      application.job.employerId !==
      employer.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this application.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        application,
      },
    });
  } catch (error) {
    console.error(
      "Get application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching the application.",
    });
  }
}

/**
 * Update application status
 *
 * EMPLOYER only
 *
 * PATCH /api/applications/:id/status
 */
export async function updateApplicationStatus(
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

    if (req.user.role !== "EMPLOYER" && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Only employers and administrators can update application status.",
      });
    }

    const applicationId = getId(req);

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required.",
      });
    }

    const { status } = req.body;

    if (
      typeof status !== "string" ||
      !isApplicationStatus(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid application status. Choose PENDING, REVIEWING, SHORTLISTED, REJECTED, HIRED or WITHDRAWN.",
      });
    }

    const application =
      await prisma.jobApplication.findUnique({
        where: {
          id: applicationId,
        },
        include: {
          job: {
            select: {
              id: true,
              employerId: true,
              title: true,
            },
          },
        },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (req.user.role === "EMPLOYER") {
      const employer =
        await prisma.employerProfile.findUnique({
          where: {
            userId: req.user.userId,
          },
          select: {
            id: true,
          },
        });

      if (!employer || application.job.employerId !== employer.id) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to update this application.",
        });
      }
    }

    const updatedApplication =
      await prisma.jobApplication.update({
        where: {
          id: applicationId,
        },
        data: {
          status,
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              jobType: true,
              status: true,
            },
          },
          applicant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          graduate: {
            select: {
              id: true,
              userId: true,
            },
          },
          artisan: {
            select: {
              id: true,
              userId: true,
              trade: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Application status updated successfully.",
      data: {
        application: updatedApplication,
      },
    });
  } catch (error) {
    console.error(
      "Update application status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while updating the application status.",
    });
  }
}

/**
 * Withdraw an application
 *
 * GRADUATE / ARTISAN only
 *
 * PATCH /api/applications/:id/withdraw
 */
export async function withdrawApplication(
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

    if (
      req.user.role !== "GRADUATE" &&
      req.user.role !== "ARTISAN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only graduates and artisans can withdraw applications.",
      });
    }

    const applicationId = getId(req);

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required.",
      });
    }

    const application =
      await prisma.jobApplication.findUnique({
        where: {
          id: applicationId,
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              jobType: true,
              status: true,
            },
          },
        },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (
      application.applicantId !==
      req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to withdraw this application.",
      });
    }

    if (application.status === "WITHDRAWN") {
      return res.status(400).json({
        success: false,
        message:
          "This application has already been withdrawn.",
      });
    }

    if (application.status === "HIRED") {
      return res.status(400).json({
        success: false,
        message:
          "A hired application cannot be withdrawn.",
      });
    }

    const updatedApplication =
      await prisma.jobApplication.update({
        where: {
          id: applicationId,
        },
        data: {
          status: "WITHDRAWN",
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              jobType: true,
              status: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Application withdrawn successfully.",
      data: {
        application: updatedApplication,
      },
    });
  } catch (error) {
    console.error(
      "Withdraw application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while withdrawing the application.",
    });
  }
}