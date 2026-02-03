/**
 * Check latest owner in CRM
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkLatestOwner() {
  try {
    console.log('🔍 Checking latest owner in CRM...\n');

    const result = await client.execute(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        business_name,
        status,
        created_at
      FROM crm_contacts
      WHERE type = 'owner'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ No owners found in CRM');
      return;
    }

    const owner = result.rows[0];
    console.log('✅ Latest owner in CRM:');
    console.log('   Email:', owner.email);
    console.log('   Name:', `${owner.first_name} ${owner.last_name}`);
    console.log('   Company:', owner.business_name || '(none)');
    console.log('   Status:', owner.status);
    console.log('   Created:', owner.created_at);
    console.log('   ID:', owner.id);

    // Count total owners
    const countResult = await client.execute(`
      SELECT COUNT(*) as count FROM crm_contacts WHERE type = 'owner'
    `);
    
    console.log('\n📊 Total owners in CRM:', countResult.rows[0].count);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkLatestOwner();
