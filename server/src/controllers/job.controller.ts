import { Response } from "express";
import prisma from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const PUBLIC_JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
] as const;

type PublicJobType = (typeof PUBLIC_JOB_TYPES)[number];

function isJobType(value: string): value is PublicJobType {
  return PUBLIC_JOB_TYPES.includes(value as PublicJobType);
}

/**
 * Safely extract a route parameter.
 *
 * Express 5 can type req.params values as string | string[].
 * Job IDs are always expected to be a single string.
 */
function getJobId(req: AuthenticatedRequest): string | null {
  const { id } = req.params;

  if (typeof id !== "string" || !id.trim()) {
    return null;
  }

  return id.trim();
}

/**
 * Create a new job
 * EMPLOYER only
 */
export async function createJob(
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
        message: "Only employers can create jobs.",
      });
    }

    const {
      title,
      description,
      requirements,
      location,
      salaryMin,
      salaryMax,
      currency,
      jobType,
      applicationDeadline,
    } = req.body;

    if (!title || !description || !jobType) {
      return res.status(400).json({
        success: false,
        message: "Title, description and job type are required.",
      });
    }

    if (
      typeof title !== "string" ||
      title.trim().length < 3
    ) {
      return res.status(400).json({
        success: false,
        message: "Job title must contain at least 3 characters.",
      });
    }

    if (
      typeof description !== "string" ||
      description.trim().length < 20
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job description must contain at least 20 characters.",
      });
    }

    if (
      typeof jobType !== "string" ||
      !isJobType(jobType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid job type. Choose FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP or FREELANCE.",
      });
    }

    if (
      salaryMin !== undefined &&
      salaryMin !== null &&
      Number.isNaN(Number(salaryMin))
    ) {
      return res.status(400).json({
        success: false,
        message: "Salary minimum must be a valid number.",
      });
    }

    if (
      salaryMax !== undefined &&
      salaryMax !== null &&
      Number.isNaN(Number(salaryMax))
    ) {
      return res.status(400).json({
        success: false,
        message: "Salary maximum must be a valid number.",
      });
    }

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin !== null &&
      salaryMax !== null &&
      Number(salaryMin) > Number(salaryMax)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum salary cannot be greater than maximum salary.",
      });
    }

    let deadline: Date | null = null;

    if (applicationDeadline) {
      deadline = new Date(applicationDeadline);

      if (Number.isNaN(deadline.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Application deadline must be a valid date.",
        });
      }

      if (deadline <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Application deadline must be in the future.",
        });
      }
    }

    const employer = await prisma.employerProfile.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message:
          "Employer profile not found. Please complete your employer profile first.",
      });
    }

    if (employer.approvalStatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message:
          "Your employer account must be approved before you can post jobs.",
      });
    }

    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        postedById: req.user.userId,
        title: title.trim(),
        description: description.trim(),
        requirements:
          typeof requirements === "string"
            ? requirements.trim()
            : null,
        location:
          typeof location === "string"
            ? location.trim()
            : null,
        salaryMin:
          salaryMin !== undefined && salaryMin !== null
            ? Number(salaryMin)
            : null,
        salaryMax:
          salaryMax !== undefined && salaryMax !== null
            ? Number(salaryMax)
            : null,
        currency:
          typeof currency === "string" && currency.trim()
            ? currency.trim().toUpperCase()
            : "NGN",
        jobType,
        status: "OPEN",
        applicationDeadline: deadline,
      },
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            location: true,
            industry: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Job posted successfully.",
      data: {
        job,
      },
    });
  } catch (error) {
    console.error("Create job error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while creating the job.",
    });
  }
}

/**
 * Browse open jobs
 * Public
 */
export async function getJobs(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const {
      search,
      location,
      jobType,
      page = "1",
      limit = "10",
    } = req.query;

    const parsedPage = Math.max(Number(page) || 1, 1);

    const parsedLimit = Math.min(
      Math.max(Number(limit) || 10, 1),
      50
    );

    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = {
      status: "OPEN",
    };

    if (typeof search === "string" && search.trim()) {
      where.OR = [
        {
          title: {
            contains: search.trim(),
          },
        },
        {
          description: {
            contains: search.trim(),
          },
        },
      ];
    }

    if (typeof location === "string" && location.trim()) {
      where.location = {
        contains: location.trim(),
      };
    }

    if (
      typeof jobType === "string" &&
      isJobType(jobType)
    ) {
      where.jobType = jobType;
    }

    const [jobs, total] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          employer: {
            select: {
              id: true,
              companyName: true,
              logoUrl: true,
              location: true,
              industry: true,
            },
          },
        },
      }),

      prisma.job.count({
        where,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.ceil(total / parsedLimit),
        },
      },
    });
  } catch (error) {
    console.error("Get jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while fetching jobs.",
    });
  }
}

