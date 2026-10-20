import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  createUserService,
  changeUserPlanService,
} from "../services/userService.js";

export async function handlerCreateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accountId = res.locals.accountId as
      | string
      | undefined;

    const { name, externalUserId, plan } = req.body;

    if (!accountId) {
      res.status(401).json({
        message: "Unauthenticated account",
      });
      return;
    }

    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        message: "User name is required",
      });
      return;
    }
    
    if (
      typeof externalUserId !== "string" ||
      !externalUserId.trim()
    ) {
      res.status(400).json({
        message: "External ID is required",
        body:req.body
      });
      return;
    }

    if (
      plan !== undefined &&
      (typeof plan !== "string" || !plan.trim())
    ) {
      res.status(400).json({
        message: "Invalid plan name",
      });
      return;
    }

    const user = await createUserService(
      name.trim(),
      accountId,
      externalUserId.trim(),
      plan ?? "Starter",
    );

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ACCOUNT_NOT_FOUND") {
        res.status(404).json({
          message: "Account not found",
        });
        return;
      }

      if (error.message === "USER_ALREADY_EXISTS") {
        res.status(409).json({
          message: "User already exists in this account",
        });
        return;
      }

      if (error.message === "USER_PLAN_NOT_FOUND") {
        res.status(404).json({
          message: "User plan not found or unavailable",
        });
        return;
      }
    }

    next(error);
  }
}

export async function handlerChangeUserPlan(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accountId = res.locals.accountId as
      | string
      | undefined;

    const { externalId, plan } = req.body;

    if (!accountId) {
      res.status(401).json({
        message: "Unauthenticated account",
      });
      return;
    }

    if (
      typeof externalId !== "string" ||
      !externalId.trim()
    ) {
      res.status(400).json({
        message: "External ID is required",
      });
      return;
    }

    if (typeof plan !== "string" || !plan.trim()) {
      res.status(400).json({
        message: "Plan is required",
      });
      return;
    }

    const user = await changeUserPlanService(
      accountId,
      externalId.trim(),
      plan.trim(),
    );

    res.status(200).json({
      message: "User plan updated successfully",
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      if (error.message === "USER_PLAN_NOT_FOUND") {
        res.status(404).json({
          message: "User plan not found or unavailable",
        });
        return;
      }
    }

    next(error);
  }
}