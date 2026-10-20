import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  users,
  accounts,
  plans,
} from "../db/schema.js";

import type {
  ConsumeInput,
  ConsumeResult,
  QuotaInfo,
  rejectionScope,
  rejectionRule
} from "../types/consum.js";

import {
  checkUserQuota,
} from "./userQuiotService.js";

import {
  checkAccountQuota,
} from "./accountQuotaService.js";

import {
  findPreviousRequest,
  createUsageRequest,
} from "../repositories/usageRequestRepository.js";

import {
  lockUserUsage,
  lockAccountUsage,
  updateUserUsage,
  updateAccountUsage,
  ensureUserUsage,
  ensureAccountUsage
} from "../repositories/quotaRepository.js";

function currentMonthStartUTC(): string {
  const now = new Date();

  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");
}

export async function consumeService(
  input: ConsumeInput,
): Promise<ConsumeResult> {
  const {
    accountId,
    externalUserId,
    requestedUnits,
    idempotencyKey,
  } = input;

  if (!Number.isSafeInteger(requestedUnits) || requestedUnits <= 0) {
    return {
      statusCode: 400,
      body: { message: "Units must be a positive integer" },
    };
  }

  if (!idempotencyKey.trim()) {
    return {
      statusCode: 400,
      body: { message: "Idempotency key is required" },
    };
  }

  return db.transaction(async (tx) => {
    // 1. هل سبق تسجيل هذا الطلب؟
    const previous = await findPreviousRequest(
      tx,
      accountId,
      idempotencyKey,
    );

    if (previous) {
      return {
        statusCode: 409,
        body: { message: "Request already processed" },
      };
    }

    // 2. جلب المستخدم الذي ينتمي لهذا الحساب.
    const [user] = await tx
      .select({
        id: users.id,
        planId: users.planId,
      })
      .from(users)
      .where(
        and(
          eq(users.accountId, accountId),
          eq(users.externalId, externalUserId),
        ),
      )
      .limit(1);

    if (!user) {
      return {
        statusCode: 404,
        body: { message: "User not found" },
      };
    }

    // 3. جلب خطة الحساب.
    const [account] = await tx
      .select({
        planId: accounts.planId,
      })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (!account) {
      return {
        statusCode: 404,
        body: { message: "Account not found" },
      };
    }

    // 4. جلب الخطتين.
    const [userPlan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.id, user.planId))
      .limit(1);

    const [accountPlan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.id, account.planId))
      .limit(1);

    if (!userPlan || !accountPlan) {
      throw new Error("User or account plan not found");
    }

    // 5. قفل سجلات استهلاك الشهر الحالي.
    const periodStart = currentMonthStartUTC();
    await ensureUserUsage(tx, user.id, periodStart);
    await ensureAccountUsage(tx, accountId, periodStart);
    const userUsage = await lockUserUsage(
      tx,
      user.id,
      periodStart,
    );

    const accountUsage = await lockAccountUsage(
      tx,
      accountId,
      periodStart,
    );

    if (!userUsage || !accountUsage) {
      throw new Error(
        "Monthly usage records must be initialized first",
      );
    }

    // 6. تجهيز معلومات الحصص.
    const userQuota: QuotaInfo = {
      usedUnits: userUsage.usedUnits,
      monthlyAllowance: userPlan.monthlyAllowance,
      maxPerRequest: userPlan.maxPerRequest,
    };

    const accountQuota: QuotaInfo = {
      usedUnits: accountUsage.usedUnits,
      monthlyAllowance: accountPlan.monthlyAllowance,
      maxPerRequest: accountPlan.maxPerRequest,
    };

    // 7. فحص حصة المستخدم ثم حصة الحساب.
    const userRejection = checkUserQuota(
      requestedUnits,
      userQuota,
    );

    const accountRejection = checkAccountQuota(
      requestedUnits,
      accountQuota,
    );

    let rejectionScope:
      rejectionScope | null =null;
    let rejectionRule:
      rejectionRule | null =null;

      if(userRejection){
        rejectionScope="user";
        rejectionRule=userRejection;
    }
    if(accountRejection){
        rejectionScope="account";
        rejectionRule=accountRejection;
      }

      

    // 8. إذا رُفض الطلب، نسجله دون تحديث الاستهلاك.
    if (rejectionScope) {
      await createUsageRequest(tx, {
        accountId,
        userId: user.id,
        idempotencyKey,
        requestedUnits,
        status: "rejected",
        rejectionScope,
        rejectionRule
        
      });

      return {
        statusCode: 429,
        body: {
          message: "Quota exceeded",
          reason: `${rejectionScope}_${rejectionRule}`,
        },
      };
    }

    // 9. نسجل الطلب المقبول.
    await createUsageRequest(tx, {
      accountId,
      userId: user.id,
      idempotencyKey,
      requestedUnits,
      status: "accepted",
      
    });

    // 10. نحدّث استهلاك المستخدم والحساب.
    await updateUserUsage(
      tx,
      userUsage.id,
      userUsage.usedUnits + requestedUnits,
    );

    await updateAccountUsage(
      tx,
      accountUsage.id,
      accountUsage.usedUnits + requestedUnits,
    );

    return {
      statusCode: 200,
      body: { message: "Usage accepted" },
    };
  });
}