export type UserRole =
  | "EMPLOYER"
  | "GRADUATE"
  | "ARTISAN"
  | "ADMIN";

export type UserStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "SUSPENDED";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

/**
 * The backend /profiles/me endpoint returns the
 * authenticated user's profile directly.
 *
 * It does NOT return:
 *
 * {
 *   user: {...}
 * }
 *
 * Instead it returns:
 *
 * {
 *   profile: {
 *     id,
 *     fullName,
 *     email,
 *     role,
 *     ...
 *   }
 * }
 *
 * Therefore Profile extends User directly.
 */
export interface Profile extends User {
  graduateProfile?: GraduateProfile | null;
  artisanProfile?: ArtisanProfile | null;
  employerProfile?: EmployerProfile | null;
}

export interface GraduateProfile {
  id: string;
  userId?: string;

  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  skills?: string | null;
  education?: string | null;
  experience?: string | null;
  cvUrl?: string | null;
  isAvailable?: boolean;
}

export interface ArtisanProfile {
  id: string;
  userId?: string;

  trade?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  yearsExperience?: number | null;
  hourlyRate?: number | null;
  contractRate?: number | null;
  currency?: string | null;
  isAvailable?: boolean;
}

export interface EmployerProfile {
  id: string;
  userId?: string;

  companyName: string;
  logoUrl?: string | null;
  description?: string | null;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  location?: string | null;
  approvalStatus?: string | null;
  approvedAt?: string | null;
}

/**
 * Jobs
 */
export type JobStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED";

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string | null;
  location?: string | null;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  currency?: string | null;
  jobType: string;
  status: JobStatus;
  applicationDeadline?: string | null;
  createdAt?: string;
  updatedAt?: string;
  postedById?: string;
  employerId?: string;

  employer?: {
    id: string;
    companyName: string;
    logoUrl?: string | null;
    location?: string | null;
    industry?: string | null;
  };
}

/**
 * Applications
 */
export type ApplicationStatus =
  | "PENDING"
  | "REVIEWING"
  | "SHORTLISTED"
  | "REJECTED"
  | "HIRED"
  | "WITHDRAWN";

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;

  graduateId?: string | null;
  artisanId?: string | null;

  coverLetter?: string | null;
  cvUrl?: string | null;

  status: ApplicationStatus;

  appliedAt?: string;
  updatedAt?: string;

  /**
   * Kept for compatibility with any existing
   * frontend code using createdAt.
   */
  createdAt?: string;

  job?: {
    id: string;
    title: string;
    description?: string;
    requirements?: string | null;
    location?: string | null;
    salaryMin?: number | string | null;
    salaryMax?: number | string | null;
    currency?: string | null;
    jobType: string;
    status: JobStatus;
    applicationDeadline?: string | null;
    createdAt?: string;
  };

  applicant?: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  };

  graduate?: {
    id: string;
    userId: string;
  } | null;

  artisan?: {
    id: string;
    userId: string;
  } | null;
}