
import * as planRepository from "../repositories/planRepository.js";

type CreatePlanInput = {
  name: string;
  description?: string;
  scope: "account" | "user";
  monthlyAllowance: number;
  maxPerRequest: number;
};

export async function createAccountPlan(
  accountId: string,
  input: CreatePlanInput,
) {
  const name = input.name?.trim();

  if (!name || name.length > 100) {
    throw new Error("Plan name must be between 1 and 100 characters");
  }

  if (
    input.scope !== "account" &&
    input.scope !== "user"
  ) {
    throw new Error("Scope must be account or user");
  }

  if (
    !Number.isSafeInteger(input.monthlyAllowance) ||
    input.monthlyAllowance <= 0
  ) {
    throw new Error("monthlyAllowance must be a positive integer");
  }

  if (
    !Number.isSafeInteger(input.maxPerRequest) ||
    input.maxPerRequest <= 0
  ) {
    throw new Error("maxPerRequest must be a positive integer");
  }

  if (input.maxPerRequest > input.monthlyAllowance) {
    throw new Error(
      "maxPerRequest cannot exceed monthlyAllowance",
    );
  }

  return planRepository.createPlan({
    accountId,
    name,
    description: input.description?.trim()?input.description?.trim():"",
    scope: input.scope,
    monthlyAllowance: input.monthlyAllowance,
    maxPerRequest: input.maxPerRequest,
  });
}

export async function listAccountPlans(accountId: string) {
  return planRepository.getAccountPlans(accountId);
}

export async function findAccountPlan(
  accountId: string,
  planId: string,
) {
  return planRepository.getPlanById(accountId, planId);
}
