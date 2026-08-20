import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, describe, it } from "node:test";

import app from "./app";
import prisma from "./config/database";
import { generateToken } from "./utils/jwt";

let server: Server;
let baseUrl: string;

let employerUserId: string;
let secondEmployerUserId: string;
let graduateUserId: string;
let artisanUserId: string;

let employerProfileId: string;
let secondEmployerProfileId: string;

let jobId: string;
let secondJobId: string;

let graduateApplicationId: string;
let artisanApplicationId: string;

function authHeader(
  userId: string,
  role: "EMPLOYER" | "GRADUATE" | "ARTISAN"
) {
  const token = generateToken({
    userId,
    role,
  });

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function createTestUser(
  fullName: string,
  email: string,
  role: "EMPLOYER" | "GRADUATE" | "ARTISAN"
) {
  return prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: "integration-test-password-hash",
      role,
    },
  });
}

before(async () => {
  /*
   * Create a temporary HTTP server instead of using
   * the production port 5550.
   */
  server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(
          new Error("Unable to determine test server address.")
        );
        return;
      }

      baseUrl = `http://127.0.0.1:${address.port}`;

      resolve();
    });
  });

  /*
   * Unique emails make the test safe to rerun.
   */
  const suffix = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  /*
   * Employer 1
   */
  const employer = await createTestUser(
    "Integration Test Employer",
    `integration-employer-${suffix}@skillloom.test`,
    "EMPLOYER"
  );

  employerUserId = employer.id;

  const employerProfile =
    await prisma.employerProfile.create({
      data: {
        userId: employerUserId,
        companyName: "Integration Test Company",
      },
    });

  employerProfileId = employerProfile.id;

  /*
   * Employer 2
   */
  const secondEmployer = await createTestUser(
    "Second Integration Employer",
    `integration-employer-two-${suffix}@skillloom.test`,
    "EMPLOYER"
  );

  secondEmployerUserId = secondEmployer.id;

  const secondEmployerProfile =
    await prisma.employerProfile.create({
      data: {
        userId: secondEmployerUserId,
        companyName: "Second Integration Company",
      },
    });

  secondEmployerProfileId = secondEmployerProfile.id;

  /*
   * Graduate
   */
  const graduate = await createTestUser(
    "Integration Test Graduate",
    `integration-graduate-${suffix}@skillloom.test`,
    "GRADUATE"
  );

  graduateUserId = graduate.id;

  await prisma.graduateProfile.create({
    data: {
      userId: graduateUserId,
    },
  });

  /*
   * Artisan
   */
  const artisan = await createTestUser(
    "Integration Test Artisan",
    `integration-artisan-${suffix}@skillloom.test`,
    "ARTISAN"
  );

  artisanUserId = artisan.id;

  await prisma.artisanProfile.create({
    data: {
      userId: artisanUserId,
      trade: "Web Development",
    },
  });

  /*
   * Job belonging to employer 1.
   */
  const job = await prisma.job.create({
    data: {
      employerId: employerProfileId,
      postedById: employerUserId,
      title: "Integration Test Developer",
      description:
        "Temporary job used for automated integration testing.",
      requirements:
        "JavaScript, TypeScript, Node.js and database knowledge.",
      location: "Makurdi, Benue State",
      salaryMin: 150000,
      salaryMax: 250000,
      currency: "NGN",
      jobType: "FULL_TIME",
      status: "OPEN",
      applicationDeadline: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
    },
  });

  jobId = job.id;

  /*
   * Second job belonging to employer 2.
   *
   * Used to verify employer authorization.
   */
  const secondJob = await prisma.job.create({
    data: {
      employerId: secondEmployerProfileId,
      postedById: secondEmployerUserId,
      title: "Second Integration Test Job",
      description:
        "Temporary second job used for authorization testing.",
      requirements: "Testing",
      location: "Makurdi, Benue State",
      salaryMin: 100000,
      salaryMax: 200000,
      currency: "NGN",
      jobType: "FULL_TIME",
      status: "OPEN",
      applicationDeadline: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
    },
  });

  secondJobId = secondJob.id;
});

