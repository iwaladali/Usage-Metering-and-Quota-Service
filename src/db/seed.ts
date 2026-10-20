
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./index.js";
import { plans } from "./schema.js";

const predefinedPlans = [
  {
    name: "Starter",
    description: "Default account plan",
    scope: "account" as const,
    monthlyAllowance: 100_000,
    maxPerRequest: 10_000,
  },
  {
    name: "Starter",
    description: "Default user plan",
    scope: "user" as const,
    monthlyAllowance: 10_000,
    maxPerRequest: 1_000,
  },
];

export async function seedPredefinedPlans(): Promise<void> {
  for (const plan of predefinedPlans) {
    const [existingPlan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(
        and(
          eq(plans.name, plan.name),
          eq(plans.scope, plan.scope),
          eq(plans.isPredefined, true),
          isNull(plans.accountId),
        ),
      )
      .limit(1);

    if (existingPlan) {
      continue;
    }

    await db.insert(plans).values({
      ...plan,
      accountId: null,
      isPredefined: true,
    });
  }

  console.log("Predefined plans seeded");
}