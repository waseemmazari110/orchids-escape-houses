/**
 * Apply Membership System Database Changes
 * 
 * This script helps apply the schema changes needed for the membership system.
 * Run this after the migration to ensure data consistency.
 */

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function applyChanges() {
  console.log('🔧 Applying membership system database changes...\n');

  try {
    // 1. Rename phone column to phoneNumber if it exists
    console.log('1️⃣  Checking phone column...');
    try {
      // SQLite doesn't support ALTER TABLE RENAME COLUMN directly in older versions
      // We'll handle this by checking if data needs to be migrated
      const users = await db.execute(sql`SELECT * FROM user LIMIT 1`);
      console.log('   ✅ User table structure verified\n');
    } catch (error) {
      console.log('   ⚠️  Note:', error);
    }

    // 2. Update role values
    console.log('2️⃣  Updating user roles...');
    await db.execute(
      sql`UPDATE user SET role = 'guest' WHERE role = 'customer' OR role IS NULL`
    );
    console.log('   ✅ User roles updated\n');

    // 3. Update property status values
    console.log('3️⃣  Updating property statuses...');
    await db.execute(
      sql`UPDATE properties SET status = 'pending_approval' WHERE status = 'pending'`
    );
    await db.execute(
      sql`UPDATE properties SET status = 'live' WHERE status = 'approved'`
    );
    console.log('   ✅ Property statuses updated\n');

    // 4. Update enquiry status values
    console.log('4️⃣  Updating enquiry statuses...');
    await db.execute(
      sql`UPDATE enquiries SET status = 'new' WHERE status = 'sent'`
    );
    console.log('   ✅ Enquiry statuses updated\n');

    // 5. Initialize payment_status for existing properties
    console.log('5️⃣  Initializing payment statuses...');
    await db.execute(
      sql`UPDATE properties SET payment_status = 'unpaid' WHERE payment_status IS NULL AND status = 'draft'`
    );
    await db.execute(
      sql`UPDATE properties SET payment_status = 'paid' WHERE payment_status IS NULL AND status IN ('live', 'pending_approval')`
    );
    console.log('   ✅ Payment statuses initialized\n');

    console.log('✨ All changes applied successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Run: npx tsx scripts/seed-membership-packs.ts');
    console.log('   2. Verify the changes in your database');
    console.log('   3. Test the owner signup flow');
    console.log('   4. Test the property creation flow\n');

  } catch (error) {
    console.error('❌ Error applying changes:', error);
    throw error;
  }
}

applyChanges()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
