import {uniqueIndex, type AnyPgColumn, bigint, date, pgTable, text, check, pgEnum, boolean,uuid,varchar,timestamp,index} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const planScopeEnum = pgEnum("plan_scope", [
  "account",
  "user",
]);

export const apiKeyTypeEnum = pgEnum("api_key_type", [
  "account",
  "user",
]);

export const usageRequestStatusEnum = pgEnum(
  "usage_request_status",
  ["accepted", "rejected"],
);

export const ruleEnum = pgEnum("rejection_rule", ["per_request", "monthly"]);
export const scopeEnum = pgEnum("rejection_scope", ["user", "account"]);



export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),  
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
   accountId: uuid("account_id").references((): AnyPgColumn => accounts.id, {
      onDelete: "cascade",
    }),
  scope: planScopeEnum("scope").notNull(),
  monthlyAllowance: bigint("monthly_allowance", { mode: "number" }).notNull(),
  maxPerRequest: bigint("max_per_request", { mode: "number" }).notNull(), 
 isPredefined: boolean("is_predefined").notNull(), 
  createdAt: timestamp("created_at", {
    withTimezone: true,  
  }).defaultNow().notNull(),
},
    (t) => [
        uniqueIndex("plans_owner_scope_name_unique").on(t.accountId, t.scope, t.name),
        check("plans_allowance_nonneg", sql`${t.monthlyAllowance} >= 0`),
        check("plans_max_positive", sql`${t.maxPerRequest} > 0`),
        check(
        "plans_predefined_owner",
        sql`(${t.isPredefined} AND ${t.accountId} IS NULL) OR (NOT ${t.isPredefined} AND ${t.accountId} IS NOT NULL)`,
        ),
    ],);  

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),  
  name: varchar("name", { length: 100 }).notNull(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", {
      withTimezone: true,  
    }).defaultNow().notNull(),  
});



export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    planId: uuid("plan_id").notNull().references(()=>plans.id,{
      onDelete:"restrict"
    }),
    accountId: uuid("account_id").notNull().references(()=>accounts.id,{
        onDelete:"cascade"
    }),
    externalId: varchar("external_id", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),
    },  
    (t) => [uniqueIndex("users_account_external_unique").on(t.accountId, t.externalId)],);



export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
    .notNull()
      .references(() => accounts.id, {
        onDelete: "cascade",
      }),
    keyHash: varchar("key_hash", { length: 64 })
      .notNull()
      .unique(),
    isActive: boolean("is_active")
      .notNull()
      .default(true),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  }
);

export const accountUsagePeriods = pgTable(
  "account_usage_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    periodStart: date("period_start").notNull(),

    usedUnits: bigint("used_units", {
      mode: "number",
    })
      .notNull()
      .default(0),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("account_usage_period_unique").on(
      table.accountId,
      table.periodStart,
    ),

    check(
      "account_usage_units_nonnegative",
      sql`${table.usedUnits} >= 0`,
    ),
  ],
);


export const userUsagePeriods = pgTable(
  "user_usage_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    periodStart: date("period_start").notNull(),

    usedUnits: bigint("used_units", {
      mode: "number",
    })
      .notNull()
      .default(0),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_usage_period_unique").on(
      table.userId,
      table.periodStart,
    ),

    check(
      "user_usage_units_nonnegative",
      sql`${table.usedUnits} >= 0`,
    ),
  ],
);


export const usageRequests = pgTable(
  "usage_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, {
        onDelete: "restrict",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    idempotencyKey: varchar("idempotency_key", {
      length: 200,
    }).notNull(),

    requestedUnits: bigint("requested_units", {
      mode: "number",
    }).notNull(),

    status: usageRequestStatusEnum("status").notNull(),

    rejectionScope: scopeEnum("rejection_scope"), 
    
    rejectionRule: ruleEnum("rejection_rule"), 


    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [


    uniqueIndex("usage_request_idempotency_unique").on(
      table.accountId,
      table.idempotencyKey,
    ),

    index("usage_requests_account_created_idx").on(
      table.accountId,
      table.createdAt,
    ),

    index("usage_requests_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),

    check(
      "usage_requests_units_positive",
      sql`${table.requestedUnits} > 0`,
    ),
    check(
        "usage_requests_rejection_consistent",
        sql`(${table.status} = 'accepted' AND ${table.rejectionScope} IS NULL AND ${table.rejectionRule} IS NULL)
        OR (${table.status} = 'rejected' AND ${table.rejectionScope} IS NOT NULL AND ${table.rejectionRule} IS NOT NULL)`,
),
  ],
);
