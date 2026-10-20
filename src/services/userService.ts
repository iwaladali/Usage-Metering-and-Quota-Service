import {
  createUser as insertUser,
  findUserByExternalId,
  updateUserPlan as saveUserPlan,
} from "../repositories/userRepository.js";

import {
  findAccountById,
} from "../repositories/accountRepository.js";

import {
  findAvailablePlanForAccount,
} from "../repositories/planRepository.js";

export async function createUserService(
  name: string,
  accountId: string,
  externalId: string,
  planName = "Starter",
) {
  const account = await findAccountById(accountId);

  if (!account) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  const existingUser = await findUserByExternalId(
    accountId,
    externalId,
  );

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const plan = await findAvailablePlanForAccount(
    planName,
    "user",
    accountId,
  );

  if (!plan) {
    throw new Error("USER_PLAN_NOT_FOUND");
  }

  return insertUser(
    name,
    accountId,
    externalId,
    plan.id,
  );
}

export async function changeUserPlanService(
  accountId: string,
  externalId: string,
  planName: string,
) {
  const user = await findUserByExternalId(
    accountId,
    externalId,
  );

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const plan = await findAvailablePlanForAccount(
    planName,
    "user",
    accountId,
  );

  if (!plan) {
    throw new Error("USER_PLAN_NOT_FOUND");
  }

  return saveUserPlan(
    accountId,
    externalId,
    plan.id,
  );
}