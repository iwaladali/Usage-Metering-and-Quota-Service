import {
  findRecentUsageRequests,
} from "../repositories/usageReportRepository.js";

import {
  findAccountPlan,
  findAccountUsagePeriod,
  findRecentAccountRequests,
  findUserPlan,
  findUserUsagePeriod,
  findRecentUserRequests,
} from "../repositories/usageReportRepository.js";

export class UsageReportNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageReportNotFoundError";
  }
}

function getCurrentMonthStart(): string {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
    .toISOString()
    .slice(0, 10);
}

export async function getAccountUsageReport(
  accountId: string,
) {
  const periodStart = getCurrentMonthStart();

  const account = await findAccountPlan(accountId);

  if (!account) {
    throw new UsageReportNotFoundError("Account not found");
  }

  const [period, recentRequests] = await Promise.all([
    findAccountUsagePeriod(accountId, periodStart),
    findRecentAccountRequests(accountId),
  ]);

  const usedUnits = period?.usedUnits ?? 0;

  return {
    scope: "account" as const,
    periodStart,
    usage: {
      usedUnits,
      monthlyAllowance: account.monthlyAllowance,
      remainingUnits: Math.max(
        0,
        account.monthlyAllowance - usedUnits,
      ),
    },
    recentRequests,
  };
}

export async function getUserUsageReport(
  accountId: string,
  externalUserId: string,
) {
  const periodStart = getCurrentMonthStart();

  const user = await findUserPlan(accountId, externalUserId);

  if (!user) {
    throw new UsageReportNotFoundError("User not found");
  }

  const [period, recentRequests] = await Promise.all([
    findUserUsagePeriod(user.id, periodStart),
    findRecentUserRequests(accountId, user.id),
  ]);

  const usedUnits = period?.usedUnits ?? 0;

  return {
    scope: "user" as const,
    user: {
      name: user.name,
      externalUserId: user.externalId,
    },
    periodStart,
    usage: {
      usedUnits,
      monthlyAllowance: user.monthlyAllowance,
      remainingUnits: Math.max(
        0,
        user.monthlyAllowance - usedUnits,
      ),
    },
    recentRequests,
  };
}

export async function getRecentUsageRequests() {
  return findRecentUsageRequests();
}