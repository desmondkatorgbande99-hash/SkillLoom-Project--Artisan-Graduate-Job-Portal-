import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

import type {
  ApplicationStatus,
  Job,
  JobApplication,
  UserRole,
} from "../types";

type DashboardPageProps = {
  onLogout: () => void;
  onNavigateHome?: () => void;
};

const roleInformation = {
  GRADUATE: {
    title: "Graduate Dashboard",
    description:
      "Manage your profile, discover jobs and track your applications.",
  },
  ARTISAN: {
    title: "Artisan Dashboard",
    description:
      "Manage your skills, discover opportunities and track your applications.",
  },
  EMPLOYER: {
    title: "Employer Dashboard",
    description:
      "Manage your jobs, review applicants and find the right talent.",
  },
  ADMIN: {
    title: "Admin Dashboard",
    description:
      "Manage SkillLoom users, jobs, applications and platform activity.",
  },
} as const;

interface JobsResponse {
  success: boolean;
  message?: string;
  data?: {
    jobs?: Job[];
  };
  jobs?: Job[];
}

interface ApplicationsResponse {
  success: boolean;
  message?: string;
  data?: {
    applications?: JobApplication[];
  };
  applications?: JobApplication[];
}

interface EmployerDashboardStats {
  jobs: {
    total: number;
    draft: number;
    open: number;
    closed: number;
  };
  applications: {
    total: number;
    pending: number;
    reviewing: number;
    shortlisted: number;
    rejected: number;
    hired: number;
    withdrawn: number;
  };
}

interface EmployerDashboardProfile {
  id?: string;
  companyName?: string | null;
  companyDescription?: string | null;
  industry?: string | null;
  location?: string | null;
  website?: string | null;
  companyWebsite?: string | null;
  approvalStatus?: string | null;
  phone?: string | null;
  companySize?: string | null;
}

interface EmployerApplicant {
  id?: string;
  fullName?: string | null;
  email?: string | null;
  role?: UserRole | string | null;
  avatarUrl?: string | null;
}

interface EmployerApplication {
  id: string;
  status: ApplicationStatus;
  appliedAt?: string | null;
  createdAt?: string | null;
  job?: {
    id?: string;
    title?: string | null;
    location?: string | null;
    jobType?: string | null;
  } | null;
  applicant?: EmployerApplicant | null;
}

interface EmployerJob extends Job {
  _count?: {
    applications?: number;
  };
}

interface EmployerDashboardResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: {
      id?: string;
      role?: UserRole;
    };
    profile?: EmployerDashboardProfile;
    stats?: EmployerDashboardStats;
    recentJobs?: EmployerJob[];
    recentApplications?: EmployerApplication[];
  };
}

/* =========================
   ADMIN DASHBOARD TYPES
========================= */

interface AdminDashboardStats {
  users: {
    total: number;
    byRole: {
      employers: number;
      graduates: number;
      artisans: number;
      admins: number;
    };
  };
  jobs: {
    total: number;
    draft: number;
    open: number;
    closed: number;
  };
  applications: {
    total: number;
    pending: number;
    reviewing: number;
    shortlisted: number;
    rejected: number;
    hired: number;
    withdrawn: number;
  };
  pendingEmployerApprovals: number;
  recentUsers: AdminRecentUser[];
  recentJobs: AdminRecentJob[];
}

interface AdminRecentUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: string;
  createdAt: string;
}

interface AdminRecentJob {
  id: string;
  title: string;
  status: string;
  jobType: string;
  location?: string | null;
  createdAt: string;
  employer?: {
    id: string;
    companyName: string | null;
  } | null;
}

interface AdminDashboardResponse {
  success: boolean;
  message?: string;
  data?: AdminDashboardStats;
}

function extractJobs(response: JobsResponse): Job[] {
  if (Array.isArray(response.data?.jobs)) {
    return response.data.jobs;
  }

  if (Array.isArray(response.jobs)) {
    return response.jobs;
  }

  return [];
}

function extractApplications(
  response: ApplicationsResponse,
): JobApplication[] {
  if (Array.isArray(response.data?.applications)) {
    return response.data.applications;
  }

  if (Array.isArray(response.applications)) {
    return response.applications;
  }

  return [];
}

function formatDate(date?: string | null) {
  if (!date) {
    return "No date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No date";
  }

  return parsedDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSalary(
  minimum?: number | string | null,
  maximum?: number | string | null,
  currency = "NGN",
) {
  if (minimum === null || minimum === undefined) {
    if (maximum === null || maximum === undefined) {
      return "Salary not specified";
    }
  }

  const formatAmount = (amount: number | string) => {
    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount)) {
      return String(amount);
    }

    return new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const symbol = currency === "NGN" ? "₦" : `${currency} `;

  if (
    minimum !== null &&
    minimum !== undefined &&
    maximum !== null &&
    maximum !== undefined
  ) {
    return `${symbol}${formatAmount(minimum)} – ${symbol}${formatAmount(
      maximum,
    )}`;
  }

  if (minimum !== null && minimum !== undefined) {
    return `From ${symbol}${formatAmount(minimum)}`;
  }

  return `Up to ${symbol}${formatAmount(maximum as number | string)}`;
}

function getStatusLabel(status: ApplicationStatus) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusStyles(status: ApplicationStatus) {
  switch (status) {
    case "HIRED":
      return {
        background: "#dcfce7",
        color: "#166534",
      };

    case "SHORTLISTED":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };

    case "REVIEWING":
      return {
        background: "#fef3c7",
        color: "#92400e",
      };

    case "REJECTED":
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };

    case "WITHDRAWN":
      return {
        background: "#f1f5f9",
        color: "#475569",
      };

    case "PENDING":
    default:
      return {
        background: "#e0f2fe",
        color: "#0369a1",
      };
  }
}

function getJobStatusStyles(status?: string | null) {
  switch (status) {
    case "OPEN":
      return {
        background: "#dcfce7",
        color: "#166534",
      };

    case "DRAFT":
      return {
        background: "#fef3c7",
        color: "#92400e",
      };

    case "CLOSED":
      return {
        background: "#f1f5f9",
        color: "#475569",
      };

    default:
      return {
        background: "#e0f2fe",
        color: "#0369a1",
      };
  }
}

