export interface ConsumeInput {
  accountId: string;
  externalUserId: string;
  requestedUnits: number;
  idempotencyKey: string;
}

export interface QuotaInfo {
  usedUnits: number;
  monthlyAllowance: number;
  maxPerRequest: number;
}

export type rejectionRule =
  | "per_request"
  | "monthly";

export type rejectionScope =
  | "user"
  | "account";
  
export interface ConsumeResult {
  statusCode: number;
  body: {
    message: string;
    rejectionScope?: rejectionScope;
    rejectionRule?: rejectionRule;
  };
}