/**
 * Get a single job
 * Public
 */
export async function getJobById(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const id = getJobId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required.",
      });
    }

    const job = await prisma.job.findUnique({
      where: {
        id,
      },
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            description: true,
            industry: true,
            website: true,
            location: true,
          },
        },
        applications: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    const applicationCount = job.applications.length;

    const { applications: _applications, ...jobData } = job;

    return res.status(200).json({
      success: true,
      data: {
        job: {
          ...jobData,
          applicationCount,
        },
      },
    });
  } catch (error) {
    console.error("Get job error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching the job.",
    });
  }
}

/**
 * Get jobs belonging to the authenticated employer
 * EMPLOYER only
 */
export async function getMyJobs(
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
          "Only employers can access their posted jobs.",
      });
    }

    const employer = await prisma.employerProfile.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer profile not found.",
      });
    }

    const jobs = await prisma.job.findMany({
      where: {
        employerId: employer.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        jobs,
      },
    });
  } catch (error) {
    console.error("Get my jobs error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching your jobs.",
    });
  }
}

/**
 * Update a job
 * EMPLOYER only
 */
export async function updateJob(
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
        message: "Only employers can update jobs.",
      });
    }

    const id = getJobId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required.",
      });
    }

    const employer = await prisma.employerProfile.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer profile not found.",
      });
    }

    const existingJob = await prisma.job.findUnique({
      where: {
        id,
      },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    if (existingJob.employerId !== employer.id) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to update this job.",
      });
    }

    const {
      title,
      description,
      requirements,
      location,
      salaryMin,
      salaryMax,
      currency,
      jobType,
      applicationDeadline,
      status,
    } = req.body;

    if (
      jobType !== undefined &&
      (typeof jobType !== "string" ||
        !isJobType(jobType))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid job type.",
      });
    }

    if (
      status !== undefined &&
      !["DRAFT", "OPEN", "CLOSED"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid job status.",
      });
    }

    if (
      salaryMin !== undefined &&
      salaryMin !== null &&
      Number.isNaN(Number(salaryMin))
    ) {
      return res.status(400).json({
        success: false,
        message: "Salary minimum must be a valid number.",
      });
    }

    if (
      salaryMax !== undefined &&
      salaryMax !== null &&
      Number.isNaN(Number(salaryMax))
    ) {
      return res.status(400).json({
        success: false,
        message: "Salary maximum must be a valid number.",
      });
    }

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin !== null &&
      salaryMax !== null &&
      Number(salaryMin) > Number(salaryMax)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum salary cannot be greater than maximum salary.",
      });
    }

    let deadline: Date | null | undefined = undefined;

    if (applicationDeadline !== undefined) {
      if (
        applicationDeadline === null ||
        applicationDeadline === ""
      ) {
        deadline = null;
      } else {
        deadline = new Date(applicationDeadline);

        if (Number.isNaN(deadline.getTime())) {
          return res.status(400).json({
            success: false,
            message:
              "Application deadline must be a valid date.",
          });
        }

        if (deadline <= new Date()) {
          return res.status(400).json({
            success: false,
            message:
              "Application deadline must be in the future.",
          });
        }
      }
    }

    if (
      title !== undefined &&
      (typeof title !== "string" ||
        title.trim().length < 3)
    ) {
      return res.status(400).json({
        success: false,
        message: "Job title must contain at least 3 characters.",
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" ||
        description.trim().length < 20)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job description must contain at least 20 characters.",
      });
    }

    const job = await prisma.job.update({
      where: {
        id,
      },
      data: {
        ...(title !== undefined && {
          title:
            typeof title === "string"
              ? title.trim()
              : existingJob.title,
        }),

        ...(description !== undefined && {
          description:
            typeof description === "string"
              ? description.trim()
              : existingJob.description,
        }),

        ...(requirements !== undefined && {
          requirements:
            typeof requirements === "string"
              ? requirements.trim()
              : null,
        }),

        ...(location !== undefined && {
          location:
            typeof location === "string"
              ? location.trim()
              : null,
        }),

        ...(salaryMin !== undefined && {
          salaryMin:
            salaryMin === null
              ? null
              : Number(salaryMin),
        }),

        ...(salaryMax !== undefined && {
          salaryMax:
            salaryMax === null
              ? null
              : Number(salaryMax),
        }),

        ...(currency !== undefined && {
          currency:
            typeof currency === "string"
              ? currency.trim().toUpperCase()
              : existingJob.currency,
        }),

        ...(jobType !== undefined && {
          jobType,
        }),

        ...(status !== undefined && {
          status,
        }),

        ...(deadline !== undefined && {
          applicationDeadline: deadline,
        }),
      },

      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            location: true,
            industry: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Job updated successfully.",
      data: {
        job,
      },
    });
  } catch (error) {
    console.error("Update job error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while updating the job.",
    });
  }
}

