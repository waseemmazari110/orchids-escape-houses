/**
 * Verify all required tables exist
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function verifyAllTables() {
  try {
    console.log('🔍 Verifying all required tables...\n');

    const requiredTables = [
      'user',
      'session',
      'account',
      'verification',
      'properties',
      'admin_activity_log',
      'crm_contacts',
      'crm_properties',
      'crm_enquiries',
      'crm_memberships',
      'crm_interactions',
      'crm_activity_log',
      'crm_segments',
      'crm_notes',
      'crm_owner_profiles',
      'crm_property_links',
    ];

    const allTablesResult = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table'
      ORDER BY name
    `);

    const existingTables = allTablesResult.rows.map(row => row.name);

    console.log('📊 Table Status:\n');

    let missingCount = 0;
    requiredTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
      if (!exists) missingCount++;
    });

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Total: ${requiredTables.length} required, ${requiredTables.length - missingCount} exist, ${missingCount} missing`);
    console.log(`${'='.repeat(50)}`);

    if (missingCount > 0) {
      console.log('\n⚠️  Some tables are missing. You may encounter errors.');
    } else {
      console.log('\n✅ All required tables exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyAllTables();
