
import type { Request, Response } from "express";
import * as planService from "../services/planService.js";

export async function createPlanHandler(
  req: Request,
  res: Response,
) {
  const accountId = res.locals.accountId as string;

  if (!accountId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const {
    name,
    description,
    scope,
    monthlyAllowance,
    maxPerRequest,
  } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof scope !== "string" ||
    typeof monthlyAllowance !== "number" ||
    typeof maxPerRequest !== "number" ||
    (description !== undefined &&
      typeof description !== "string")
  ) {
    return res.status(400).json({
      message: "Invalid request body",
    });
  }

  try {
    const plan = await planService.createAccountPlan(
      accountId,
      {
        name,
        description,
        scope: scope as "account" | "user",
        monthlyAllowance,
        maxPerRequest,
      },
    );

    return res.status(201).json({ plan });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Plan name") ||
      error instanceof Error &&
      error.message.startsWith("Scope must") ||
      error instanceof Error &&
      error.message.startsWith("monthlyAllowance") ||
      error instanceof Error &&
      error.message.startsWith("maxPerRequest")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    // PostgreSQL unique constraint violation
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return res.status(409).json({
        message: "A plan with this name and scope already exists",
      });
    }

    console.error("Create plan error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function listPlansHandler(
  _req: Request,
  res: Response,
) {
  const accountId = res.locals.accountId as string;

  if (!accountId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const plans = await planService.listAccountPlans(accountId);
    return res.status(200).json({ plans });
  } catch (error) {
    console.error("List plans error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getPlanHandler(
  req: Request,
  res: Response,
) {
  const accountId = res.locals.accountId as string;

  if (!accountId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  if(!req.params.id){
      return res.status(404).json({
        message: "Plan ID is required",
      }); 

  }
  if( typeof req.params.id !=="string"){
      return res.status(404).json({
        message: "Plan ID is required",
      }); 

  }
  try {
    const plan = await planService.findAccountPlan(
      accountId,
      req.params.id,
    );

    if (!plan) {
      return res.status(404).json({
        message: "Plan not found",
      });
    }

    return res.status(200).json({ plan });
  } catch (error) {
    console.error("Get plan error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
