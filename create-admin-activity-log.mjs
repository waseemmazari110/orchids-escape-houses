/**
 * Create admin_activity_log table
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createAdminActivityLogTable() {
  try {
    console.log('🔧 Creating admin_activity_log table...\n');

    // Check if table already exists
    const checkResult = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='admin_activity_log'
    `);

    if (checkResult.rows.length > 0) {
      console.log('⚠️  Table admin_activity_log already exists');
      const overwrite = 'no'; // Safety check
      if (overwrite.toLowerCase() !== 'yes') {
        console.log('Skipping creation.');
        return;
      }
    }

    // Create admin_activity_log table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS admin_activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id TEXT NOT NULL REFERENCES user(id),
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        details TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL
      )
    `);

    console.log('✅ Table admin_activity_log created');

    // Create indexes for better performance
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id 
      ON admin_activity_log(admin_id)
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at 
      ON admin_activity_log(created_at)
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_admin_activity_entity 
      ON admin_activity_log(entity_type, entity_id)
    `);

    console.log('✅ Indexes created');

    // Verify table
    const verifyResult = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='admin_activity_log'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('\n✅ Verification: admin_activity_log table exists');
      
      // Show table structure
      const structureResult = await client.execute(`
        PRAGMA table_info(admin_activity_log)
      `);

      console.log('\n📋 Table structure:');
      structureResult.rows.forEach(col => {
        console.log(`   ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
      });
    }

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAdminActivityLogTable();