function getAdminRoleLabel(role: UserRole) {
  return role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAdminRoleStyles(role: UserRole) {
  switch (role) {
    case "EMPLOYER":
      return {
        background: "#ede9fe",
        color: "#6d28d9",
      };

    case "ARTISAN":
      return {
        background: "#fff7ed",
        color: "#c2410c",
      };

    case "ADMIN":
      return {
        background: "#fee2e2",
        color: "#b91c1c",
      };

    case "GRADUATE":
    default:
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
  }
}

function DashboardPage({ onLogout, onNavigateHome }: DashboardPageProps) {
  const { user, profile } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  const [employerStats, setEmployerStats] =
    useState<EmployerDashboardStats | null>(null);

  const [employerProfile, setEmployerProfile] =
    useState<EmployerDashboardProfile | null>(null);

  const [employerJobs, setEmployerJobs] = useState<EmployerJob[]>([]);
  const [employerApplications, setEmployerApplications] =
    useState<EmployerApplication[]>([]);

  const [adminDashboard, setAdminDashboard] =
    useState<AdminDashboardStats | null>(null);

  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState("");
  const [applyErrorMessage, setApplyErrorMessage] = useState("");
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [jobCategoryFilter, setJobCategoryFilter] = useState("All");
  
  // Logout flow state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");

  // Application action state
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [withdrawConfirmAppId, setWithdrawConfirmAppId] = useState<string | null>(null);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsLoggingOut(false);
      setLogoutMessage("Logged out successfully");
      setTimeout(() => {
        onLogout();
      }, 700);
    }, 900);
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      setActionInProgressId(applicationId);
      await apiRequest(`/applications/${applicationId}/withdraw`, {
        method: "PATCH",
        auth: true,
      });

      // Refresh applications
      const updatedApplications = await apiRequest<ApplicationsResponse>(
        "/applications/my-applications",
        {
          method: "GET",
          auth: true,
        }
      );
      setApplications(extractApplications(updatedApplications));
      setWithdrawConfirmAppId(null);
      setApplySuccessMessage("Application withdrawn successfully.");
      setTimeout(() => setApplySuccessMessage(""), 5000);
    } catch (err) {
      setApplyErrorMessage(err instanceof Error ? err.message : "Failed to withdraw application.");
      setTimeout(() => setApplyErrorMessage(""), 5000);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    try {
      setActionInProgressId(applicationId);
      await apiRequest(`/applications/${applicationId}/status`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ status: newStatus }),
      });

      // Refresh employer dashboard
      const response = await apiRequest<EmployerDashboardResponse>(
        "/dashboard/employer",
        {
          method: "GET",
          auth: true,
        }
      );
      if (response.success && response.data) {
        setEmployerProfile(response.data.profile ?? null);
        setEmployerStats(response.data.stats ?? null);
        setEmployerJobs(response.data.recentJobs ?? []);
        setEmployerApplications(response.data.recentApplications ?? []);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update application status.");
    } finally {
      setActionInProgressId(null);
    }
  };

  const appliedJobIds = useMemo(() => {
    return new Set(
      applications.map((app) => (app as any).jobId || app.job?.id).filter(Boolean)
    );
  }, [applications]);

  const handleConfirmApply = async (jobId: string) => {
    try {
      setIsApplying(true);
      setApplyErrorMessage("");

      await apiRequest("/applications", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ jobId }),
      });

      const updatedApplications = await apiRequest<ApplicationsResponse>(
        "/applications/my-applications",
        {
          method: "GET",
          auth: true,
        }
      );
      setApplications(extractApplications(updatedApplications));

      setSelectedJobForApply(null);
      setApplySuccessMessage(
        "Application submitted successfully! Check 'My Applications' to track your status."
      );

      setTimeout(() => {
        setApplySuccessMessage("");
      }, 6000);
    } catch (err) {
      setApplyErrorMessage(
        err instanceof Error ? err.message : "Failed to apply for job."
      );
    } finally {
      setIsApplying(false);
    }
  };

  const filteredAvailableJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (job.status !== "OPEN") return false;

      const titleLower = job.title.toLowerCase();
      const descLower = (job.description || "").toLowerCase();

      const matchesCategory =
        jobCategoryFilter === "All" ||
        (jobCategoryFilter === "Technology" &&
          (titleLower.includes("developer") ||
            titleLower.includes("data") ||
            titleLower.includes("designer") ||
            descLower.includes("software"))) ||
        (jobCategoryFilter === "Skilled Trades" &&
          (titleLower.includes("electrician") ||
            titleLower.includes("plumb") ||
            titleLower.includes("mechanic") ||
            titleLower.includes("welder") ||
            titleLower.includes("carpenter"))) ||
        (jobCategoryFilter === "Fashion & Design" &&
          (titleLower.includes("tailor") ||
            titleLower.includes("fashion") ||
            titleLower.includes("designer"))) ||
        (jobCategoryFilter === "Construction" &&
          (titleLower.includes("carpenter") ||
            titleLower.includes("construction") ||
            titleLower.includes("woodworker") ||
            titleLower.includes("electrician"))) ||
        (jobCategoryFilter === "Business & Finance" &&
          (titleLower.includes("marketing") ||
            titleLower.includes("operations") ||
            titleLower.includes("finance") ||
            titleLower.includes("analyst")));

      const searchLower = jobSearchTerm.trim().toLowerCase();
      const matchesSearch =
        !searchLower ||
        titleLower.includes(searchLower) ||
        (job.employer?.companyName &&
          job.employer.companyName.toLowerCase().includes(searchLower)) ||
        (job.location && job.location.toLowerCase().includes(searchLower)) ||
        descLower.includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [jobs, jobCategoryFilter, jobSearchTerm]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const dashboardPath = `/dashboard/${user.role.toLowerCase()}`;

    if (window.location.pathname !== dashboardPath) {
      window.history.replaceState({}, document.title, dashboardPath);
    }
  }, [user]);

  /*
   * Graduate and Artisan dashboards
   */
  useEffect(() => {
    if (
      !user ||
      (user.role !== "GRADUATE" && user.role !== "ARTISAN")
    ) {
      return;
    }

    let isMounted = true;

    const loadApplicantDashboard = async () => {
      setIsDashboardLoading(true);
      setDashboardError("");

      try {
        const [jobsResponse, applicationsResponse] = await Promise.all([
          apiRequest<JobsResponse>("/jobs", {
            method: "GET",
          }),
          apiRequest<ApplicationsResponse>("/applications/my-applications", {
            method: "GET",
            auth: true,
          }),
        ]);

        if (!isMounted) {
          return;
        }

        setJobs(extractJobs(jobsResponse));
        setApplications(extractApplications(applicationsResponse));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDashboardError(
          error instanceof Error
            ? error.message
            : "Unable to load your dashboard data.",
        );
      } finally {
        if (isMounted) {
          setIsDashboardLoading(false);
        }
      }
    };

    void loadApplicantDashboard();

    return () => {
      isMounted = false;
    };
  }, [user]);

  /*
   * Employer dashboard
   */
  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") {
      return;
    }

    let isMounted = true;

    const loadEmployerDashboard = async () => {
      setIsDashboardLoading(true);
      setDashboardError("");

      try {
        const response = await apiRequest<EmployerDashboardResponse>(
          "/dashboard/employer",
          {
            method: "GET",
            auth: true,
          },
        );

        if (!isMounted) {
          return;
        }

        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Unable to load employer dashboard.",
          );
        }

        setEmployerProfile(response.data.profile ?? null);
        setEmployerStats(response.data.stats ?? null);
        setEmployerJobs(response.data.recentJobs ?? []);
        setEmployerApplications(response.data.recentApplications ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDashboardError(
          error instanceof Error
            ? error.message
            : "Unable to load your employer dashboard.",
        );
      } finally {
        if (isMounted) {
          setIsDashboardLoading(false);
        }
      }
    };

    void loadEmployerDashboard();

    return () => {
      isMounted = false;
    };
  }, [user]);

  /*
   * Admin dashboard
   *
   * Uses the complete backend admin dashboard payload:
   * users, jobs, applications, pending employer approvals,
   * recent users and recent jobs.
   */
  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      return;
    }

    let isMounted = true;

    const loadAdminDashboard = async () => {
      setIsDashboardLoading(true);
      setDashboardError("");

      try {
        const response = await apiRequest<AdminDashboardResponse>(
          "/dashboard/admin",
          {
            method: "GET",
            auth: true,
          },
        );

        if (!isMounted) {
          return;
        }

        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Unable to load admin dashboard.",
          );
        }

        setAdminDashboard(response.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDashboardError(
          error instanceof Error
            ? error.message
            : "Unable to load your admin dashboard.",
        );
      } finally {
        if (isMounted) {
          setIsDashboardLoading(false);
        }
      }
    };

    void loadAdminDashboard();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const applicationStats = useMemo(() => {
    return {
      total: applications.length,

      pending: applications.filter(
        (application) => application.status === "PENDING",
      ).length,

      reviewing: applications.filter(
        (application) => application.status === "REVIEWING",
      ).length,

      shortlisted: applications.filter(
        (application) => application.status === "SHORTLISTED",
      ).length,

      hired: applications.filter(
        (application) => application.status === "HIRED",
      ).length,
    };
  }, [applications]);

  if (!user) {
    return null;
  }

  const information = roleInformation[user.role as UserRole];

  const isApplicant =
    user.role === "GRADUATE" || user.role === "ARTISAN";

  const isArtisan = user.role === "ARTISAN";

  const employerCompanyName =
    employerProfile?.companyName ||
    user.fullName ||
    "Your Company";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div
            onClick={onNavigateHome ? onNavigateHome : () => { window.location.href = "/"; }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
            }}
            title="SkillLoom - Back to Home"
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, #2563eb, #0ea5e9)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              S
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "18px",
                  color: "#0f172a",
                }}
              >
                SkillLoom
              </strong>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Weaving Skills Into Opportunity
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#334155",
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px 64px",
        }}
      >
        <div
          style={{
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              marginBottom: "10px",
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {user.role}
          </span>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(30px, 5vw, 46px)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {information.title}
          </h1>

          <p
            style={{
              maxWidth: "700px",
              marginTop: "14px",
              color: "#64748b",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            {information.description}
          </p>
        </div>

        {isApplicant ? (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              {[
                {
                  label: "Applications",
                  value: applicationStats.total,
                  detail: "Total submitted",
                },
                {
                  label: "Pending",
                  value: applicationStats.pending,
                  detail: "Awaiting review",
                },
                {
                  label: "Reviewing",
                  value: applicationStats.reviewing,
                  detail: "Being reviewed",
                },
                {
                  label: isArtisan ? "Hired" : "Shortlisted",
                  value: isArtisan
                    ? applicationStats.hired
                    : applicationStats.shortlisted,
                  detail: isArtisan
                    ? "Successful applications"
                    : "Next-stage opportunities",
                },
              ].map((stat) => (
                <article
                  key={stat.label}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "22px",
                    boxShadow:
                      "0 8px 30px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {stat.label}
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "8px",
                      fontSize: "30px",
                    }}
                  >
                    {isDashboardLoading ? "—" : stat.value}
                  </strong>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {stat.detail}
                  </span>
                </article>
              ))}
            </section>

            {dashboardError && (
              <div
                style={{
                  marginBottom: "28px",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  lineHeight: 1.6,
                }}
              >
                <strong>Unable to load dashboard data.</strong>

                <p style={{ margin: "5px 0 0" }}>
                  {dashboardError}
                </p>
              </div>
            )}

            <section
              className="dashboard-responsive-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1.45fr) minmax(300px, 0.85fr)",
                gap: "24px",
                alignItems: "start",
              }}
            >
              <article
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow:
                    "0 8px 30px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: "22px" }}>
                      My Applications
                    </h2>

                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                        fontSize: "14px",
                      }}
                    >
                      Track the progress of your job applications.
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "7px 10px",
                      borderRadius: "999px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {applications.length} total
                  </span>
                </div>

                {isDashboardLoading ? (
                  <div
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Loading your applications...
                  </div>
                ) : applications.length === 0 ? (
                  <div
                    style={{
                      padding: "32px 20px",
                      borderRadius: "14px",
                      background: "#f8fafc",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      No applications yet
                    </strong>

                    Start exploring available jobs and submit your
                    first application.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    {applications.slice(0, 6).map((application) => {
                      const statusStyle = getStatusStyles(
                        application.status,
                      );

                      return (
                        <div
                          key={application.id}
                          style={{
                            padding: "18px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                display: "block",
                                fontSize: "16px",
                              }}
                            >
                              {application.job?.title ??
                                "Job application"}
                            </strong>

                            <span
                              style={{
                                display: "block",
                                marginTop: "5px",
                                color: "#64748b",
                                fontSize: "13px",
                              }}
                            >
                              {application.job?.location ??
                                "Location not specified"}
                            </span>

                            <span
                              style={{
                                display: "block",
                                marginTop: "5px",
                                color: "#94a3b8",
                                fontSize: "12px",
                              }}
                            >
                              Applied{" "}
                              {formatDate(
                                application.appliedAt ??
                                  application.createdAt,
                              )}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                padding: "7px 11px",
                                borderRadius: "999px",
                                background: statusStyle.background,
                                color: statusStyle.color,
                                fontSize: "12px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getStatusLabel(application.status)}
                            </span>

                            {application.status !== "WITHDRAWN" && application.status !== "REJECTED" && (
                              <button
                                type="button"
                                onClick={() => setWithdrawConfirmAppId(application.id)}
                                disabled={actionInProgressId === application.id}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #fecaca",
                                  background: "#fef2f2",
                                  color: "#b91c1c",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                {actionInProgressId === application.id ? "Withdrawing..." : "Withdraw"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>

              <article
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow:
                    "0 8px 30px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <h2 style={{ margin: 0, fontSize: "22px" }}>
                    Your Profile
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    Your current SkillLoom account information.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "14px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      Full name
                    </span>

                    <strong>{user.fullName}</strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      Email
                    </span>

                    <strong style={{ wordBreak: "break-word" }}>
                      {user.email}
                    </strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      Account status
                    </span>

                    <strong>{user.status}</strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      Email verification
                    </span>

                    <strong
                      style={{
                        color: user.isEmailVerified
                          ? "#16a34a"
                          : "#dc2626",
                      }}
                    >
                      {user.isEmailVerified
                        ? "Verified"
                        : "Not verified"}
                    </strong>
                  </div>

                  {isArtisan && profile?.artisanProfile && (
                    <>
                      {profile.artisanProfile.trade && (
                        <div>
                          <span
                            style={{
                              display: "block",
                              color: "#94a3b8",
                              fontSize: "12px",
                              marginBottom: "4px",
                            }}
                          >
                            Trade
                          </span>

                          <strong>
                            {profile.artisanProfile.trade}
                          </strong>
                        </div>
                      )}

                      {profile.artisanProfile.location && (
                        <div>
                          <span
                            style={{
                              display: "block",
                              color: "#94a3b8",
                              fontSize: "12px",
                              marginBottom: "4px",
                            }}
                          >
                            Location
                          </span>

                          <strong>
                            {profile.artisanProfile.location}
                          </strong>
                        </div>
                      )}

                      {profile.artisanProfile.yearsExperience !==
                        null &&
                        profile.artisanProfile.yearsExperience !==
                          undefined && (
                          <div>
                            <span
                              style={{
                                display: "block",
                                color: "#94a3b8",
                                fontSize: "12px",
                                marginBottom: "4px",
                              }}
                            >
                              Experience
                            </span>

                            <strong>
                              {profile.artisanProfile.yearsExperience}{" "}
                              years
                            </strong>
                          </div>
                        )}

                      {profile.artisanProfile.hourlyRate !== null &&
                        profile.artisanProfile.hourlyRate !==
                          undefined && (
                          <div>
                            <span
                              style={{
                                display: "block",
                                color: "#94a3b8",
                                fontSize: "12px",
                                marginBottom: "4px",
                              }}
                            >
                              Hourly rate
                            </span>

                            <strong>
                              ₦
                              {new Intl.NumberFormat("en-NG").format(
                                profile.artisanProfile.hourlyRate,
                              )}
                            </strong>
                          </div>
                        )}
                    </>
                  )}

                  {!isArtisan && profile?.graduateProfile && (
                    <>
                      {profile.graduateProfile.location && (
                        <div>
                          <span
                            style={{
                              display: "block",
                              color: "#94a3b8",
                              fontSize: "12px",
                              marginBottom: "4px",
                            }}
                          >
                            Location
                          </span>

                          <strong>
                            {profile.graduateProfile.location}
                          </strong>
                        </div>
                      )}

                      {profile.graduateProfile.skills && (
                        <div>
                          <span
                            style={{
                              display: "block",
                              color: "#94a3b8",
                              fontSize: "12px",
                              marginBottom: "4px",
                            }}
                          >
                            Skills
                          </span>

                          <strong>
                            {profile.graduateProfile.skills}
                          </strong>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            </section>

            {applySuccessMessage && (
              <div
                style={{
                  marginTop: "24px",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span>🎉 <strong>Success:</strong> {applySuccessMessage}</span>
                <button
                  type="button"
                  onClick={() => setApplySuccessMessage("")}
                  style={{ border: "none", background: "transparent", color: "#166534", cursor: "pointer", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>
            )}

            <section
              style={{
                marginTop: "24px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "20px",
                padding: "24px",
                boxShadow:
                  "0 8px 30px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px" }}>
                    Available Opportunities
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    Discover and apply for open positions matching your skills and interests.
                  </p>
                </div>

                <span
                  style={{
                    padding: "7px 12px",
                    borderRadius: "999px",
                    background: "#f0fdf4",
                    color: "#15803d",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {filteredAvailableJobs.length} open position{filteredAvailableJobs.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Filters and Search Bar */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  marginBottom: "24px",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {/* Search input */}
                <input
                  type="text"
                  placeholder="🔍 Search jobs by title, company, location, or skills..."
                  value={jobSearchTerm}
                  onChange={(e) => setJobSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    background: "#f8fafc",
                  }}
                />

                {/* Category Pills */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                  }}
                >
                  {[
                    "All",
                    "Technology",
                    "Skilled Trades",
                    "Fashion & Design",
                    "Construction",
                    "Business & Finance",
                  ].map((category) => {
                    const isSelected = jobCategoryFilter === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setJobCategoryFilter(category)}
                        style={{
                          padding: "7px 14px",
                          borderRadius: "999px",
                          border: isSelected ? "1px solid #2563eb" : "1px solid #e2e8f0",
                          background: isSelected ? "#2563eb" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#475569",
                          fontSize: "13px",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isDashboardLoading ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading available jobs...
                </div>
              ) : filteredAvailableJobs.length === 0 ? (
                <div
                  style={{
                    padding: "40px 20px",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      color: "#334155",
                      marginBottom: "6px",
                      fontSize: "16px",
                    }}
                  >
                    No jobs match your criteria
                  </strong>
                  Try selecting another category or clearing your search query.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {filteredAvailableJobs.map((job) => {
                    const isApplied = appliedJobIds.has(job.id);

                    return (
                      <article
                        key={job.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "18px",
                          padding: "22px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          background: "#ffffff",
                          transition: "box-shadow 0.2s ease",
                          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "12px",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                borderRadius: "999px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                              }}
                            >
                              {job.jobType.replace("_", " ")}
                            </span>

                            {isApplied && (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 8px",
                                  borderRadius: "999px",
                                  background: "#dcfce7",
                                  color: "#166534",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                }}
                              >
                                ✓ Applied
                              </span>
                            )}
                          </div>

                          <h3
                            style={{
                              margin: "0 0 6px",
                              fontSize: "18px",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            {job.title}
                          </h3>

                          <p
                            style={{
                              margin: "0 0 14px",
                              color: "#2563eb",
                              fontSize: "13px",
                              fontWeight: 600,
                            }}
                          >
                            {job.employer?.companyName ?? "SkillLoom Verified Employer"}
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gap: "6px",
                              color: "#475569",
                              fontSize: "13px",
                              marginBottom: "14px",
                            }}
                          >
                            <span>📍 {job.location ?? "Location not specified"}</span>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>
                              💰 {formatSalary(job.salaryMin, job.salaryMax, job.currency ?? "NGN")}
                            </span>
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                              📅 Deadline: {formatDate(job.applicationDeadline)}
                            </span>
                          </div>

                          <p
                            style={{
                              color: "#64748b",
                              fontSize: "13px",
                              lineHeight: 1.6,
                              margin: "0 0 16px",
                            }}
                          >
                            {job.description
                              ? job.description.slice(0, 110) +
                                (job.description.length > 110 ? "..." : "")
                              : "No job description provided."}
                          </p>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "16px",
                            paddingTop: "16px",
                            borderTop: "1px solid #f1f5f9",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedJobForDetails(job)}
                            style={{
                              flex: 1,
                              padding: "10px 14px",
                              borderRadius: "10px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            View Details
                          </button>

                          {isApplied ? (
                            <button
                              type="button"
                              disabled
                              style={{
                                flex: 1,
                                padding: "10px 14px",
                                borderRadius: "10px",
                                border: "none",
                                background: "#f1f5f9",
                                color: "#94a3b8",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "default",
                              }}
                            >
                              Applied
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedJobForApply(job);
                                setApplyErrorMessage("");
                              }}
                              style={{
                                flex: 1,
                                padding: "10px 14px",
                                borderRadius: "10px",
                                border: "none",
                                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                                color: "#ffffff",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Job Details Modal */}
            {selectedJobForDetails && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.6)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 90,
                  padding: "20px",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "24px",
                    width: "100%",
                    maxWidth: "620px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    padding: "32px",
                    boxShadow: "0 25px 60px rgba(15, 23, 42, 0.2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 10px",
                          borderRadius: "999px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: "12px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        {selectedJobForDetails.jobType.replace("_", " ")}
                      </span>
                      <h2
                        style={{
                          margin: "0 0 6px",
                          fontSize: "24px",
                          color: "#0f172a",
                        }}
                      >
                        {selectedJobForDetails.title}
                      </h2>
                      <p
                        style={{
                          margin: 0,
                          color: "#2563eb",
                          fontSize: "15px",
                          fontWeight: 600,
                        }}
                      >
                        {selectedJobForDetails.employer?.companyName ?? "Verified Employer"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedJobForDetails(null)}
                      style={{
                        border: "none",
                        background: "#f1f5f9",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontSize: "18px",
                        color: "#64748b",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "12px",
                      background: "#f8fafc",
                      padding: "16px",
                      borderRadius: "14px",
                      marginBottom: "20px",
                      fontSize: "13px",
                      color: "#334155",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "block",
                          color: "#94a3b8",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          marginBottom: "3px",
                        }}
                      >
                        Location
                      </span>
                      <strong>📍 {selectedJobForDetails.location || "Nigeria"}</strong>
                    </div>
                    <div>
                      <span
                        style={{
                          display: "block",
                          color: "#94a3b8",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          marginBottom: "3px",
                        }}
                      >
                        Salary Range
                      </span>
                      <strong style={{ color: "#16a34a" }}>
                        💰 {formatSalary(selectedJobForDetails.salaryMin, selectedJobForDetails.salaryMax, selectedJobForDetails.currency ?? "NGN")}
                      </strong>
                    </div>
                    <div>
                      <span
                        style={{
                          display: "block",
                          color: "#94a3b8",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          marginBottom: "3px",
                        }}
                      >
                        Deadline
                      </span>
                      <strong>📅 {formatDate(selectedJobForDetails.applicationDeadline)}</strong>
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <h4
                      style={{
                        margin: "0 0 8px",
                        fontSize: "16px",
                        color: "#0f172a",
                      }}
                    >
                      Job Description
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        color: "#475569",
                        fontSize: "14px",
                        lineHeight: "1.7",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {selectedJobForDetails.description}
                    </p>
                  </div>

                  {selectedJobForDetails.requirements && (
                    <div style={{ marginBottom: "28px" }}>
                      <h4
                        style={{
                          margin: "0 0 8px",
                          fontSize: "16px",
                          color: "#0f172a",
                        }}
                      >
                        Requirements & Skills
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          color: "#475569",
                          fontSize: "14px",
                          lineHeight: "1.7",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {selectedJobForDetails.requirements}
                      </p>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedJobForDetails(null)}
                      style={{
                        padding: "12px 20px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                    {appliedJobIds.has(selectedJobForDetails.id) ? (
                      <button
                        type="button"
                        disabled
                        style={{
                          padding: "12px 24px",
                          borderRadius: "10px",
                          border: "none",
                          background: "#dcfce7",
                          color: "#166534",
                          fontWeight: 700,
                          cursor: "default",
                        }}
                      >
                        ✓ Already Applied
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJobForApply(selectedJobForDetails);
                          setSelectedJobForDetails(null);
                        }}
                        style={{
                          padding: "12px 28px",
                          borderRadius: "10px",
                          border: "none",
                          background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                          color: "#ffffff",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Apply for this Job
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Modal */}
            {selectedJobForApply && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.6)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 100,
                  padding: "20px",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    width: "100%",
                    maxWidth: "480px",
                    padding: "32px",
                    boxShadow: "0 25px 60px rgba(15, 23, 42, 0.2)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      margin: "0 auto 16px",
                      borderRadius: "50%",
                      background: "#eff6ff",
                      color: "#2563eb",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "28px",
                    }}
                  >
                    💼
                  </div>
                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: "22px",
                      color: "#0f172a",
                      fontWeight: 800,
                    }}
                  >
                    Are you sure you want to apply for this job?
                  </h3>
                  <p
                    style={{
                      margin: "0 0 6px",
                      color: "#1e293b",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    {selectedJobForApply.title}
                  </p>
                  <p
                    style={{
                      margin: "0 0 24px",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    {selectedJobForApply.employer?.companyName} • {selectedJobForApply.location}
                  </p>

                  {applyErrorMessage && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "#fef2f2",
                        color: "#991b1b",
                        fontSize: "13px",
                        marginBottom: "16px",
                      }}
                    >
                      {applyErrorMessage}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJobForApply(null);
                        setApplyErrorMessage("");
                      }}
                      disabled={isApplying}
                      style={{
                        padding: "12px 24px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      No, Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmApply(selectedJobForApply.id)}
                      disabled={isApplying}
                      style={{
                        padding: "12px 28px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isApplying ? "Applying..." : "Yes, Apply"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Withdraw Application Confirmation Modal */}
            {withdrawConfirmAppId && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.6)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 100,
                  padding: "20px",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "20px",
                    width: "100%",
                    maxWidth: "460px",
                    padding: "32px",
                    boxShadow: "0 25px 60px rgba(15, 23, 42, 0.2)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      margin: "0 auto 16px",
                      borderRadius: "50%",
                      background: "#fef2f2",
                      color: "#dc2626",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "26px",
                    }}
                  >
                    ⚠️
                  </div>
                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: "22px",
                      color: "#0f172a",
                      fontWeight: 800,
                    }}
                  >
                    Withdraw Application?
                  </h3>
                  <p
                    style={{
                      margin: "0 0 24px",
                      color: "#64748b",
                      fontSize: "14px",
                      lineHeight: 1.6,
                    }}
                  >
                    Are you sure you want to withdraw this application? The employer will be notified that your application has been withdrawn.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setWithdrawConfirmAppId(null)}
                      disabled={actionInProgressId === withdrawConfirmAppId}
                      style={{
                        padding: "12px 24px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      No, Keep It
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWithdrawApplication(withdrawConfirmAppId)}
                      disabled={actionInProgressId === withdrawConfirmAppId}
                      style={{
                        padding: "12px 26px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#dc2626",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {actionInProgressId === withdrawConfirmAppId ? "Withdrawing..." : "Yes, Withdraw"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : user.role === "EMPLOYER" ? (
          <>
            {dashboardError && (
              <div
                style={{
                  marginBottom: "28px",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  lineHeight: 1.6,
                }}
              >
                <strong>Unable to load employer dashboard.</strong>

                <p style={{ margin: "5px 0 0" }}>
                  {dashboardError}
                </p>
              </div>
            )}

            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              {[
                {
                  label: "Total Jobs",
                  value: employerStats?.jobs.total,
                  detail: "Jobs posted",
                },
                {
                  label: "Open Jobs",
                  value: employerStats?.jobs.open,
                  detail: "Currently accepting applications",
                },
                {
                  label: "Draft Jobs",
                  value: employerStats?.jobs.draft,
                  detail: "Not yet published",
                },
                {
                  label: "Total Applicants",
                  value: employerStats?.applications.total,
                  detail: "Applications received",
                },
              ].map((stat) => (
                <article
                  key={stat.label}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "22px",
                    boxShadow:
                      "0 8px 30px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {stat.label}
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "8px",
                      fontSize: "30px",
                    }}
                  >
                    {isDashboardLoading ? "—" : stat.value ?? 0}
                  </strong>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {stat.detail}
                  </span>
                </article>
              ))}
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "14px",
                marginBottom: "28px",
              }}
            >
              {[
                {
                  label: "Pending",
                  value: employerStats?.applications.pending,
                },
                {
                  label: "Reviewing",
                  value: employerStats?.applications.reviewing,
                },
                {
                  label: "Shortlisted",
                  value: employerStats?.applications.shortlisted,
                },
                {
                  label: "Hired",
                  value: employerStats?.applications.hired,
                },
                {
                  label: "Rejected",
                  value: employerStats?.applications.rejected,
                },
                {
                  label: "Withdrawn",
                  value: employerStats?.applications.withdrawn,
                },
              ].map((stat) => (
                <article
                  key={stat.label}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "18px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {stat.label}
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "7px",
                      fontSize: "25px",
                    }}
                  >
                    {isDashboardLoading ? "—" : stat.value ?? 0}
                  </strong>
                </article>
              ))}
            </section>

            <section
              className="dashboard-responsive-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1.45fr) minmax(300px, 0.85fr)",
                gap: "24px",
                alignItems: "start",
              }}
            >
              <article
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow:
                    "0 8px 30px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: "22px" }}>
                      Recent Jobs
                    </h2>

                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                        fontSize: "14px",
                      }}
                    >
                      Monitor your latest job postings and applicant
                      activity.
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "7px 10px",
                      borderRadius: "999px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {employerStats?.jobs.total ?? 0} total
                  </span>
                </div>

                {isDashboardLoading ? (
                  <div
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Loading your jobs...
                  </div>
                ) : employerJobs.length === 0 ? (
                  <div
                    style={{
                      padding: "32px 20px",
                      borderRadius: "14px",
                      background: "#f8fafc",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color: "#334155",
                        marginBottom: "6px",
                      }}
                    >
                      No jobs posted yet
                    </strong>

                    Create your first job posting to start receiving
                    applications.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "14px",
                    }}
                  >
                    {employerJobs.map((job) => {
                      const statusStyle = getJobStatusStyles(
                        job.status,
                      );

                      return (
                        <div
                          key={job.id}
                          style={{
                            padding: "18px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "15px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: "16px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  display: "block",
                                  fontSize: "17px",
                                }}
                              >
                                {job.title}
                              </strong>

                              <span
                                style={{
                                  display: "block",
                                  marginTop: "5px",
                                  color: "#64748b",
                                  fontSize: "13px",
                                }}
                              >
                                {job.jobType} ·{" "}
                                {job.location ??
                                  "Location not specified"}
                              </span>
                            </div>

                            <span
                              style={{
                                padding: "7px 11px",
                                borderRadius: "999px",
                                background: statusStyle.background,
                                color: statusStyle.color,
                                fontSize: "11px",
                                fontWeight: 800,
                              }}
                            >
                              {job.status}
                            </span>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(150px, 1fr))",
                              gap: "10px",
                              marginTop: "16px",
                              paddingTop: "14px",
                              borderTop: "1px solid #f1f5f9",
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  display: "block",
                                  color: "#94a3b8",
                                  fontSize: "11px",
                                  marginBottom: "4px",
                                }}
                              >
                                Salary
                              </span>

                              <strong style={{ fontSize: "13px" }}>
                                {formatSalary(
                                  job.salaryMin,
                                  job.salaryMax,
                                  job.currency ?? "NGN",
                                )}
                              </strong>
                            </div>

                            <div>
                              <span
                                style={{
                                  display: "block",
                                  color: "#94a3b8",
                                  fontSize: "11px",
                                  marginBottom: "4px",
                                }}
                              >
                                Deadline
                              </span>

                              <strong style={{ fontSize: "13px" }}>
                                {formatDate(job.applicationDeadline)}
                              </strong>
                            </div>

                            <div>
                              <span
                                style={{
                                  display: "block",
                                  color: "#94a3b8",
                                  fontSize: "11px",
                                  marginBottom: "4px",
                                }}
                              >
                                Applicants
                              </span>

                              <strong style={{ fontSize: "13px" }}>
                                {job._count?.applications ?? 0}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>

              <article
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow:
                    "0 8px 30px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <h2 style={{ margin: 0, fontSize: "22px" }}>
                    Company Profile
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    Your employer account information.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "15px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      Company
                    </span>

                    <strong>{employerCompanyName}</strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      Email
                    </span>

                    <strong style={{ wordBreak: "break-word" }}>
                      {user.email}
                    </strong>
                  </div>

                  {employerProfile?.industry && (
                    <div>
                      <span
                        style={{
                          display: "block",
                          color: "#94a3b8",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        Industry
                      </span>

                      <strong>{employerProfile.industry}</strong>
                    </div>
                  )}

                  {employerProfile?.location && (
                    <div>
                      <span
                        style={{
                          display: "block",
                          color: "#94a3b8",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        Location
                      </span>

                      <strong>{employerProfile.location}</strong>
                    </div>
                  )}

                  {(employerProfile?.website ||
                    employerProfile?.companyWebsite) && (
                    <div>
                      <span
                        style={{
                          display: "block",
                          color: "#94a3b8",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        Website
                      </span>

                      <strong style={{ wordBreak: "break-word" }}>
                        {employerProfile.website ??
                          employerProfile.companyWebsite}
                      </strong>
                    </div>
                  )}

                  {employerProfile?.approvalStatus && (
                    <div>
                      <span
                        style={{
                          display: "block",
                          color: "#94a3b8",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        Approval status
                      </span>

                      <strong
                        style={{
                          color:
                            employerProfile.approvalStatus ===
                            "APPROVED"
                              ? "#16a34a"
                              : "#d97706",
                        }}
                      >
                        {employerProfile.approvalStatus}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      Account status
                    </span>

                    <strong>{user.status}</strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      Email verification
                    </span>

                    <strong
                      style={{
                        color: user.isEmailVerified
                          ? "#16a34a"
                          : "#dc2626",
                      }}
                    >
                      {user.isEmailVerified
                        ? "Verified"
                        : "Not verified"}
                    </strong>
                  </div>
                </div>
              </article>
            </section>

            <section
              style={{
                marginTop: "24px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "20px",
                padding: "24px",
                boxShadow:
                  "0 8px 30px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: "22px" }}>
                    Recent Applicants
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    Review the latest applications received for your
                    jobs.
                  </p>
                </div>

                <span
                  style={{
                    padding: "7px 10px",
                    borderRadius: "999px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {employerApplications.length} recent
                </span>
              </div>

              {isDashboardLoading ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading applicants...
                </div>
              ) : employerApplications.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    No applicants yet
                  </strong>

                  Applicants will appear here when people apply to
                  your jobs.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: "820px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1.2fr 1fr 0.85fr 0.8fr 1.35fr",
                        gap: "14px",
                        padding: "10px 14px",
                        color: "#94a3b8",
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      <span>Applicant</span>
                      <span>Job</span>
                      <span>Applied</span>
                      <span>Status</span>
                      <span>Manage Status</span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "8px",
                      }}
                    >
                      {employerApplications.map((application) => {
                        const statusStyle = getStatusStyles(
                          application.status,
                        );

                        return (
                          <div
                            key={application.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "1.2fr 1fr 0.85fr 0.8fr 1.35fr",
                              gap: "14px",
                              alignItems: "center",
                              padding: "15px 14px",
                              border: "1px solid #e2e8f0",
                              borderRadius: "14px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "11px",
                                minWidth: 0,
                              }}
                            >
                              {application.applicant?.avatarUrl ? (
                                <img
                                  src={
                                    application.applicant.avatarUrl
                                  }
                                  alt={
                                    application.applicant.fullName ??
                                    "Applicant"
                                  }
                                  style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "50%",
                                    display: "grid",
                                    placeItems: "center",
                                    background: "#eff6ff",
                                    color: "#2563eb",
                                    fontWeight: 800,
                                    flexShrink: 0,
                                  }}
                                >
                                  {(
                                    application.applicant
                                      ?.fullName ?? "A"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}

                              <div style={{ minWidth: 0 }}>
                                <strong
                                  style={{
                                    display: "block",
                                    fontSize: "14px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {application.applicant?.fullName ??
                                    "Unknown applicant"}
                                </strong>

                                <span
                                  style={{
                                    display: "block",
                                    marginTop: "3px",
                                    color: "#64748b",
                                    fontSize: "12px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {application.applicant?.email ??
                                    "Email unavailable"}
                                </span>
                              </div>
                            </div>

                            <div>
                              <strong
                                style={{
                                  display: "block",
                                  fontSize: "13px",
                                }}
                              >
                                {application.job?.title ?? "Job"}
                              </strong>

                              <span
                                style={{
                                  display: "block",
                                  marginTop: "3px",
                                  color: "#64748b",
                                  fontSize: "12px",
                                }}
                              >
                                {application.job?.location ??
                                  "Location not specified"}
                              </span>
                            </div>

                            <span
                              style={{
                                color: "#64748b",
                                fontSize: "13px",
                              }}
                            >
                              {formatDate(
                                application.appliedAt ??
                                  application.createdAt,
                              )}
                            </span>

                            <span
                              style={{
                                display: "inline-block",
                                width: "fit-content",
                                padding: "7px 10px",
                                borderRadius: "999px",
                                background: statusStyle.background,
                                color: statusStyle.color,
                                fontSize: "11px",
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getStatusLabel(application.status)}
                            </span>

                            {/* Action Buttons for Employer */}
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                              {application.status !== "REVIEWING" && application.status !== "HIRED" && application.status !== "WITHDRAWN" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateApplicationStatus(application.id, "REVIEWING")}
                                  disabled={actionInProgressId === application.id}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "8px",
                                    border: "1px solid #bfdbfe",
                                    background: "#eff6ff",
                                    color: "#1e40af",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                  title="Mark as Reviewing"
                                >
                                  Review
                                </button>
                              )}

                              {application.status !== "SHORTLISTED" && application.status !== "HIRED" && application.status !== "WITHDRAWN" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateApplicationStatus(application.id, "SHORTLISTED")}
                                  disabled={actionInProgressId === application.id}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "8px",
                                    border: "1px solid #fde68a",
                                    background: "#fef3c7",
                                    color: "#92400e",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                  title="Shortlist applicant"
                                >
                                  Shortlist
                                </button>
                              )}

                              {application.status !== "HIRED" && application.status !== "WITHDRAWN" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateApplicationStatus(application.id, "HIRED")}
                                  disabled={actionInProgressId === application.id}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "8px",
                                    border: "1px solid #bbf7d0",
                                    background: "#f0fdf4",
                                    color: "#166534",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                  title="Hire applicant"
                                >
                                  Hire
                                </button>
                              )}

                              {application.status !== "REJECTED" && application.status !== "HIRED" && application.status !== "WITHDRAWN" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateApplicationStatus(application.id, "REJECTED")}
                                  disabled={actionInProgressId === application.id}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "8px",
                                    border: "1px solid #fecaca",
                                    background: "#fef2f2",
                                    color: "#991b1b",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                  title="Reject application"
                                >
                                  Reject
                                </button>
                              )}

                              {application.status === "WITHDRAWN" && (
                                <span style={{ color: "#94a3b8", fontSize: "11px", fontStyle: "italic" }}>
                                  Withdrawn by applicant
                                </span>
                              )}

                              {application.status === "HIRED" && (
                                <span style={{ color: "#16a34a", fontSize: "11px", fontWeight: 700 }}>
                                  ✓ Hired
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        ) : user.role === "ADMIN" ? (
          /*
           * =========================
           * ADMIN DASHBOARD
           * =========================
           */
          <>
            {dashboardError && (
              <div
                style={{
                  marginBottom: "28px",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  lineHeight: 1.6,
                }}
              >
                <strong>Unable to load admin dashboard.</strong>

                <p style={{ margin: "5px 0 0" }}>
                  {dashboardError}
                </p>
              </div>
            )}

            {/* Overview statistics */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              {[
                {
                  label: "Total Users",
                  value: adminDashboard?.users.total,
                  detail: "Registered platform users",
                },
                {
                  label: "Total Jobs",
                  value: adminDashboard?.jobs.total,
                  detail: "All job postings",
                },
                {
                  label: "Total Applications",
                  value: adminDashboard?.applications.total,
                  detail: "Applications submitted",
                },
                {
                  label: "Pending Approvals",
                  value:
                    adminDashboard?.pendingEmployerApprovals,
                  detail: "Employers awaiting approval",
                },
              ].map((stat) => (
                <article
                  key={stat.label}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "22px",
                    boxShadow:
                      "0 8px 30px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {stat.label}
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "8px",
                      fontSize: "30px",
                    }}
                  >
                    {isDashboardLoading
                      ? "—"
                      : stat.value ?? 0}
                  </strong>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {stat.detail}
                  </span>
                </article>
              ))}
            </section>

            {/* Users by role */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                marginBottom: "28px",
              }}
            >
              {[
                {
                  label: "Graduates",
                  value: adminDashboard?.users.byRole.graduates,
                },
                {
                  label: "Artisans",
                  value: adminDashboard?.users.byRole.artisans,
                },
                {
                  label: "Employers",
                  value: adminDashboard?.users.byRole.employers,
                },
                {
                  label: "Admins",
                  value: adminDashboard?.users.byRole.admins,
                },
              ].map((stat) => (
                <article
                  key={stat.label}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "18px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {stat.label}
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "7px",
                      fontSize: "25px",
                    }}
                  >
                    {isDashboardLoading ? "—" : stat.value ?? 0}
                  </strong>
                </article>
              ))}
            </section>

            {/* Jobs and applications status */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "24px",
                marginBottom: "28px",
              }}
            >
              <article
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow:
                    "0 8px 30px rgba(15, 23, 42, 0.05)",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                  }}
                >
                  Job Overview
                </h2>

                <p
                  style={{
                    margin: "6px 0 20px",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Current platform job posting status.
                </p>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  {[
                    {
                      label: "Open",
                      value: adminDashboard?.jobs.open,
                      background: "#dcfce7",
                      color: "#166534",
                    },
                    {
                      label: "Draft",
                      value: adminDashboard?.jobs.draft,
                      background: "#fef3c7",
                      color: "#92400e",
                    },
                    {
                      label: "Closed",
                      value: adminDashboard?.jobs.closed,
                      background: "#f1f5f9",
                      color: "#475569",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          padding: "6px 9px",
                          borderRadius: "999px",
                          background: stat.background,
                          color: stat.color,
                          fontSize: "11px",
                          fontWeight: 800,
                        }}
                      >
                        {stat.label}
                      </span>

                      <strong style={{ fontSize: "20px" }}>
                        {isDashboardLoading
                          ? "—"
                          : stat.value ?? 0}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>

              <article
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow:
                    "0 8px 30px rgba(15, 23, 42, 0.05)",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                  }}
                >
                  Application Overview
                </h2>

                <p
                  style={{
                    margin: "6px 0 20px",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Current application pipeline across SkillLoom.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "12px",
                  }}
                >
                  {[
                    ["Pending", adminDashboard?.applications.pending],
                    [
                      "Reviewing",
                      adminDashboard?.applications.reviewing,
                    ],
                    [
                      "Shortlisted",
                      adminDashboard?.applications.shortlisted,
                    ],
                    ["Hired", adminDashboard?.applications.hired],
                    ["Rejected", adminDashboard?.applications.rejected],
                    [
                      "Withdrawn",
                      adminDashboard?.applications.withdrawn,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      style={{
                        padding: "14px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        {label}
                      </span>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "5px",
                          fontSize: "21px",
                        }}
                      >
                        {isDashboardLoading
                          ? "—"
                          : Number(value ?? 0)}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            {/* Recent users */}
            <section
              style={{
                marginBottom: "24px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "20px",
                padding: "24px",
                boxShadow:
                  "0 8px 30px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "22px",
                    }}
                  >
                    Recent Users
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    The latest users registered on SkillLoom.
                  </p>
                </div>

                <span
                  style={{
                    padding: "7px 10px",
                    borderRadius: "999px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {adminDashboard?.recentUsers.length ?? 0} recent
                </span>
              </div>

              {isDashboardLoading ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading recent users...
                </div>
              ) : adminDashboard?.recentUsers.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  No users found.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: "720px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1.3fr 1.4fr 0.8fr 0.8fr",
                        gap: "16px",
                        padding: "10px 14px",
                        color: "#94a3b8",
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      <span>User</span>
                      <span>Email</span>
                      <span>Role</span>
                      <span>Joined</span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "8px",
                      }}
                    >
                      {adminDashboard?.recentUsers.map((recentUser) => {
                        const roleStyle = getAdminRoleStyles(
                          recentUser.role,
                        );

                        return (
                          <div
                            key={recentUser.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "1.3fr 1.4fr 0.8fr 0.8fr",
                              gap: "16px",
                              alignItems: "center",
                              padding: "15px 14px",
                              border: "1px solid #e2e8f0",
                              borderRadius: "14px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "11px",
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "50%",
                                  display: "grid",
                                  placeItems: "center",
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {recentUser.fullName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <strong
                                  style={{
                                    display: "block",
                                    fontSize: "14px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {recentUser.fullName}
                                </strong>

                                <span
                                  style={{
                                    display: "block",
                                    marginTop: "3px",
                                    color: "#64748b",
                                    fontSize: "12px",
                                  }}
                                >
                                  {recentUser.status}
                                </span>
                              </div>
                            </div>

                            <span
                              style={{
                                color: "#475569",
                                fontSize: "13px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {recentUser.email}
                            </span>

                            <span
                              style={{
                                width: "fit-content",
                                padding: "6px 9px",
                                borderRadius: "999px",
                                background: roleStyle.background,
                                color: roleStyle.color,
                                fontSize: "11px",
                                fontWeight: 800,
                              }}
                            >
                              {getAdminRoleLabel(recentUser.role)}
                            </span>

                            <span
                              style={{
                                color: "#64748b",
                                fontSize: "13px",
                              }}
                            >
                              {formatDate(recentUser.createdAt)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Recent jobs */}
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "20px",
                padding: "24px",
                boxShadow:
                  "0 8px 30px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "22px",
                    }}
                  >
                    Recent Jobs
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    The latest job postings across the platform.
                  </p>
                </div>

                <span
                  style={{
                    padding: "7px 10px",
                    borderRadius: "999px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {adminDashboard?.recentJobs.length ?? 0} recent
                </span>
              </div>

              {isDashboardLoading ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading recent jobs...
                </div>
              ) : adminDashboard?.recentJobs.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  No jobs found.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  {adminDashboard?.recentJobs.map((job) => {
                    const statusStyle = getJobStatusStyles(
                      job.status,
                    );

                    return (
                      <div
                        key={job.id}
                        style={{
                          padding: "18px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                display: "block",
                                fontSize: "16px",
                              }}
                            >
                              {job.title}
                            </strong>

                            <span
                              style={{
                                display: "block",
                                marginTop: "5px",
                                color: "#64748b",
                                fontSize: "13px",
                              }}
                            >
                              {job.employer?.companyName ??
                                "SkillLoom Employer"}
                            </span>
                          </div>

                          <span
                            style={{
                              padding: "7px 11px",
                              borderRadius: "999px",
                              background: statusStyle.background,
                              color: statusStyle.color,
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            {job.status}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(160px, 1fr))",
                            gap: "12px",
                            marginTop: "16px",
                            paddingTop: "14px",
                            borderTop: "1px solid #f1f5f9",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: "block",
                                color: "#94a3b8",
                                fontSize: "11px",
                                marginBottom: "4px",
                              }}
                            >
                              Job type
                            </span>

                            <strong style={{ fontSize: "13px" }}>
                              {job.jobType}
                            </strong>
                          </div>

                          <div>
                            <span
                              style={{
                                display: "block",
                                color: "#94a3b8",
                                fontSize: "11px",
                                marginBottom: "4px",
                              }}
                            >
                              Location
                            </span>

                            <strong style={{ fontSize: "13px" }}>
                              {job.location ??
                                "Location not specified"}
                            </strong>
                          </div>

                          <div>
                            <span
                              style={{
                                display: "block",
                                color: "#94a3b8",
                                fontSize: "11px",
                                marginBottom: "4px",
                              }}
                            >
                              Posted
                            </span>

                            <strong style={{ fontSize: "13px" }}>
                              {formatDate(job.createdAt)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            <article
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "24px",
                boxShadow:
                  "0 8px 30px rgba(15, 23, 42, 0.05)",
              }}
            >
              <span
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Welcome
              </span>

              <h2
                style={{
                  margin: "8px 0 0",
                  fontSize: "22px",
                }}
              >
                {user.fullName}
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#64748b",
                }}
              >
                {user.email}
              </p>
            </article>

            <article
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "24px",
                boxShadow:
                  "0 8px 30px rgba(15, 23, 42, 0.05)",
              }}
            >
              <span
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Account status
              </span>

              <h2
                style={{
                  margin: "8px 0 0",
                  fontSize: "22px",
                }}
              >
                {user.status}
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: user.isEmailVerified
                    ? "#16a34a"
                    : "#dc2626",
                }}
              >
                {user.isEmailVerified
                  ? "Email verified"
                  : "Email not verified"}
              </p>
            </article>

            <article
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "24px",
                boxShadow:
                  "0 8px 30px rgba(15, 23, 42, 0.05)",
              }}
            >
              <span
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Profile
              </span>

              <h2
                style={{
                  margin: "8px 0 0",
                  fontSize: "22px",
                }}
              >
                {profile ? "Loaded" : "Unavailable"}
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#64748b",
                }}
              >
                Your role-specific profile is connected.
              </p>
            </article>

            <div
              style={{
                gridColumn: "1 / -1",
                marginTop: "4px",
                padding: "20px",
                borderRadius: "14px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1e40af",
              }}
            >
              <strong>{information.title}</strong>

              <p
                style={{
                  margin: "6px 0 0",
                  lineHeight: 1.6,
                }}
              >
                The live {user.role.toLowerCase()} dashboard will be
                implemented in its roadmap step.
              </p>
            </div>
          </section>
        )}
      </main>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "grid",
            placeItems: "center",
            zIndex: 110,
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "440px",
              padding: "32px",
              boxShadow: "0 25px 60px rgba(15, 23, 42, 0.2)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "grid",
                placeItems: "center",
                fontSize: "26px",
              }}
            >
              👋
            </div>
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "22px",
                color: "#0f172a",
                fontWeight: 800,
              }}
            >
              Are you sure you want to log out?
            </h3>
            <p
              style={{
                margin: "0 0 24px",
                color: "#64748b",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              You will need to sign back in with your credentials to access your dashboard and applications.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                No, Stay Logged In
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: "12px 26px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logging Out Spinner / Progress UI */}
      {isLoggingOut && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            display: "grid",
            placeItems: "center",
            zIndex: 120,
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "32px 48px",
              textAlign: "center",
              boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid #e2e8f0",
                borderTop: "4px solid #2563eb",
                borderRadius: "50%",
                margin: "0 auto 18px",
                animation: "spin 1s linear infinite",
              }}
            />
            <h4 style={{ margin: "0 0 6px", fontSize: "18px", color: "#0f172a" }}>
              Logging out...
            </h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
              Safely ending your session...
            </p>
          </div>
        </div>
      )}

      {/* Logged Out Successfully Message */}
      {logoutMessage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            display: "grid",
            placeItems: "center",
            zIndex: 130,
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "32px 48px",
              textAlign: "center",
              boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "#f0fdf4",
                color: "#16a34a",
                display: "grid",
                placeItems: "center",
                fontSize: "26px",
                fontWeight: 800,
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: "20px", color: "#166534" }}>
              {logoutMessage}
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              Redirecting you to the home page...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;