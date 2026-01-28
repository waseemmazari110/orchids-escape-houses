/**
 * Fix all pending properties that need payment status updated
 * This is useful for development when webhooks aren't configured
 * or properties were created before the payment system was fully set up
 * 
 * Usage: tsx scripts/fix-pending-payments.ts
 */

import { db } from '../src/db';
import { properties } from '../drizzle/schema';
import { sql, eq } from 'drizzle-orm';

async function fixPendingPayments() {
  try {
    console.log('🔍 Finding properties with pending approval but unpaid status...\n');

    // Get all properties that are pending_approval but not paid
    const pendingProperties = await db.run(sql`
      SELECT 
        id, 
        title, 
        status, 
        payment_status as paymentStatus,
        plan_id as planId,
        owner_id as ownerId
      FROM properties 
      WHERE status = 'pending_approval' 
        AND (payment_status IS NULL OR payment_status != 'paid')
    `);

    if (!pendingProperties.rows || pendingProperties.rows.length === 0) {
      console.log('✅ No properties need payment status updates');
      return;
    }

    console.log(`📋 Found ${pendingProperties.rows.length} properties:\n`);
    
    pendingProperties.rows.forEach((prop: any) => {
      console.log(`   ${prop.id}. ${prop.title}`);
      console.log(`      Status: ${prop.status}, Payment: ${prop.paymentStatus || 'NULL'}`);
      console.log(`      Plan: ${prop.planId || 'None'}`);
      console.log('');
    });

    console.log('💳 Updating payment status to "paid"...\n');

    const now = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Update all at once
    const result = await db.run(sql`
      UPDATE properties 
      SET 
        payment_status = 'paid',
        plan_purchased_at = COALESCE(plan_purchased_at, ${now}),
        plan_expires_at = COALESCE(plan_expires_at, ${expiresAt.toISOString()}),
        updated_at = ${now}
      WHERE status = 'pending_approval' 
        AND (payment_status IS NULL OR payment_status != 'paid')
    `);

    console.log(`✅ Updated ${pendingProperties.rows.length} properties`);
    console.log(`   Payment status: paid`);
    console.log(`   Plan expires: ${expiresAt.toISOString()}`);
    console.log(`\n📌 These properties can now be approved by admin`);
    
  } catch (error) {
    console.error('❌ Error fixing payments:', error);
    process.exit(1);
  }
}

fixPendingPayments().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
});
