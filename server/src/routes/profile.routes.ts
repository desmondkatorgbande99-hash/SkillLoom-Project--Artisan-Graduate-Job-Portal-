import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/profile.controller";

const router = Router();

/**
 * Get authenticated user's profile
 *
 * GET /api/profiles/me
 */
router.get(
  "/me",
  authenticate,
  getMyProfile
);

/**
 * Update authenticated user's profile
 *
 * PATCH /api/profiles/me
 */
router.patch(
  "/me",
  authenticate,
  updateMyProfile
);

export default router;