after(async () => {
  /*
   * Delete temporary data.
   *
   * Because the Prisma relations use onDelete: Cascade,
   * deleting the users also removes their profiles and
   * related applications/jobs where applicable.
   */
  if (jobId) {
    await prisma.jobApplication.deleteMany({
      where: {
        jobId,
      },
    });

    await prisma.job.deleteMany({
      where: {
        id: jobId,
      },
    });
  }

  if (secondJobId) {
    await prisma.jobApplication.deleteMany({
      where: {
        jobId: secondJobId,
      },
    });

    await prisma.job.deleteMany({
      where: {
        id: secondJobId,
      },
    });
  }

  const userIds = [
    employerUserId,
    secondEmployerUserId,
    graduateUserId,
    artisanUserId,
  ].filter(Boolean);

  if (userIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await prisma.$disconnect();
});

describe("SkillLoom API", () => {
  it("GET / should return the API welcome response", async () => {
    const response = await fetch(`${baseUrl}/`);

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(
      body.message,
      "Welcome to the SkillLoom API."
    );
    assert.equal(
      body.tagline,
      "Weaving skills into opportunity."
    );
  });

  it("GET /unknown-route should return a 404 response", async () => {
    const response = await fetch(
      `${baseUrl}/unknown-route`
    );

    assert.equal(response.status, 404);
  });
});

describe("Application workflow", () => {
  it("should allow a graduate to submit an application", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            graduateUserId,
            "GRADUATE"
          ),
        },
        body: JSON.stringify({
          jobId,
          coverLetter:
            "I am excited to apply for this integration test position.",
        }),
      }
    );

    assert.equal(response.status, 201);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(
      body.message,
      "Application submitted successfully."
    );

    assert.ok(body.data.application);

    graduateApplicationId =
      body.data.application.id;

    assert.equal(
      body.data.application.jobId,
      jobId
    );

    assert.equal(
      body.data.application.applicantId,
      graduateUserId
    );

    assert.equal(
      body.data.application.status,
      "PENDING"
    );

    assert.equal(
      body.data.application.graduate.userId,
      graduateUserId
    );

    assert.equal(
      body.data.application.artisan,
      null
    );
  });

  it("should reject a duplicate graduate application", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            graduateUserId,
            "GRADUATE"
          ),
        },
        body: JSON.stringify({
          jobId,
          coverLetter:
            "This should be rejected as a duplicate application.",
        }),
      }
    );

    assert.equal(response.status, 409);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(
      body.message,
      "You have already applied for this job."
    );

    assert.equal(
      body.data.application.id,
      graduateApplicationId
    );
  });

  it("should allow an artisan to apply for the same job", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            artisanUserId,
            "ARTISAN"
          ),
        },
        body: JSON.stringify({
          jobId,
          coverLetter:
            "I am applying as a web development artisan.",
        }),
      }
    );

    assert.equal(response.status, 201);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(
      body.message,
      "Application submitted successfully."
    );

    assert.ok(body.data.application);

    artisanApplicationId =
      body.data.application.id;

    assert.equal(
      body.data.application.jobId,
      jobId
    );

    assert.equal(
      body.data.application.applicantId,
      artisanUserId
    );

    assert.equal(
      body.data.application.status,
      "PENDING"
    );

    assert.equal(
      body.data.application.graduate,
      null
    );

    assert.equal(
      body.data.application.artisan.userId,
      artisanUserId
    );

    assert.equal(
      body.data.application.artisan.trade,
      "Web Development"
    );
  });

  it("should return only the graduate's applications", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/my-applications`,
      {
        headers: authHeader(
          graduateUserId,
          "GRADUATE"
        ),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(body.data.total, 1);

    assert.equal(
      body.data.applications[0].id,
      graduateApplicationId
    );

    assert.equal(
      body.data.applications[0].applicantId,
      graduateUserId
    );
  });

  it("should return only the artisan's applications", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/my-applications`,
      {
        headers: authHeader(
          artisanUserId,
          "ARTISAN"
        ),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(body.data.total, 1);

    assert.equal(
      body.data.applications[0].id,
      artisanApplicationId
    );

    assert.equal(
      body.data.applications[0].applicantId,
      artisanUserId
    );
  });

  it("should allow the employer to view all applications for its job", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/job/${jobId}`,
      {
        headers: authHeader(
          employerUserId,
          "EMPLOYER"
        ),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(body.data.job.id, jobId);
    assert.equal(body.data.applications.length, 2);
    assert.equal(body.data.total, 2);

    const applicationIds =
      body.data.applications.map(
        (application: { id: string }) =>
          application.id
      );

    assert.ok(
      applicationIds.includes(
        graduateApplicationId
      )
    );

    assert.ok(
      applicationIds.includes(
        artisanApplicationId
      )
    );
  });

  it("should prevent an employer from viewing another employer's applications", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/job/${secondJobId}`,
      {
        headers: authHeader(
          employerUserId,
          "EMPLOYER"
        ),
      }
    );

    assert.equal(response.status, 403);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(
      body.message,
      "You are not authorized to view applications for this job."
    );
  });

  it("should allow the employer to view one application", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${graduateApplicationId}`,
      {
        headers: authHeader(
          employerUserId,
          "EMPLOYER"
        ),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);

    assert.equal(
      body.data.application.id,
      graduateApplicationId
    );

    assert.equal(
      body.data.application.applicant.id,
      graduateUserId
    );

    assert.equal(
      body.data.application.job.id,
      jobId
    );
  });

  it("should prevent the second employer from viewing the first employer's application", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${graduateApplicationId}`,
      {
        headers: authHeader(
          secondEmployerUserId,
          "EMPLOYER"
        ),
      }
    );

    assert.equal(response.status, 403);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(
      body.message,
      "You are not authorized to view this application."
    );
  });

  it("should allow the employer to change an application to REVIEWING", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${graduateApplicationId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            employerUserId,
            "EMPLOYER"
          ),
        },
        body: JSON.stringify({
          status: "REVIEWING",
        }),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(
      body.message,
      "Application status updated successfully."
    );

    assert.equal(
      body.data.application.status,
      "REVIEWING"
    );
  });

  it("should allow the employer to shortlist an application", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${graduateApplicationId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            employerUserId,
            "EMPLOYER"
          ),
        },
        body: JSON.stringify({
          status: "SHORTLISTED",
        }),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(
      body.data.application.status,
      "SHORTLISTED"
    );
  });

  it("should reject an invalid application status", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${graduateApplicationId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            employerUserId,
            "EMPLOYER"
          ),
        },
        body: JSON.stringify({
          status: "INVALID_STATUS",
        }),
      }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.success, false);

    assert.match(
      body.message,
      /Invalid application status/
    );
  });

  it("should prevent a non-employer from changing application status", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${graduateApplicationId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            graduateUserId,
            "GRADUATE"
          ),
        },
        body: JSON.stringify({
          status: "HIRED",
        }),
      }
    );

    assert.equal(response.status, 403);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(
      body.message,
      "Only employers can update application status."
    );
  });

  it("should allow an applicant to withdraw a non-hired application", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${artisanApplicationId}/withdraw`,
      {
        method: "PATCH",
        headers: authHeader(
          artisanUserId,
          "ARTISAN"
        ),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(
      body.message,
      "Application withdrawn successfully."
    );

    assert.equal(
      body.data.application.status,
      "WITHDRAWN"
    );
  });

  it("should reject withdrawing an already withdrawn application", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${artisanApplicationId}/withdraw`,
      {
        method: "PATCH",
        headers: authHeader(
          artisanUserId,
          "ARTISAN"
        ),
      }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(
      body.message,
      "This application has already been withdrawn."
    );
  });

  it("should allow the employer to hire the graduate", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${graduateApplicationId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            employerUserId,
            "EMPLOYER"
          ),
        },
        body: JSON.stringify({
          status: "HIRED",
        }),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(
      body.data.application.status,
      "HIRED"
    );
  });

  it("should prevent a hired applicant from withdrawing", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${graduateApplicationId}/withdraw`,
      {
        method: "PATCH",
        headers: authHeader(
          graduateUserId,
          "GRADUATE"
        ),
      }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(
      body.message,
      "A hired application cannot be withdrawn."
    );
  });

  it("should prevent an applicant from withdrawing another user's application", async () => {
    const response = await fetch(
      `${baseUrl}/api/applications/${graduateApplicationId}/withdraw`,
      {
        method: "PATCH",
        headers: authHeader(
          artisanUserId,
          "ARTISAN"
        ),
      }
    );

    assert.equal(response.status, 403);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(
      body.message,
      "You are not authorized to withdraw this application."
    );
  });
});

describe("Profile workflow", () => {
  it("should allow an authenticated artisan to view their profile", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        headers: authHeader(
          artisanUserId,
          "ARTISAN"
        ),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.ok(body.data.profile);

    assert.equal(
      body.data.profile.id,
      artisanUserId
    );

    assert.equal(
      body.data.profile.fullName,
      "Integration Test Artisan"
    );

    assert.equal(
      body.data.profile.email.endsWith(
        "@skillloom.test"
      ),
      true
    );

    assert.equal(
      body.data.profile.role,
      "ARTISAN"
    );

    assert.equal(
      body.data.profile.artisanProfile.trade,
      "Web Development"
    );

    assert.equal(
      body.data.profile.graduateProfile,
      null
    );

    assert.equal(
      body.data.profile.employerProfile,
      null
    );
  });

  it("should allow an authenticated graduate to view their profile", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        headers: authHeader(
          graduateUserId,
          "GRADUATE"
        ),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.ok(body.data.profile);

    assert.equal(
      body.data.profile.id,
      graduateUserId
    );

    assert.equal(
      body.data.profile.role,
      "GRADUATE"
    );

    assert.ok(
      body.data.profile.graduateProfile
    );

    assert.equal(
      body.data.profile.artisanProfile,
      null
    );

    assert.equal(
      body.data.profile.employerProfile,
      null
    );
  });

  it("should allow an authenticated employer to view their profile", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        headers: authHeader(
          employerUserId,
          "EMPLOYER"
        ),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.ok(body.data.profile);

    assert.equal(
      body.data.profile.id,
      employerUserId
    );

    assert.equal(
      body.data.profile.role,
      "EMPLOYER"
    );

    assert.equal(
      body.data.profile.employerProfile.companyName,
      "Integration Test Company"
    );

    assert.equal(
      body.data.profile.graduateProfile,
      null
    );

    assert.equal(
      body.data.profile.artisanProfile,
      null
    );
  });

  it("should reject an unauthenticated profile request", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`
    );

    assert.equal(response.status, 401);

    const body = await response.json();

    assert.equal(body.success, false);

    assert.equal(
      body.message,
      "Authentication required."
    );
  });

  it("should allow an artisan to update their profile", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            artisanUserId,
            "ARTISAN"
          ),
        },
        body: JSON.stringify({
          fullName:
            "Integration Test Artisan Updated",
          trade: "Web Development",
          bio:
            "Web development artisan specializing in modern JavaScript and TypeScript applications.",
          phone: "08012345678",
          location:
            "Makurdi, Benue State",
          yearsExperience: 3,
          hourlyRate: 5000,
          contractRate: 50000,
          currency: "NGN",
          isAvailable: true,
        }),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);

    assert.equal(
      body.message,
      "Profile updated successfully."
    );

    assert.ok(body.data.profile);

    assert.equal(
      body.data.profile.fullName,
      "Integration Test Artisan Updated"
    );

    assert.equal(
      body.data.profile.artisanProfile.trade,
      "Web Development"
    );

    assert.equal(
      body.data.profile.artisanProfile.bio,
      "Web development artisan specializing in modern JavaScript and TypeScript applications."
    );

    assert.equal(
      body.data.profile.artisanProfile.phone,
      "08012345678"
    );

    assert.equal(
      body.data.profile.artisanProfile.location,
      "Makurdi, Benue State"
    );

    assert.equal(
      Number(
        body.data.profile.artisanProfile.yearsExperience
      ),
      3
    );

    assert.equal(
      Number(
        body.data.profile.artisanProfile.hourlyRate
      ),
      5000
    );

    assert.equal(
      Number(
        body.data.profile.artisanProfile.contractRate
      ),
      50000
    );

    assert.equal(
      body.data.profile.artisanProfile.currency,
      "NGN"
    );

    assert.equal(
      body.data.profile.artisanProfile.isAvailable,
      true
    );
  });

  it("should persist the artisan profile update", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        headers: authHeader(
          artisanUserId,
          "ARTISAN"
        ),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);

    assert.equal(
      body.data.profile.fullName,
      "Integration Test Artisan Updated"
    );

    assert.equal(
      body.data.profile.artisanProfile.bio,
      "Web development artisan specializing in modern JavaScript and TypeScript applications."
    );

    assert.equal(
      body.data.profile.artisanProfile.phone,
      "08012345678"
    );

    assert.equal(
      body.data.profile.artisanProfile.location,
      "Makurdi, Benue State"
    );

    assert.equal(
      Number(
        body.data.profile.artisanProfile.yearsExperience
      ),
      3
    );

    assert.equal(
      Number(
        body.data.profile.artisanProfile.hourlyRate
      ),
      5000
    );

    assert.equal(
      Number(
        body.data.profile.artisanProfile.contractRate
      ),
      50000
    );
  });

  it("should reject an invalid artisan yearsExperience value", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            artisanUserId,
            "ARTISAN"
          ),
        },
        body: JSON.stringify({
          yearsExperience: -1,
        }),
      }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.success, false);

    assert.equal(
      body.message,
      "Years of experience must be a non-negative whole number."
    );
  });

  it("should reject an invalid hourly rate", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            artisanUserId,
            "ARTISAN"
          ),
        },
        body: JSON.stringify({
          hourlyRate: "not-a-number",
        }),
      }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.success, false);

    assert.equal(
      body.message,
      "Hourly rate must be a valid number."
    );
  });

  it("should reject an invalid CV URL", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            graduateUserId,
            "GRADUATE"
          ),
        },
        body: JSON.stringify({
          cvUrl: "not-a-valid-url",
        }),
      }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.success, false);

    assert.equal(
      body.message,
      "CV URL must be a valid URL."
    );
  });

  it("should reject an invalid employer website", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            employerUserId,
            "EMPLOYER"
          ),
        },
        body: JSON.stringify({
          website: "invalid-website",
        }),
      }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.success, false);

    assert.equal(
      body.message,
      "Website must be a valid URL."
    );
  });

  it("should reject an invalid availability value", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            artisanUserId,
            "ARTISAN"
          ),
        },
        body: JSON.stringify({
          isAvailable: "yes",
        }),
      }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.success, false);

    assert.equal(
      body.message,
      "isAvailable must be a boolean."
    );
  });

  it("should reject an unauthenticated profile update", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Unauthorized Update",
        }),
      }
    );

    assert.equal(response.status, 401);

    const body = await response.json();

    assert.equal(body.success, false);

    assert.equal(
      body.message,
      "Authentication required."
    );
  });

  it("should update a graduate profile", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            graduateUserId,
            "GRADUATE"
          ),
        },
        body: JSON.stringify({
          fullName:
            "Integration Test Graduate Updated",
          headline:
            "Junior Software Developer",
          bio:
            "Graduate developer with experience in JavaScript and TypeScript.",
          phone: "08098765432",
          location:
            "Makurdi, Benue State",
          education:
            "Computer Science",
          cvUrl:
            "https://example.com/cv.pdf",
          isAvailable: true,
        }),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);

    assert.equal(
      body.data.profile.fullName,
      "Integration Test Graduate Updated"
    );

    assert.equal(
      body.data.profile.graduateProfile.headline,
      "Junior Software Developer"
    );

    assert.equal(
      body.data.profile.graduateProfile.bio,
      "Graduate developer with experience in JavaScript and TypeScript."
    );

    assert.equal(
      body.data.profile.graduateProfile.phone,
      "08098765432"
    );

    assert.equal(
      body.data.profile.graduateProfile.location,
      "Makurdi, Benue State"
    );

    assert.equal(
      body.data.profile.graduateProfile.education,
      "Computer Science"
    );

    assert.equal(
      body.data.profile.graduateProfile.cvUrl,
      "https://example.com/cv.pdf"
    );

    assert.equal(
      body.data.profile.graduateProfile.isAvailable,
      true
    );
  });

  it("should update an employer profile", async () => {
    const response = await fetch(
      `${baseUrl}/api/profiles/me`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(
            employerUserId,
            "EMPLOYER"
          ),
        },
        body: JSON.stringify({
          fullName:
            "Integration Test Employer Updated",
          companyName:
            "Integration Test Company Updated",
          logoUrl:
            "https://example.com/logo.png",
          description:
            "A technology company used for integration testing.",
          industry:
            "Information Technology",
          website:
            "https://example.com",
        }),
      }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);

    assert.equal(
      body.data.profile.fullName,
      "Integration Test Employer Updated"
    );

    assert.equal(
      body.data.profile.employerProfile.companyName,
      "Integration Test Company Updated"
    );

    assert.equal(
      body.data.profile.employerProfile.logoUrl,
      "https://example.com/logo.png"
    );

    assert.equal(
      body.data.profile.employerProfile.description,
      "A technology company used for integration testing."
    );

    assert.equal(
      body.data.profile.employerProfile.industry,
      "Information Technology"
    );

    assert.equal(
      body.data.profile.employerProfile.website,
      "https://example.com"
    );
  });
});