// Quick query to verify owners in CRM
import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const db = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkOwners() {
  console.log('\n📊 Owners in CRM:\n');
  
  const result = await db.execute(
    "SELECT id, first_name, last_name, email, business_name, status, created_at FROM crm_contacts WHERE type = 'owner' ORDER BY created_at DESC LIMIT 20"
  );
  
  console.log(`Total owners: ${result.rows.length}\n`);
  
  result.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.first_name} ${row.last_name}`);
    console.log(`   Email: ${row.email}`);
    console.log(`   Status: ${row.status}`);
    console.log(`   Company: ${row.business_name || 'N/A'}`);
    console.log(`   Created: ${row.created_at}\n`);
  });
}

checkOwners().catch(console.error);
