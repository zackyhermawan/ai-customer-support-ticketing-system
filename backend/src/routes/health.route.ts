
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "API is running",
      services: {
        api: "ok",
        database: "connected"
      }
    });
  } catch {
    res.status(503).json({
      success: false,
      message: "Database connection failed"
    });
  }
});

export default router;
