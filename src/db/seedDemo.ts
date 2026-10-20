
import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "./index.js";
import { accounts, apiKeys, plans, users } from "./schema.js";
import { seedPredefinedPlans } from "./seed.js";

async function seedDemo() {
  // Ensure the predefined plans exist first.
  await seedPredefinedPlans();

  const [accountPlan] = await db
    .select()
    .from(plans)
    .where(
      and(
        eq(plans.name, "Starter"),
        eq(plans.scope, "account"),
        eq(plans.isPredefined, true),
        isNull(plans.accountId),
      ),
    )
    .limit(1);

  const [userPlan] = await db
    .select()
    .from(plans)
    .where(
      and(
        eq(plans.name, "Starter"),
        eq(plans.scope, "user"),
        eq(plans.isPredefined, true),
        isNull(plans.accountId),
      ),
    )
    .limit(1);

  if (!accountPlan || !userPlan) {
    throw new Error("Starter plans were not created.");
  }

  // Create the demo account if it doesn't exist.
  let [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.name, "Demo Account"))
    .limit(1);

  if (!account) {
    [account] = await db
      .insert(accounts)
      .values({
        name: "Demo Account",
        planId: accountPlan.id,
      })
      .returning();
  }

  // Create the demo user if it doesn't exist.
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.accountId, account!.id),
        eq(users.externalId, "demo-user-1"),
      ),
    )
    .limit(1);

  if (!existingUser) {
    await db.insert(users).values({
      name: "Demo User",
      accountId: account!.id,
      externalId: "demo-user-1",
      planId: userPlan.id,
    });
  }

  // Generate a key only if the account has no key.
  const [existingKey] = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(eq(apiKeys.accountId, account!.id))
    .limit(1);

  if (!existingKey) {
    const apiKey = randomBytes(32).toString("hex");
    const keyHash = createHash("sha256")
      .update(apiKey)
      .digest("hex");

    await db.insert(apiKeys).values({
      accountId: account!.id,
      keyHash,
    });

    console.log("Demo API Key (save it now):", apiKey);
  } else {
    console.log("Demo account already has an API key.");
    console.log("The original key cannot be recovered from its hash.");
  }

  console.log("Demo account ID:", account!.id);
  console.log("Demo user external ID: demo-user-1");
}

seedDemo()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });