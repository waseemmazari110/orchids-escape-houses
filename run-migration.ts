import 'dotenv/config';
import { db } from './src/db/index';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  try {
    console.log('📝 Reading migration file...');
    const migrationSQL = readFileSync(
      join(process.cwd(), 'drizzle', '0012_fix_crm_enquiries.sql'),
      'utf-8'
    );

    console.log('🔄 Applying migration...');
    console.log(migrationSQL);
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`\n⚡ Executing: ${statement.substring(0, 50)}...`);
      await db.run(sql.raw(statement));
      console.log('✅ Success');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n🔍 Checking table structure...');
    
    const tableInfo = await db.all(sql`PRAGMA table_info(crm_enquiries)`);
    console.log('\n📊 crm_enquiries columns:');
    tableInfo.forEach((col: any) => {
      console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
