# Property Plan Migration - Manual Steps

Since automatic migration failed, please run these SQL statements directly in your Turso database.

## Option 1: Using Turso CLI

```bash
# Connect to your Turso database
turso db shell your-database-name

# Run these commands one by one:
ALTER TABLE properties ADD COLUMN plan_id TEXT;
ALTER TABLE properties ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE properties ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE properties ADD COLUMN plan_purchased_at TEXT;
ALTER TABLE properties ADD COLUMN plan_expires_at TEXT;
```

## Option 2: Using Turso Dashboard

1. Go to https://turso.tech/app
2. Select your database
3. Click on "SQL Console"
4. Copy and paste each line below, running them one at a time:

```sql
ALTER TABLE properties ADD COLUMN plan_id TEXT;
ALTER TABLE properties ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE properties ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE properties ADD COLUMN plan_purchased_at TEXT;
ALTER TABLE properties ADD COLUMN plan_expires_at TEXT;
```

## Option 3: Run Migration via API Endpoint

I can create an admin API endpoint that runs the migration. Let me know if you'd like this approach.

## Verify Migration

After running, verify with:

```sql
PRAGMA table_info(properties);
```

You should see the new columns:
- plan_id
- payment_status
- stripe_payment_intent_id
- plan_purchased_at
- plan_expires_at

## Alternative: Skip Migration (Testing Only)

If you want to test the flow without the migration:
1. The system will still work but won't track plan details
2. Properties will be created without plan information
3. Payment status won't be validated

## Next Steps

After migration is complete:
1. Configure Stripe webhook: `/api/webhooks/stripe-property`
2. Test property creation flow
3. Verify payment captures plan information
