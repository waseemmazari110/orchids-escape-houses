# Plan Purchases Table - Manual Creation Guide

The safest way to add the `plan_purchases` table without risking data loss is to run the SQL manually.

## Option 1: Using Turso CLI

```bash
# Install Turso CLI if you haven't
# Visit https://docs.turso.tech/cli/introduction

# Connect to your database
turso db shell <your-database-name>

# Then paste this SQL:
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
```

## Option 2: Using Turso Dashboard

1. Go to https://turso.tech/app
2. Select your database
3. Go to SQL Console
4. Paste the SQL above
5. Click Run

## Option 3: Using Node Script (Recommended - Easiest)

Run this command:
```powershell
node create-plan-table-safe.js
```

This script will safely create the table using your existing Turso connection.

## Verify the table was created:

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='plan_purchases';
```

You should see `plan_purchases` in the result.
