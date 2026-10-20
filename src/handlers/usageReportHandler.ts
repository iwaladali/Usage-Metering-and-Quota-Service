import { getRecentUsageRequests } from "../services/usageReportService.js";
import type { Request, Response, NextFunction } from "express";
import {
  getAccountUsageReport,
  getUserUsageReport,
  UsageReportNotFoundError,
} from "../services/usageReportService.js";

function handleError(
  error: unknown,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof UsageReportNotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }

  next(error);
}

export async function getAccountUsage(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accountId = res.locals.accountId as string;

    const report = await getAccountUsageReport(accountId);

    res.status(200).json(report);
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getUserUsage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accountId = res.locals.accountId as string;
    const externalUserId = req.query.externalUserId;

    if (
      typeof externalUserId !== "string" ||
      externalUserId.trim() === ""
    ) {
      res.status(400).json({
        error: "externalUserId query parameter is required",
      });
      return;
    }

    const report = await getUserUsageReport(
      accountId,
      externalUserId.trim(),
    );

    res.status(200).json(report);
  } catch (error) {
    handleError(error, res, next);
  }
}


export async function getUsageLogs(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const logs = await getRecentUsageRequests();
    res.status(200).json({ logs });
  } catch (error) {
    next(error);
  }
}