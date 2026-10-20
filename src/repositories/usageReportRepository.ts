
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  accounts,
  plans,
  users,
  accountUsagePeriods,
  userUsagePeriods,
  usageRequests,
} from "../db/schema.js";

export async function findAccountPlan(accountId: string) {
  const [account] = await db
    .select({
      id: accounts.id,
      monthlyAllowance: plans.monthlyAllowance,
    })
    .from(accounts)
    .innerJoin(plans, eq(accounts.planId, plans.id))
    .where(eq(accounts.id, accountId))
    .limit(1);

  return account;
}

export async function findAccountUsagePeriod(
  accountId: string,
  periodStart: string,
) {
  const [period] = await db
    .select({
      usedUnits: accountUsagePeriods.usedUnits,
    })
    .from(accountUsagePeriods)
    .where(
      and(
        eq(accountUsagePeriods.accountId, accountId),
        eq(accountUsagePeriods.periodStart, periodStart),
      ),
    )
    .limit(1);

  return period;
}

export async function findRecentAccountRequests(
  accountId: string,
) {
  return db
    .select({
      id: usageRequests.id,
      userId: usageRequests.userId,
      requestedUnits: usageRequests.requestedUnits,
      status: usageRequests.status,
      rejectionScope: usageRequests.rejectionScope,
      rejectionRule: usageRequests.rejectionRule,
      createdAt: usageRequests.createdAt,
    })
    .from(usageRequests)
    .where(eq(usageRequests.accountId, accountId))
    .orderBy(desc(usageRequests.createdAt))
    .limit(10);
}

export async function findUserPlan(
  accountId: string,
  externalUserId: string,
) {
  const [user] = await db
    .select({
      id: users.id,
      externalId: users.externalId,
      name: users.name,
      monthlyAllowance: plans.monthlyAllowance,
    })
    .from(users)
    .innerJoin(plans, eq(users.planId, plans.id))
    .where(
      and(
        eq(users.accountId, accountId),
        eq(users.externalId, externalUserId),
      ),
    )
    .limit(1);

  return user;
}

export async function findUserUsagePeriod(
  userId: string,
  periodStart: string,
) {
  const [period] = await db
    .select({
      usedUnits: userUsagePeriods.usedUnits,
    })
    .from(userUsagePeriods)
    .where(
      and(
        eq(userUsagePeriods.userId, userId),
        eq(userUsagePeriods.periodStart, periodStart),
      ),
    )
    .limit(1);

  return period;
}

export async function findRecentUserRequests(
  accountId: string,
  userId: string,
) {
  return db
    .select({
      id: usageRequests.id,
      requestedUnits: usageRequests.requestedUnits,
      status: usageRequests.status,
      rejectionScope: usageRequests.rejectionScope,
      rejectionRule: usageRequests.rejectionRule,
      createdAt: usageRequests.createdAt,
    })
    .from(usageRequests)
    .where(
      and(
        eq(usageRequests.accountId, accountId),
        eq(usageRequests.userId, userId),
      ),
    )
    .orderBy(desc(usageRequests.createdAt))
    .limit(10);
}

export async function findRecentUsageRequests() {
  return db
    .select({
      id: usageRequests.id,
      accountId: usageRequests.accountId,
      userId: usageRequests.userId,
      requestedUnits: usageRequests.requestedUnits,
      status: usageRequests.status,
      rejectionScope: usageRequests.rejectionScope,
      rejectionRule: usageRequests.rejectionRule,
      createdAt: usageRequests.createdAt,
    })
    .from(usageRequests)
    .orderBy(desc(usageRequests.createdAt))
    .limit(10);
}