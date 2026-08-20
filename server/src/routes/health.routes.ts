import { Router } from "express";
import prisma from "../config/database";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "SkillLoom API is healthy.",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check database error:", error);

    res.status(503).json({
      success: false,
      message: "SkillLoom API is running, but the database is unavailable.",
      database: "disconnected",
    });
  }
});

export default router;