/**
 * Close a job
 * EMPLOYER only
 */
export async function closeJob(
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
        message: "Only employers can close jobs.",
      });
    }

    const id = getJobId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required.",
      });
    }

    const employer = await prisma.employerProfile.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer profile not found.",
      });
    }

    const existingJob = await prisma.job.findUnique({
      where: {
        id,
      },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    if (existingJob.employerId !== employer.id) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to close this job.",
      });
    }

    if (existingJob.status === "CLOSED") {
      return res.status(400).json({
        success: false,
        message: "This job is already closed.",
      });
    }

    const job = await prisma.job.update({
      where: {
        id,
      },
      data: {
        status: "CLOSED",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Job closed successfully.",
      data: {
        job,
      },
    });
  } catch (error) {
    console.error("Close job error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while closing the job.",
    });
  }
}

/**
 * Apply for a job
 * GRADUATE / ARTISAN only
 */
export async function applyForJob(
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

    const jobId = getJobId(req);

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required.",
      });
    }

    const {
      coverLetter,
      cvUrl,
    } = req.body;

    /**
     * Validate cover letter
     */
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

    if (
      typeof coverLetter === "string" &&
      coverLetter.trim().length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cover letter cannot exceed 5000 characters.",
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

    /**
     * Validate CV URL format when provided
     */
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
     * Find the job
     */
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
        employerId: true,
        postedById: true,
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

    /**
     * Job must still be open
     */
    if (job.status !== "OPEN") {
      return res.status(400).json({
        success: false,
        message:
          "Applications are no longer being accepted for this job.",
      });
    }

    /**
     * Check application deadline
     */
    if (
      job.applicationDeadline &&
      job.applicationDeadline <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The application deadline for this job has passed.",
      });
    }

    /**
     * Prevent the employer who posted the job
     * from applying to their own job.
     */
    if (job.postedById === req.user.userId) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot apply for a job you posted.",
      });
    }

    /**
     * Determine applicant profile
     */
    let graduateId: string | null = null;
    let artisanId: string | null = null;

    if (req.user.role === "GRADUATE") {
      const graduate = await prisma.graduateProfile.findUnique({
        where: {
          userId: req.user.userId,
        },
        select: {
          id: true,
        },
      });

      if (!graduate) {
        return res.status(404).json({
          success: false,
          message:
            "Graduate profile not found. Please complete your profile before applying.",
        });
      }

      graduateId = graduate.id;
    }

    if (req.user.role === "ARTISAN") {
      const artisan = await prisma.artisanProfile.findUnique({
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
          message:
            "Artisan profile not found. Please complete your profile before applying.",
        });
      }

      artisanId = artisan.id;
    }

    /**
     * Prevent duplicate applications
     */
    const existingApplication =
      await prisma.jobApplication.findUnique({
        where: {
          jobId_applicantId: {
            jobId,
            applicantId: req.user.userId,
          },
        },
        select: {
          id: true,
        },
      });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message:
          "You have already applied for this job.",
      });
    }

    /**
     * Create application
     */
    const application =
      await prisma.jobApplication.create({
        data: {
          jobId,
          applicantId: req.user.userId,
          graduateId,
          artisanId,
          coverLetter:
            typeof coverLetter === "string" &&
            coverLetter.trim()
              ? coverLetter.trim()
              : null,
          cvUrl:
            typeof cvUrl === "string" &&
            cvUrl.trim()
              ? cvUrl.trim()
              : null,
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
    console.error("Apply for job error:", error);

    /**
     * Prisma P2002 = unique constraint violation.
     * This protects against duplicate applications even
     * when two requests arrive at almost the same time.
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
        "An unexpected error occurred while applying for the job.",
    });
  }
}