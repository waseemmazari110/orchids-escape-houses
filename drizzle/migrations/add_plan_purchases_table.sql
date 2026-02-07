-- Add plan_purchases table to track purchased plans before property creation
CREATE TABLE IF NOT EXISTS "plan_purchases" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"amount" real NOT NULL,
	"purchased_at" text NOT NULL,
	"expires_at" text NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"property_id" integer,
	"used_at" text,
	"created_at" text NOT NULL,
	FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade,
	FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE set null
);

CREATE INDEX IF NOT EXISTS "plan_purchases_user_id_idx" ON "plan_purchases" ("user_id");
CREATE INDEX IF NOT EXISTS "plan_purchases_used_idx" ON "plan_purchases" ("used");
