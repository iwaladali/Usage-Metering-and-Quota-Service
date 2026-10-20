
import type { Request, Response, NextFunction } from "express";
import { consumeService } from "../services/consumeService.js";

export async function handlerConsumUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accountId = res.locals.accountId as string | undefined;

    const externalUserId = req.body?.externalUserId;
    const requestedUnits = parseInt(req.body?.units);
    const idempotencyKey = req.header("Idempotency-Key");

    if (!accountId) {
      res.status(401).json({
        message: "Unauthenticated account",
      });
      return;
    }

    if (
      typeof externalUserId !== "string" ||
      !externalUserId.trim()
    ) {
      res.status(400).json({
        message: "externalUserId is required",
      });
      return;
    }

    if (
      (typeof requestedUnits !== "number") ||
      (!Number.isSafeInteger(requestedUnits)) ||
      (requestedUnits <= 0)
    ) {
      res.status(400).json({
        message: "units must be a positive integer",
        units: requestedUnits,
      });
      return;
    }

    if (
      !idempotencyKey?.trim() ||
      idempotencyKey.length > 200
    ) {
      res.status(400).json({
        message: "A valid Idempotency-Key is required",
      });
      return;
    }

    const result = await consumeService({
      accountId,
      externalUserId: externalUserId.trim(),
      requestedUnits,
      idempotencyKey: idempotencyKey.trim(),
    });

    res.status(result.statusCode).json(result.body);
  } catch (error) {
    next(error);
  }
}