import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

import type { Job, JobStatus } from "../types";

type JobsPageProps = {
  onLogout: () => void;
};

interface JobsResponse {
  success: boolean;
  message?: string;
  data?: {
    jobs?: Job[];
  };
}

interface JobResponse {
  success: boolean;
  message?: string;
  data?: {
    job?: Job;
  };
}

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  jobType: string;
  applicationDeadline: string;
  status: JobStatus;
}

const initialForm: JobFormData = {
  title: "",
  description: "",
  requirements: "",
  location: "",
  salaryMin: "",
  salaryMax: "",
  currency: "NGN",
  jobType: "FULL_TIME",
  applicationDeadline: "",
  status: "DRAFT",
};

function formatDate(date?: string | null) {
  if (!date) {
    return "No deadline";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No deadline";
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

function getStatusStyles(status: JobStatus) {
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
  }
}

function JobsPage({ onLogout }: JobsPageProps) {
  const { user, profile } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(
    null,
  );

  const [form, setForm] = useState<JobFormData>(initialForm);

  const isEmployer = user?.role === "EMPLOYER";

  const companyName =
    profile?.employerProfile?.companyName ||
    user?.fullName ||
    "Your Company";

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") {
      return;
    }

    let isMounted = true;

    const loadJobs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiRequest<JobsResponse>(
          "/jobs/employer/my-jobs",
          {
            method: "GET",
            auth: true,
          },
        );

        if (!isMounted) {
          return;
        }

        if (!response.success) {
          throw new Error(
            response.message || "Unable to load your jobs.",
          );
        }

        setJobs(response.data?.jobs ?? []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your jobs.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadJobs();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const openCreateForm = () => {
    setEditingJobId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const openEditForm = (job: Job) => {
    setEditingJobId(job.id);

    setForm({
      title: job.title ?? "",
      description: job.description ?? "",
      requirements: job.requirements ?? "",
      location: job.location ?? "",
      salaryMin:
        job.salaryMin !== null &&
        job.salaryMin !== undefined
          ? String(job.salaryMin)
          : "",
      salaryMax:
        job.salaryMax !== null &&
        job.salaryMax !== undefined
          ? String(job.salaryMax)
          : "",
      currency: job.currency ?? "NGN",
      jobType: job.jobType ?? "FULL_TIME",
      applicationDeadline: job.applicationDeadline
        ? job.applicationDeadline.slice(0, 10)
        : "",
      status: job.status,
    });

    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const handleInputChange = (
    field: keyof JobFormData,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      if (!form.title.trim()) {
        throw new Error("Job title is required.");
      }

      if (!form.description.trim()) {
        throw new Error("Job description is required.");
      }

      if (!form.jobType.trim()) {
        throw new Error("Job type is required.");
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim() || null,
        location: form.location.trim() || null,
        salaryMin:
          form.salaryMin.trim() === ""
            ? null
            : Number(form.salaryMin),
        salaryMax:
          form.salaryMax.trim() === ""
            ? null
            : Number(form.salaryMax),
        currency: form.currency.trim() || "NGN",
        jobType: form.jobType.trim(),
        applicationDeadline:
          form.applicationDeadline || null,
        status: form.status,
      };

      if (
        payload.salaryMin !== null &&
        Number.isNaN(payload.salaryMin)
      ) {
        throw new Error("Minimum salary must be a valid number.");
      }

      if (
        payload.salaryMax !== null &&
        Number.isNaN(payload.salaryMax)
      ) {
        throw new Error("Maximum salary must be a valid number.");
      }

      if (
        payload.salaryMin !== null &&
        payload.salaryMax !== null &&
        payload.salaryMin > payload.salaryMax
      ) {
        throw new Error(
          "Minimum salary cannot be greater than maximum salary.",
        );
      }

      if (editingJobId) {
        const response = await apiRequest<JobResponse>(
          `/jobs/${editingJobId}`,
          {
            method: "PATCH",
            auth: true,
            body: JSON.stringify(payload),
          },
        );

        if (!response.success) {
          throw new Error(
            response.message || "Unable to update the job.",
          );
        }

        const updatedJob = response.data?.job;

        if (updatedJob) {
          setJobs((currentJobs) =>
            currentJobs.map((job) =>
              job.id === updatedJob.id ? updatedJob : job,
            ),
          );
        }

        setSuccess("Job updated successfully.");
      } else {
        const response = await apiRequest<JobResponse>("/jobs", {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload),
        });

        if (!response.success) {
          throw new Error(
            response.message || "Unable to create the job.",
          );
        }

        const createdJob = response.data?.job;

        if (createdJob) {
          setJobs((currentJobs) => [
            createdJob,
            ...currentJobs,
          ]);
        }

        setSuccess("Job created successfully.");
      }

      setForm(initialForm);
      setEditingJobId(null);
      setIsFormOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the job.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseJob = async (job: Job) => {
    const confirmed = window.confirm(
      `Close "${job.title}"? Applicants will no longer be able to apply to this job.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setIsClosing(job.id);

    try {
      const response = await apiRequest<JobResponse>(
        `/jobs/${job.id}/close`,
        {
          method: "PATCH",
          auth: true,
        },
      );

      if (!response.success) {
        throw new Error(
          response.message || "Unable to close the job.",
        );
      }

      const updatedJob = response.data?.job;

      if (updatedJob) {
        setJobs((currentJobs) =>
          currentJobs.map((currentJob) =>
            currentJob.id === updatedJob.id
              ? updatedJob
              : currentJob,
          ),
        );
      } else {
        setJobs((currentJobs) =>
          currentJobs.map((currentJob) =>
            currentJob.id === job.id
              ? {
                  ...currentJob,
                  status: "CLOSED",
                }
              : currentJob,
          ),
        );
      }

      setSuccess("Job closed successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to close the job.",
      );
    } finally {
      setIsClosing(null);
    }
  };

  if (!user || !isEmployer) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          padding: "24px",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "32px",
            maxWidth: "500px",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0 }}>Access denied</h1>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Only employers can manage job postings.
          </p>

          <button
            type="button"
            onClick={onLogout}
            style={{
              border: 0,
              background: "#2563eb",
              color: "#ffffff",
              padding: "11px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Return
          </button>
        </div>
      </div>
    );
  }

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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
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
              }}
            >
              S
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "18px",
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
                Employer Job Management
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
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
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
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
              {companyName}
            </span>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(30px, 5vw, 44px)",
                letterSpacing: "-0.03em",
              }}
            >
              My Jobs
            </h1>

            <p
              style={{
                margin: "12px 0 0",
                color: "#64748b",
                fontSize: "16px",
                lineHeight: 1.6,
              }}
            >
              Create, update and manage your SkillLoom job
              postings.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={{
              border: 0,
              background:
                "linear-gradient(135deg, #2563eb, #0ea5e9)",
              color: "#ffffff",
              padding: "13px 20px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: 800,
              boxShadow:
                "0 8px 20px rgba(37, 99, 235, 0.2)",
            }}
          >
            + Create Job
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "15px 18px",
              borderRadius: "14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              lineHeight: 1.6,
            }}
          >
            <strong>Something went wrong.</strong>

            <p
              style={{
                margin: "4px 0 0",
              }}
            >
              {error}
            </p>
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: "18px",
              padding: "15px 18px",
              borderRadius: "14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              lineHeight: 1.6,
            }}
          >
            {success}
          </div>
        )}

        {isFormOpen && (
          <section
            style={{
              marginBottom: "28px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "26px",
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
                marginBottom: "22px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "23px",
                  }}
                >
                  {editingJobId
                    ? "Edit Job"
                    : "Create New Job"}
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Provide the details candidates will see
                  on your job posting.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingJobId(null);
                  setForm(initialForm);
                }}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#475569",
                  padding: "9px 13px",
                  borderRadius: "9px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "18px",
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Job title
                  </span>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      handleInputChange(
                        "title",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Frontend Developer"
                    required
                    style={inputStyle}
                  />
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Job type
                  </span>

                  <select
                    value={form.jobType}
                    onChange={(event) =>
                      handleInputChange(
                        "jobType",
                        event.target.value,
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="FULL_TIME">
                      Full Time
                    </option>
                    <option value="PART_TIME">
                      Part Time
                    </option>
                    <option value="CONTRACT">
                      Contract
                    </option>
                    <option value="INTERNSHIP">
                      Internship
                    </option>
                    <option value="FREELANCE">
                      Freelance
                    </option>
                  </select>
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Location
                  </span>

                  <input
                    value={form.location}
                    onChange={(event) =>
                      handleInputChange(
                        "location",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Port Harcourt"
                    style={inputStyle}
                  />
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Application deadline
                  </span>

                  <input
                    type="date"
                    value={form.applicationDeadline}
                    onChange={(event) =>
                      handleInputChange(
                        "applicationDeadline",
                        event.target.value,
                      )
                    }
                    style={inputStyle}
                  />
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Minimum salary
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={form.salaryMin}
                    onChange={(event) =>
                      handleInputChange(
                        "salaryMin",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 150000"
                    style={inputStyle}
                  />
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Maximum salary
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={form.salaryMax}
                    onChange={(event) =>
                      handleInputChange(
                        "salaryMax",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 300000"
                    style={inputStyle}
                  />
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Currency
                  </span>

                  <input
                    value={form.currency}
                    onChange={(event) =>
                      handleInputChange(
                        "currency",
                        event.target.value,
                      )
                    }
                    placeholder="NGN"
                    style={inputStyle}
                  />
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Status
                  </span>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      handleInputChange(
                        "status",
                        event.target.value as JobStatus,
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="DRAFT">
                      Draft
                    </option>
                    <option value="OPEN">
                      Open
                    </option>
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "18px",
                  marginTop: "18px",
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Description
                  </span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      handleInputChange(
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Describe the role, responsibilities and opportunity."
                    required
                    rows={7}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: "150px",
                    }}
                  />
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Requirements
                  </span>

                  <textarea
                    value={form.requirements}
                    onChange={(event) =>
                      handleInputChange(
                        "requirements",
                        event.target.value,
                      )
                    }
                    placeholder="List the skills, qualifications and experience required."
                    rows={7}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: "150px",
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "22px",
                }}
              >
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    border: 0,
                    background: isSaving
                      ? "#94a3b8"
                      : "#2563eb",
                    color: "#ffffff",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    cursor: isSaving
                      ? "not-allowed"
                      : "pointer",
                    fontWeight: 800,
                  }}
                >
                  {isSaving
                    ? "Saving..."
                    : editingJobId
                      ? "Update Job"
                      : "Create Job"}
                </button>
              </div>
            </form>
          </section>
        )}

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
                  fontSize: "23px",
                }}
              >
                Your Job Postings
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Manage every job belonging to your employer
                account.
              </p>
            </div>

            <span
              style={{
                padding: "7px 11px",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#1d4ed8",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              {jobs.length} jobs
            </span>
          </div>

          {isLoading ? (
            <div
              style={{
                padding: "50px 20px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Loading your jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div
              style={{
                padding: "45px 20px",
                borderRadius: "16px",
                background: "#f8fafc",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#334155",
                  marginBottom: "7px",
                  fontSize: "17px",
                }}
              >
                No jobs yet
              </strong>

              Create your first job posting to start
              receiving applications.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              {jobs.map((job) => {
                const statusStyle = getStatusStyles(
                  job.status,
                );

                return (
                  <article
                    key={job.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "18px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "19px",
                          }}
                        >
                          {job.title}
                        </h3>

                        <p
                          style={{
                            margin: "7px 0 0",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          {job.jobType} ·{" "}
                          {job.location ||
                            "Location not specified"}
                        </p>
                      </div>

                      <span
                        style={{
                          padding: "7px 11px",
                          borderRadius: "999px",
                          background:
                            statusStyle.background,
                          color: statusStyle.color,
                          fontSize: "11px",
                          fontWeight: 800,
                        }}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: "15px 0 0",
                        color: "#475569",
                        fontSize: "14px",
                        lineHeight: 1.65,
                      }}
                    >
                      {job.description.length > 180
                        ? `${job.description.slice(
                            0,
                            180,
                          )}...`
                        : job.description}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "14px",
                        marginTop: "18px",
                        paddingTop: "16px",
                        borderTop:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <div>
                        <span style={metaLabelStyle}>
                          Salary
                        </span>

                        <strong style={metaValueStyle}>
                          {formatSalary(
                            job.salaryMin,
                            job.salaryMax,
                            job.currency ?? "NGN",
                          )}
                        </strong>
                      </div>

                      <div>
                        <span style={metaLabelStyle}>
                          Deadline
                        </span>

                        <strong style={metaValueStyle}>
                          {formatDate(
                            job.applicationDeadline,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span style={metaLabelStyle}>
                          Created
                        </span>

                        <strong style={metaValueStyle}>
                          {formatDate(job.createdAt)}
                        </strong>
                      </div>

                      <div>
                        <span style={metaLabelStyle}>
                          Applicants
                        </span>

                        <strong style={metaValueStyle}>
                          {(
                            job as Job & {
                              _count?: {
                                applications?: number;
                              };
                            }
                          )._count?.applications ?? 0}
                        </strong>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginTop: "18px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(job)
                        }
                        style={{
                          border:
                            "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#334155",
                          padding: "9px 14px",
                          borderRadius: "9px",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        Edit
                      </button>

                      {job.status === "OPEN" && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleCloseJob(job)
                          }
                          disabled={
                            isClosing === job.id
                          }
                          style={{
                            border:
                              "1px solid #fecaca",
                            background: "#fff1f2",
                            color: "#be123c",
                            padding: "9px 14px",
                            borderRadius: "9px",
                            cursor:
                              isClosing === job.id
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: 700,
                          }}
                        >
                          {isClosing === job.id
                            ? "Closing..."
                            : "Close Job"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  padding: "11px 12px",
  borderRadius: "9px",
  outline: "none",
  fontSize: "14px",
};

const metaLabelStyle = {
  display: "block",
  color: "#94a3b8",
  fontSize: "11px",
  marginBottom: "4px",
};

const metaValueStyle = {
  fontSize: "13px",
};

export default JobsPage;