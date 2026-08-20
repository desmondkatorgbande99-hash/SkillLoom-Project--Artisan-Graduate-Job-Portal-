import { Response } from "express";
import prisma from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

/**
 * Graduate dashboard
 */
export async function getGraduateDashboard(
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

    if (req.user.role !== "GRADUATE") {
      return res.status(403).json({
        success: false,
        message: "Only graduates can access this dashboard.",
      });
    }

    const [profile, applications, openJobs] =
      await Promise.all([
        prisma.graduateProfile.findUnique({
          where: {
            userId: req.user.userId,
          },
        }),

        prisma.jobApplication.findMany({
          where: {
            applicantId: req.user.userId,
          },
          orderBy: {
            appliedAt: "desc",
          },
          take: 5,
          include: {
            job: {
              select: {
                id: true,
                title: true,
                location: true,
                jobType: true,
                status: true,
                createdAt: true,
              },
            },
          },
        }),

        prisma.job.count({
          where: {
            status: "OPEN",
          },
        }),
      ]);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Graduate profile not found.",
      });
    }

    const applicationCounts =
      await prisma.jobApplication.groupBy({
        by: ["status"],
        where: {
          applicantId: req.user.userId,
        },
        _count: {
          id: true,
        },
      });

    const counts = {
      total: 0,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
      withdrawn: 0,
    };

    for (const item of applicationCounts) {
      const count = item._count.id;

      counts.total += count;

      switch (item.status) {
        case "PENDING":
          counts.pending = count;
          break;
        case "REVIEWING":
          counts.reviewing = count;
          break;
        case "SHORTLISTED":
          counts.shortlisted = count;
          break;
        case "REJECTED":
          counts.rejected = count;
          break;
        case "HIRED":
          counts.hired = count;
          break;
        case "WITHDRAWN":
          counts.withdrawn = count;
          break;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.userId,
          role: req.user.role,
        },
        profile,
        stats: {
          applications: counts,
          openJobs,
        },
        recentApplications: applications,
      },
    });
  } catch (error) {
    console.error("Get graduate dashboard error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching the graduate dashboard.",
    });
  }
}

/**
 * Artisan dashboard
 */
export async function getArtisanDashboard(
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

    if (req.user.role !== "ARTISAN") {
      return res.status(403).json({
        success: false,
        message: "Only artisans can access this dashboard.",
      });
    }

    const [profile, applications, openJobs] =
      await Promise.all([
        prisma.artisanProfile.findUnique({
          where: {
            userId: req.user.userId,
          },
        }),

        prisma.jobApplication.findMany({
          where: {
            applicantId: req.user.userId,
          },
          orderBy: {
            appliedAt: "desc",
          },
          take: 5,
          include: {
            job: {
              select: {
                id: true,
                title: true,
                location: true,
                jobType: true,
                status: true,
                createdAt: true,
              },
            },
          },
        }),

        prisma.job.count({
          where: {
            status: "OPEN",
          },
        }),
      ]);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Artisan profile not found.",
      });
    }

    const applicationCounts =
      await prisma.jobApplication.groupBy({
        by: ["status"],
        where: {
          applicantId: req.user.userId,
        },
        _count: {
          id: true,
        },
      });

    const counts = {
      total: 0,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
      withdrawn: 0,
    };

    for (const item of applicationCounts) {
      const count = item._count.id;

      counts.total += count;

      switch (item.status) {
        case "PENDING":
          counts.pending = count;
          break;
        case "REVIEWING":
          counts.reviewing = count;
          break;
        case "SHORTLISTED":
          counts.shortlisted = count;
          break;
        case "REJECTED":
          counts.rejected = count;
          break;
        case "HIRED":
          counts.hired = count;
          break;
        case "WITHDRAWN":
          counts.withdrawn = count;
          break;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.userId,
          role: req.user.role,
        },
        profile,
        stats: {
          applications: counts,
          openJobs,
        },
        recentApplications: applications,
      },
    });
  } catch (error) {
    console.error("Get artisan dashboard error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching the artisan dashboard.",
    });
  }
}

/**
 * Employer dashboard
 */
