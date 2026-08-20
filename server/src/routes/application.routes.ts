import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  createApplication,
  getMyApplications,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
} from "../controllers/application.controllers";

const router = Router();

/**
 * Create a job application
 *
 * GRADUATE / ARTISAN only
 *
 * POST /api/applications
 */
router.post(
  "/",
  authenticate,
  createApplication
);

/**
 * Get applications belonging to
 * the authenticated graduate/artisan
 *
 * GET /api/applications/my-applications
 */
router.get(
  "/my-applications",
  authenticate,
  getMyApplications
);

/**
 * Withdraw an application
 *
 * GRADUATE / ARTISAN only
 *
 * PATCH /api/applications/:id/withdraw
 */
router.patch(
  "/:id/withdraw",
  authenticate,
  withdrawApplication
);

/**
 * Get all applications for an employer's job
 *
 * EMPLOYER only
 *
 * GET /api/applications/job/:id
 */
router.get(
  "/job/:id",
  authenticate,
  getJobApplications
);

/**
 * Get one application
 *
 * EMPLOYER only
 *
 * GET /api/applications/:id
 */
router.get(
  "/:id",
  authenticate,
  getApplicationById
);

/**
 * Update application status
 *
 * EMPLOYER only
 *
 * PATCH /api/applications/:id/status
 */
router.patch(
  "/:id/status",
  authenticate,
  updateApplicationStatus
);

export default router;