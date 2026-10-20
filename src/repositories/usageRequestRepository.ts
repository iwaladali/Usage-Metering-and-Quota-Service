import { and, eq } from "drizzle-orm";
import type { db } from "../db/index.js";
import { usageRequests } from "../db/schema.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function findPreviousRequest(
  tx: Tx,
  accountId: string,
  idempotencyKey: string,
) {
  const [request] = await tx
    .select()
    .from(usageRequests)
    .where(
      and(
        eq(usageRequests.accountId, accountId),
        eq(usageRequests.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return request;
}

export async function createUsageRequest(
  tx: Tx,
  data: {
    accountId: string;
    userId: string;
    idempotencyKey: string;
    requestedUnits: number;
    status: "accepted" | "rejected";
    rejectionScope?: "user" | "account" | null;
    rejectionRule?: "per_request" | "monthly" | null;
    
  },) {
  await tx.insert(usageRequests).values(data);
}