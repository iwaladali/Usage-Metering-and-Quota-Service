import {
  createAccount as insertAccount,
  findAccountById,
  updateAccountPlan as saveAccountPlan,
} from "../repositories/accountRepository.js";

import {
  findPredefinedPlan,
  findAvailablePlanForAccount,
} from "../repositories/planRepository.js";

export async function createAccountService(
  name: string,
  planName = "Starter",
) {
  const plan = await findPredefinedPlan(
    planName,
    "account",
  );

  if (!plan) {
    throw new Error("ACCOUNT_PLAN_NOT_FOUND");
  }

  return insertAccount(name, plan.id);
}

export async function changeAccountPlanService(
  accountId: string,
  planName: string,
) {
  const account = await findAccountById(accountId);

  if (!account) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  const plan = await findAvailablePlanForAccount(
    planName,
    "account",
    accountId,
  );

  if (!plan) {
    throw new Error("ACCOUNT_PLAN_NOT_FOUND");
  }

  return saveAccountPlan(accountId, plan.id);
}