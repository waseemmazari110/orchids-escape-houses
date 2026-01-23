import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function addRejectionReasonColumn() {
  try {
    console.log('Adding rejection_reason column to properties table...');
    
    await db.run(sql`ALTER TABLE properties ADD COLUMN rejection_reason TEXT`);
    
    console.log('✅ Column added successfully!');
  } catch (error) {
    console.error('Error adding column:', error);
  }
}

addRejectionReasonColumn();
