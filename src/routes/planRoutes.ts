
import { Router } from "express";
import { authMiddleware } from "../auth.js";
import {
  createPlanHandler,
  listPlansHandler,
  getPlanHandler,
} from "../handlers/planHandler.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createPlanHandler);
router.get("/", listPlansHandler);
router.get("/:id", getPlanHandler);

export default router;
