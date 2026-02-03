/**
 * Check crm_activity_log table structure
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkTableStructure() {
  try {
    console.log('🔍 Checking crm_activity_log table structure...\n');

    const result = await client.execute(`
      PRAGMA table_info(crm_activity_log)
    `);

    console.log('📋 Columns in crm_activity_log:\n');
    result.rows.forEach(col => {
      console.log(`   ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTableStructure();
