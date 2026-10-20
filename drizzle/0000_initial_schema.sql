CREATE TYPE "public"."api_key_type" AS ENUM('account', 'user');--> statement-breakpoint
CREATE TYPE "public"."plan_scope" AS ENUM('account', 'user');--> statement-breakpoint
CREATE TYPE "public"."rejection_rule" AS ENUM('per_request', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."rejection_scope" AS ENUM('user', 'account');--> statement-breakpoint
CREATE TYPE "public"."usage_request_status" AS ENUM('accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "account_usage_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"used_units" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_usage_units_nonnegative" CHECK ("account_usage_periods"."used_units" >= 0)
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"plan_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"account_id" uuid,
	"scope" "plan_scope" NOT NULL,
	"monthly_allowance" bigint NOT NULL,
	"max_per_request" bigint NOT NULL,
	"is_predefined" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_allowance_nonneg" CHECK ("plans"."monthly_allowance" >= 0),
	CONSTRAINT "plans_max_positive" CHECK ("plans"."max_per_request" > 0),
	CONSTRAINT "plans_predefined_owner" CHECK (("plans"."is_predefined" AND "plans"."account_id" IS NULL) OR (NOT "plans"."is_predefined" AND "plans"."account_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "usage_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"requested_units" bigint NOT NULL,
	"status" "usage_request_status" NOT NULL,
	"rejection_scope" "rejection_scope",
	"rejection_rule" "rejection_rule",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_requests_units_positive" CHECK ("usage_requests"."requested_units" > 0),
	CONSTRAINT "usage_requests_rejection_consistent" CHECK (("usage_requests"."status" = 'accepted' AND "usage_requests"."rejection_scope" IS NULL AND "usage_requests"."rejection_rule" IS NULL)
        OR ("usage_requests"."status" = 'rejected' AND "usage_requests"."rejection_scope" IS NOT NULL AND "usage_requests"."rejection_rule" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "user_usage_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"used_units" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_usage_units_nonnegative" CHECK ("user_usage_periods"."used_units" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"plan_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"external_id" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_usage_periods" ADD CONSTRAINT "account_usage_periods_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_requests" ADD CONSTRAINT "usage_requests_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_requests" ADD CONSTRAINT "usage_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_usage_periods" ADD CONSTRAINT "user_usage_periods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_usage_period_unique" ON "account_usage_periods" USING btree ("account_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_owner_scope_name_unique" ON "plans" USING btree ("account_id","scope","name");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_request_idempotency_unique" ON "usage_requests" USING btree ("account_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "usage_requests_account_created_idx" ON "usage_requests" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_requests_user_created_idx" ON "usage_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_usage_period_unique" ON "user_usage_periods" USING btree ("user_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "users_account_external_unique" ON "users" USING btree ("account_id","external_id");