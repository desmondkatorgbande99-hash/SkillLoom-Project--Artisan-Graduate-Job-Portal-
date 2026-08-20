import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  getGraduateDashboard,
  getArtisanDashboard,
  getEmployerDashboard,
  getAdminDashboard,
} from "../controllers/dashboard.controller";

const router = Router();

/**
 * Graduate dashboard
 *
 * GET /api/dashboard/graduate
 */
router.get(
  "/graduate",
  authenticate,
  getGraduateDashboard
);

/**
 * Artisan dashboard
 *
 * GET /api/dashboard/artisan
 */
router.get(
  "/artisan",
  authenticate,
  getArtisanDashboard
);

/**
 * Employer dashboard
 *
 * GET /api/dashboard/employer
 */
router.get(
  "/employer",
  authenticate,
  getEmployerDashboard
);

/**
 * Admin dashboard
 *
 * GET /api/dashboard/admin
 */
router.get(
  "/admin",
  authenticate,
  getAdminDashboard
);

export default router;