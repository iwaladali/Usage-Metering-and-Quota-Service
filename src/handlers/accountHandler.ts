import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  createAccountService,
  changeAccountPlanService,
} from "../services/accountService.js";

export async function handlerCreateAccount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, plan } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        message: "Account name is required",
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

    const account = await createAccountService(
      name.trim(),
      plan ?? "Starter",
    );

    res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ACCOUNT_PLAN_NOT_FOUND"
    ) {
      res.status(404).json({
        message: "Predefined account plan not found",
      });
      return;
    }

    next(error);
  }
}

export async function handlerChangeAccountPlan(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accountId = res.locals.accountId as
      | string
      | undefined;

    const { plan } = req.body;

    if (!accountId) {
      res.status(401).json({
        message: "Unauthenticated account",
      });
      return;
    }

    if (typeof plan !== "string" || !plan.trim()) {
      res.status(400).json({
        message: "Plan is required",
      });
      return;
    }

    const account = await changeAccountPlanService(
      accountId,
      plan.trim(),
    );

    res.status(200).json({
      message: "Account plan updated successfully",
      account,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ACCOUNT_NOT_FOUND") {
        res.status(404).json({
          message: "Account not found",
        });
        return;
      }

      if (error.message === "ACCOUNT_PLAN_NOT_FOUND") {
        res.status(404).json({
          message: "Account plan not found or unavailable",
        });
        return;
      }
    }

    next(error);
  }
}