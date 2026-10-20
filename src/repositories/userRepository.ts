import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

export async function findUserByExternalId(
  accountId: string,
  externalId: string,
) {
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.accountId, accountId),
        eq(users.externalId, externalId),
      ),
    )
    .limit(1);

  return user;
}

export async function createUser(
  name: string,
  accountId: string,
  externalId: string,
  planId: string,
) {
  const [user] = await db
    .insert(users)
    .values({
      name,
      accountId,
      externalId,
      planId,
    })
    .returning();

  return user;
}

export async function updateUserPlan(
  accountId: string,
  externalId: string,
  planId: string,
) {
  const [user] = await db
    .update(users)
    .set({ planId })
    .where(
      and(
        eq(users.accountId, accountId),
        eq(users.externalId, externalId),
      ),
    )
    .returning();

  return user;
}