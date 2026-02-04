/**
 * Fix CRM Enquiries Table Schema
 * This script will check and fix the crm_enquiries table structure
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function fixCRMEnquiriesTable() {
  try {
    console.log('🔍 Checking crm_enquiries table structure...');
    
    // Get table info
    const tableInfo = await db.all(sql`PRAGMA table_info(crm_enquiries)`);
    
    console.log('📋 Current columns:', tableInfo);
    
    // Check if table exists
    if (tableInfo.length === 0) {
      console.log('❌ Table crm_enquiries does not exist!');
      console.log('Creating table...');
      
      // Create minimal table structure
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS crm_enquiries (
          id TEXT PRIMARY KEY,
          owner_id TEXT,
          property_id TEXT,
          status TEXT NOT NULL DEFAULT 'new',
          message TEXT,
          guest_email TEXT,
          guest_phone TEXT,
          guest_name TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (owner_id) REFERENCES crm_contacts(id) ON DELETE CASCADE,
          FOREIGN KEY (property_id) REFERENCES crm_properties(id) ON DELETE CASCADE
        )
      `);
      
      console.log('✅ Table created successfully!');
    } else {
      console.log('✅ Table exists with', tableInfo.length, 'columns');
      
      // List existing columns
      const existingColumns = tableInfo.map((col: any) => col.name);
      console.log('Existing columns:', existingColumns.join(', '));
      
      // Check for missing columns we need
      const requiredColumns = [
        'id', 'owner_id', 'property_id', 'status', 
        'message', 'guest_email', 'guest_phone', 'guest_name', 'created_at'
      ];
      
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️ Missing columns:', missingColumns.join(', '));
        console.log('Recommendation: Drop and recreate table or manually add columns');
      } else {
        console.log('✅ All required columns exist!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixCRMEnquiriesTable().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});
