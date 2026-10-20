import { Router } from "express";
import { authMiddleware } from "../auth.js";

import {
  handlerChangeAccountPlan,
} from "../handlers/accountHandler.js";

const router = Router();

router.patch(
  "/plan",
  authMiddleware,
  handlerChangeAccountPlan,
);

export default router;