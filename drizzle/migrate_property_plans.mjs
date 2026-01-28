/**
 * Run this file to apply the property plan fields migration
 * Command: node drizzle/migrate_property_plans.mjs
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(process.env.DATABASE_URL?.replace('file:', '') || './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite');

console.log('📦 Running property plan migration...');

try {
  const migration = readFileSync(join(__dirname, '0005_add_property_plan_fields.sql'), 'utf-8');
  
  db.exec(migration);
  
  console.log('✅ Migration completed successfully!');
  console.log('✅ Added fields: plan_id, payment_status, stripe_payment_intent_id, plan_purchased_at, plan_expires_at');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}

db.close();
