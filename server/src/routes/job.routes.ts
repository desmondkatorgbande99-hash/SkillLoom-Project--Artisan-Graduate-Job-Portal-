import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  updateJob,
  closeJob,
  applyForJob,
} from "../controllers/job.controller";

const router = Router();

/**
 * Public job browsing
 */
router.get("/", getJobs);

/**
 * Employer's jobs
 *
 * IMPORTANT:
 * This route must come before /:id.
 */
router.get(
  "/employer/my-jobs",
  authenticate,
  getMyJobs
);

/**
 * Apply for a job
 *
 * GRADUATE / ARTISAN only
 *
 * POST /api/jobs/:id/apply
 */
router.post(
  "/:id/apply",
  authenticate,
  applyForJob
);

/**
 * Single job
 */
router.get(
  "/:id",
  getJobById
);

/**
 * Employer job management
 */
router.post(
  "/",
  authenticate,
  createJob
);

router.patch(
  "/:id",
  authenticate,
  updateJob
);

router.patch(
  "/:id/close",
  authenticate,
  closeJob
);

export default router;