export async function getEmployerDashboard(
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
        message: "Only employers can access this dashboard.",
      });
    }

    const employer =
      await prisma.employerProfile.findUnique({
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

    const [jobs, applicationCounts, recentApplications] =
      await Promise.all([
        prisma.job.findMany({
          where: {
            employerId: employer.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          include: {
            _count: {
              select: {
                applications: true,
              },
            },
          },
        }),

        prisma.jobApplication.groupBy({
          by: ["status"],
          where: {
            job: {
              employerId: employer.id,
            },
          },
          _count: {
            id: true,
          },
        }),

        prisma.jobApplication.findMany({
          where: {
            job: {
              employerId: employer.id,
            },
          },
          orderBy: {
            appliedAt: "desc",
          },
          take: 10,
          include: {
            job: {
              select: {
                id: true,
                title: true,
                location: true,
                jobType: true,
              },
            },
            applicant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatarUrl: true,
              },
            },
          },
        }),
      ]);

    const jobCounts = await prisma.job.groupBy({
      by: ["status"],
      where: {
        employerId: employer.id,
      },
      _count: {
        id: true,
      },
    });

    const stats = {
      jobs: {
        total: 0,
        draft: 0,
        open: 0,
        closed: 0,
      },
      applications: {
        total: 0,
        pending: 0,
        reviewing: 0,
        shortlisted: 0,
        rejected: 0,
        hired: 0,
        withdrawn: 0,
      },
    };

    for (const item of jobCounts) {
      const count = item._count.id;

      stats.jobs.total += count;

      switch (item.status) {
        case "DRAFT":
          stats.jobs.draft = count;
          break;
        case "OPEN":
          stats.jobs.open = count;
          break;
        case "CLOSED":
          stats.jobs.closed = count;
          break;
      }
    }

    for (const item of applicationCounts) {
      const count = item._count.id;

      stats.applications.total += count;

      switch (item.status) {
        case "PENDING":
          stats.applications.pending = count;
          break;
        case "REVIEWING":
          stats.applications.reviewing = count;
          break;
        case "SHORTLISTED":
          stats.applications.shortlisted = count;
          break;
        case "REJECTED":
          stats.applications.rejected = count;
          break;
        case "HIRED":
          stats.applications.hired = count;
          break;
        case "WITHDRAWN":
          stats.applications.withdrawn = count;
          break;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.userId,
          role: req.user.role,
        },
        profile: employer,
        stats,
        recentJobs: jobs,
        recentApplications,
      },
    });
  } catch (error) {
    console.error("Get employer dashboard error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching the employer dashboard.",
    });
  }
}

/**
 * Admin dashboard
 */
export async function getAdminDashboard(
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

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can access this dashboard.",
      });
    }

    const [
      totalUsers,
      usersByRole,
      totalJobs,
      jobsByStatus,
      totalApplications,
      applicationsByStatus,
      pendingEmployers,
      recentUsers,
      recentJobs,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.groupBy({
        by: ["role"],
        _count: {
          id: true,
        },
      }),

      prisma.job.count(),

      prisma.job.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      }),

      prisma.jobApplication.count(),

      prisma.jobApplication.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      }),

      prisma.employerProfile.count({
        where: {
          approvalStatus: "PENDING",
        },
      }),

      prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),

      prisma.job.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          jobType: true,
          location: true,
          createdAt: true,
          employer: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
      }),
    ]);

    const roles = {
      employers: 0,
      graduates: 0,
      artisans: 0,
      admins: 0,
    };

    for (const item of usersByRole) {
      switch (item.role) {
        case "EMPLOYER":
          roles.employers = item._count.id;
          break;
        case "GRADUATE":
          roles.graduates = item._count.id;
          break;
        case "ARTISAN":
          roles.artisans = item._count.id;
          break;
        case "ADMIN":
          roles.admins = item._count.id;
          break;
      }
    }

    const jobStats = {
      total: totalJobs,
      draft: 0,
      open: 0,
      closed: 0,
    };

    for (const item of jobsByStatus) {
      switch (item.status) {
        case "DRAFT":
          jobStats.draft = item._count.id;
          break;
        case "OPEN":
          jobStats.open = item._count.id;
          break;
        case "CLOSED":
          jobStats.closed = item._count.id;
          break;
      }
    }

    const applicationStats = {
      total: totalApplications,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
      withdrawn: 0,
    };

    for (const item of applicationsByStatus) {
      switch (item.status) {
        case "PENDING":
          applicationStats.pending = item._count.id;
          break;
        case "REVIEWING":
          applicationStats.reviewing = item._count.id;
          break;
        case "SHORTLISTED":
          applicationStats.shortlisted = item._count.id;
          break;
        case "REJECTED":
          applicationStats.rejected = item._count.id;
          break;
        case "HIRED":
          applicationStats.hired = item._count.id;
          break;
        case "WITHDRAWN":
          applicationStats.withdrawn = item._count.id;
          break;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          byRole: roles,
        },
        jobs: jobStats,
        applications: applicationStats,
        pendingEmployerApprovals: pendingEmployers,
        recentUsers,
        recentJobs,
      },
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while fetching the admin dashboard.",
    });
  }
}