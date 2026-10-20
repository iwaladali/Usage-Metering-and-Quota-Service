import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { accounts } from "../db/schema.js";

export async function findAccountById(accountId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  return account;
}

export async function createAccount(
  name: string,
  planId: string,
) {
  const [account] = await db
    .insert(accounts)
    .values({
      name,
      planId,
    })
    .returning();

  return account;
}

export async function updateAccountPlan(
  accountId: string,
  planId: string,
) {
  const [account] = await db
    .update(accounts)
    .set({ planId })
    .where(eq(accounts.id, accountId))
    .returning();

  return account;
}