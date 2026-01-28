/**
 * Migration Script: Add Property Plan Fields
 * Run with: npx tsx drizzle/run-property-plan-migration.ts
 */

import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('📦 Starting property plan migration...');

  try {
    // Add plan_id column
    console.log('Adding plan_id column...');
    await db.run(sql`ALTER TABLE properties ADD COLUMN plan_id TEXT`);

    // Add payment_status column
    console.log('Adding payment_status column...');
    await db.run(sql`ALTER TABLE properties ADD COLUMN payment_status TEXT DEFAULT 'pending'`);

    // Add stripe_payment_intent_id column
    console.log('Adding stripe_payment_intent_id column...');
    await db.run(sql`ALTER TABLE properties ADD COLUMN stripe_payment_intent_id TEXT`);

    // Add plan_purchased_at column
    console.log('Adding plan_purchased_at column...');
    await db.run(sql`ALTER TABLE properties ADD COLUMN plan_purchased_at TEXT`);

    // Add plan_expires_at column
    console.log('Adding plan_expires_at column...');
    await db.run(sql`ALTER TABLE properties ADD COLUMN plan_expires_at TEXT`);

    console.log('✅ Migration completed successfully!');
    console.log('✅ Added fields: plan_id, payment_status, stripe_payment_intent_id, plan_purchased_at, plan_expires_at');
  } catch (error: any) {
    // If columns already exist, that's okay
    if (error.message && error.message.includes('duplicate column name')) {
      console.log('ℹ️  Columns already exist, skipping migration');
      return;
    }
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrate()
  .then(() => {
    console.log('✅ Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  });
