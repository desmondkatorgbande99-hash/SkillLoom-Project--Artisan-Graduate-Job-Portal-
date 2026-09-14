import { Router } from "express";

import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";

import {
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/email-verification.controller";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get(
  "/verify-email",
  verifyEmail
);

router.post(
  "/resend-verification",
  resendVerificationEmail
);

export default router;
