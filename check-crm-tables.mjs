// Check existing CRM tables in Turso
import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const db = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('\n📊 Checking existing CRM tables...\n');
  
  // Get all CRM-related tables
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'crm_%' OR name LIKE '%crm%') ORDER BY name"
  );
  
  console.log(`Found ${tables.rows.length} CRM-related tables:\n`);
  
  for (const table of tables.rows) {
    const tableName = table.name;
    console.log(`\n📋 Table: ${tableName}`);
    console.log('─'.repeat(50));
    
    try {
      // Get table schema
      const schema = await db.execute(`PRAGMA table_info(${tableName})`);
      
      console.log('Columns:');
      schema.rows.forEach(col => {
        console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
      });
      
      // Get row count
      const count = await db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`\nRows: ${count.rows[0].count}`);
      
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
  
  console.log('\n\n✅ Analysis complete\n');
}

main().catch(console.error);
