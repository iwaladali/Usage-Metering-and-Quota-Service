import { Router } from "express";
import { authMiddleware } from "../auth.js";

import {
  handlerCreateUser,
  handlerChangeUserPlan,
} from "../handlers/userHandler.js";

const router = Router();

router.post("/", authMiddleware, handlerCreateUser);

router.patch(
  "/plan",
  authMiddleware,
  handlerChangeUserPlan,
);

export default router;