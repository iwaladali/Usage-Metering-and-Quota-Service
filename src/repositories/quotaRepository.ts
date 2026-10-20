import { and, eq } from "drizzle-orm";
import type { db } from "../db/index.js";
import { accountUsagePeriods, userUsagePeriods } from "../db/schema.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function lockUserUsage(
  tx: Tx,
  userId: string,
  periodStart: string,
) {
  const [usage]= await tx.select()
  .from(userUsagePeriods)
  .where(
    and(
      eq(userUsagePeriods.userId, userId),
      eq(userUsagePeriods.periodStart, periodStart)
    ),
  )
  .for ("update");
  return usage;
}

export async function lockAccountUsage(
  tx: Tx,
  accountId: string,
  periodStart: string,
) {
  const [usage]=await tx.select()
  .from(accountUsagePeriods)
  .where(and(
        eq(accountUsagePeriods.accountId, accountId),
        eq(accountUsagePeriods.periodStart, periodStart)
  ))
  .for("update");
  return usage;
}

export async function updateUserUsage(
  tx: Tx,
  usageId: string,
  usedUnits: number,
) {
  await tx.update(userUsagePeriods)
  .set({
   usedUnits
  }).where(
    eq(userUsagePeriods.id, usageId)
  );
  
}

export async function updateAccountUsage(
  tx: Tx,
  usageId: string,
  usedUnits: number,
) {
  await tx
    .update(accountUsagePeriods)
    .set({ usedUnits })
    .where(eq(accountUsagePeriods.id, usageId));
}


export async function ensureUserUsage(
  tx: Tx,
  userId: string,
  periodStart: string,
) {
  await tx
    .insert(userUsagePeriods)
    .values({
      userId,
      periodStart,
      usedUnits: 0,
    })
    .onConflictDoNothing({
      target: [
        userUsagePeriods.userId,
        userUsagePeriods.periodStart,
      ],
    });
}

export async function ensureAccountUsage(
  tx: Tx,
  accountId: string,
  periodStart: string,
) {
  await tx
    .insert(accountUsagePeriods)
    .values({
      accountId,
      periodStart,
      usedUnits: 0,
    })
    .onConflictDoNothing({
      target: [
        accountUsagePeriods.accountId,
        accountUsagePeriods.periodStart,
      ],
    });
}