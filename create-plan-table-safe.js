// Safe script to create plan_purchases table using existing Turso connection
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

async function createTable() {
  console.log('Connecting to Turso database...');
  
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('Creating plan_purchases table...\n');
    
    // Create table
    await client.execute(`
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
      )
    `);
    console.log('✅ Table created!');
    
    // Create indexes
    await client.execute(`
      CREATE INDEX IF NOT EXISTS "plan_purchases_user_id_idx" ON "plan_purchases" ("user_id")
    `);
    console.log('✅ Index on user_id created!');
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS "plan_purchases_used_idx" ON "plan_purchases" ("used")
    `);
    console.log('✅ Index on used created!');
    
    // Verify
    const result = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='plan_purchases'
    `);
    
    if (result.rows.length > 0) {
      console.log('\n🎉 SUCCESS! plan_purchases table is ready to use.\n');
    } else {
      console.log('\n⚠️  Table verification failed. Please check manually.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nIf the table already exists, this is normal. Otherwise, please run the SQL manually.');
    console.log('See PLAN_PURCHASES_MIGRATION_GUIDE.md for instructions.\n');
  } finally {
    await client.close();
  }
}

createTable();
