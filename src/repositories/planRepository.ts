import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { plans } from "../db/schema.js";

export async function findPredefinedPlan(
  name: string,
  scope: "account" | "user",
) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(
      and(
        eq(plans.name, name),
        eq(plans.scope, scope),
        eq(plans.isPredefined, true),
        isNull(plans.accountId),
      ),
    )
    .limit(1);

  return plan;
}

export async function findAvailablePlanForAccount(
  name: string,
  scope: "account" | "user",
  accountId: string,
) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(
      and(
        eq(plans.name, name),
        eq(plans.scope, scope),
        or(
          // خطة جاهزة مشتركة
          and(
            eq(plans.isPredefined, true),
            isNull(plans.accountId),
          ),
          // خطة مخصصة لهذا الحساب
          and(
            eq(plans.isPredefined, false),
            eq(plans.accountId, accountId),
          ),
        ),
      ),
    )
    .limit(1);

  return plan;
}
export async function createPlan(data: {
  accountId: string;
  name: string;
  description?: string;
  scope: "account" | "user";
  monthlyAllowance: number;
  maxPerRequest: number;
}) {
  const [plan] = await db
    .insert(plans)
    .values({
      accountId: data.accountId,
      name: data.name,
      description: data.description ?? null,
      scope: data.scope,
      monthlyAllowance: data.monthlyAllowance,
      maxPerRequest: data.maxPerRequest,
      isPredefined: false,
    })
    .returning();

  return plan;
}

export async function getAccountPlans(accountId: string) {
  return db
    .select()
    .from(plans)
    .where(
      and(
        eq(plans.accountId, accountId),
        eq(plans.isPredefined, false),
      ),
    );
}

export async function getPlanById(
  accountId: string,
  planId: string,
) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(
      and(
        eq(plans.id, planId),
        eq(plans.accountId, accountId),
        eq(plans.isPredefined, false),
      ),
    )
    .limit(1);

  return plan;
}