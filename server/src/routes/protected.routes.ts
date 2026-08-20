import { Router } from "express";
import {
  authenticate,
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/me",
  authenticate,
  (req: AuthenticatedRequest, res) => {
    return res.status(200).json({
      success: true,
      message: "You have accessed a protected SkillLoom route.",
      user: req.user,
    });
  }
);

export default router;