// Sync Existing Owners to CRM
// Run this to sync all existing owner users to crm_contacts table

import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import crypto from 'crypto';

config({ path: '.env.local' });

const db = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function syncExistingOwners() {
  console.log('\n🔄 Syncing existing owners to CRM...\n');
  
  try {
    // Get all users with role = 'owner'
    const result = await db.execute(
      "SELECT id, name, email, phone, company_name FROM user WHERE role = 'owner'"
    );
    
    console.log(`📊 Found ${result.rows.length} owner users\n`);
    
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const owner of result.rows) {
      try {
        // Check if already in CRM
        const existingContact = await db.execute({
          sql: 'SELECT id FROM crm_contacts WHERE user_id = ?',
          args: [owner.id]
        });
        
        if (existingContact.rows.length > 0) {
          console.log(`⏭️  Skipped: ${owner.email} (already in CRM)`);
          skippedCount++;
          continue;
        }
        
        // Parse name
        const nameParts = (owner.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Create CRM contact
        const contactId = crypto.randomUUID();
        await db.execute({
          sql: `INSERT INTO crm_contacts (
            id, type, first_name, last_name, email, phone, 
            business_name, status, user_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            contactId,
            'owner',
            firstName,
            lastName,
            owner.email,
            owner.phone || null,
            owner.company_name || null,
            'active',
            owner.id,
            new Date().toISOString(),
            new Date().toISOString()
          ]
        });
        
        // Log activity
        try {
          await db.execute({
            sql: `INSERT INTO crm_activity_log (
              id, entity_type, entity_id, activity_type, description, 
              performed_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              crypto.randomUUID(),
              'contact',
              contactId,
              'created',
              'Owner synced from existing user',
              'system',
              new Date().toISOString()
            ]
          });
        } catch (logErr) {
          // Non-critical, continue
        }
        
        console.log(`✅ Synced: ${owner.email} → CRM contact ${contactId}`);
        syncedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to sync ${owner.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n========================================');
    console.log('  Results');
    console.log('========================================\n');
    console.log(`✅ Synced: ${syncedCount} owners`);
    console.log(`⏭️  Skipped: ${skippedCount} (already in CRM)`);
    console.log(`❌ Errors: ${errorCount}\n`);
    
    if (syncedCount > 0) {
      console.log('✅ Existing owners synced to CRM successfully!\n');
    } else if (skippedCount > 0) {
      console.log('ℹ️  All owners already in CRM - nothing to sync.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

syncExistingOwners().catch(console.error);
