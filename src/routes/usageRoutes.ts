
import { Router } from "express";
import { authMiddleware } from "../auth.js";
import {
  getAccountUsage,
  getUserUsage,
} from "../handlers/usageReportHandler.js";
import { getUsageLogs } from "../handlers/usageReportHandler.js";

const router = Router();

router.get("/account", authMiddleware, getAccountUsage);
router.get("/user", authMiddleware, getUserUsage);
router.get("/logs", authMiddleware, getUsageLogs);

export default router;