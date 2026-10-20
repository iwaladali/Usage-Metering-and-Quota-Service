import type { QuotaInfo } from "../types/consum.js";

export function checkUserQuota(
  units: number,
  quota: QuotaInfo,
): "per_request" | "monthly" | null {
  if (units > quota.maxPerRequest) {
    return "per_request";
  }

  if (quota.usedUnits + units > quota.monthlyAllowance) {
    return "monthly";
  }

  return null;
}