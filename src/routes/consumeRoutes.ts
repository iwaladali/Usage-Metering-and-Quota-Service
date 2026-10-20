
import { Router } from "express";
import { handlerConsumUser } from "../handlers/consum.js";
import { authMiddleware } from "../auth.js";

const router = Router();

router.post("/", authMiddleware, handlerConsumUser);

export default router;