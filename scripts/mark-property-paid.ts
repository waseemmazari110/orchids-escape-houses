/**
 * Utility script to mark a property's payment status as 'paid'
 * Useful for development/testing when webhooks aren't set up
 * or payment flow needs to be bypassed.
 * 
 * Usage: tsx scripts/mark-property-paid.ts <propertyId>
 */

import { db } from '../src/db';
import { properties } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function markPropertyPaid(propertyId: number) {
  try {
    console.log(`🔍 Looking for property ${propertyId}...`);

    // Get the property first
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property) {
      console.error(`❌ Property ${propertyId} not found`);
      process.exit(1);
    }

    console.log(`📝 Property found: ${property.title}`);
    console.log(`   Status: ${property.status}`);
    console.log(`   Payment Status: ${property.paymentStatus}`);

    if (property.paymentStatus === 'paid') {
      console.log(`✅ Property ${propertyId} payment is already marked as paid`);
      return;
    }

    // Update payment status
    const now = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await db
      .update(properties)
      .set({
        paymentStatus: 'paid',
        planPurchasedAt: property.planPurchasedAt || now,
        planExpiresAt: property.planExpiresAt || expiresAt.toISOString(),
        updatedAt: now,
      })
      .where(eq(properties.id, propertyId));

    console.log(`✅ Property ${propertyId} payment status updated to 'paid'`);
    console.log(`   Plan expires: ${property.planExpiresAt || expiresAt.toISOString()}`);
    console.log(`\n📌 Property can now be approved by admin`);
  } catch (error) {
    console.error('❌ Error updating property:', error);
    process.exit(1);
  }
}

// Get property ID from command line arguments
const propertyId = parseInt(process.argv[2]);

if (!propertyId || isNaN(propertyId)) {
  console.error('❌ Please provide a valid property ID');
  console.log('Usage: tsx scripts/mark-property-paid.ts <propertyId>');
  process.exit(1);
}

markPropertyPaid(propertyId).then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
});
