// CRM Tables Migration Script
// This safely creates CRM tables without touching existing ones

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const tursoUrl = process.env.TURSO_CONNECTION_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error('❌ Missing Turso credentials!');
  console.error('Please set TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN in .env.local');
  process.exit(1);
}

console.log('\n========================================');
console.log('  CRM Tables Creation for Turso');
console.log('========================================\n');

// Create Turso client
const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

async function main() {
  try {
    console.log('✅ Connected to Turso database');
    console.log('📄 Reading SQL migration file...\n');
    
    // Read SQL file
    const sqlContent = readFileSync('create_missing_crm_tables.sql', 'utf8');
    
    // Split into individual statements more carefully
    // Match CREATE TABLE and CREATE INDEX statements
    const createTableRegex = /CREATE TABLE[^;]+;/gis;
    const createIndexRegex = /CREATE INDEX[^;]+;/gis;
    
    const createTables = sqlContent.match(createTableRegex) || [];
    const createIndexes = sqlContent.match(createIndexRegex) || [];
    
    const statements = [...createTables, ...createIndexes].map(s => s.trim());
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    console.log('⚠️  This will create CRM tables in your Turso database');
    console.log('⚠️  NO existing tables will be modified\n');
    
    console.log('🚀 Creating CRM tables...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--')) continue;
      
      // Determine what this statement does
      let description = 'Executing statement';
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
        if (match) description = `Creating table: ${match[1]}`;
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/i);
        if (match) description = `Creating index: ${match[1]}`;
      }
      
      try {
        await db.execute(statement);
        console.log(`✅ ${description}`);
        successCount++;
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists')) {
          console.log(`⏭️  ${description} (already exists)`);
          successCount++;
        } else {
          console.error(`❌ ${description}`);
          console.error(`   Error: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log('\n========================================');
    console.log('  Results');
    console.log('========================================\n');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}\n`);
    
    // Verify CRM tables
    console.log('🔍 Verifying CRM tables...\n');
    const result = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'crm_%' ORDER BY name"
    );
    
    if (result.rows.length === 0) {
      console.log('⚠️  No CRM tables found!');
    } else {
      console.log('✅ CRM tables found:');
      result.rows.forEach(row => {
        console.log(`   - ${row.name}`);
      });
    }
    
    console.log('\n✨ Migration complete!\n');
    
    if (result.rows.length === 7) {
      console.log('✅ All 7 CRM tables created successfully!');
      console.log('\nNext steps:');
      console.log('1. Run: npm run dev');
      console.log('2. Test enquiry form submission');
      console.log('3. Check console for "✅ Enquiry synced to CRM"\n');
    } else {
      console.log(`⚠️  Expected 7 CRM tables, found ${result.rows.length}`);
      console.log('Please review the errors above.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  }
}

main().catch(console.error);
