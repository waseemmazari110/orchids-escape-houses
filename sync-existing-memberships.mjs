/**
 * Sync existing memberships from properties/payments to CRM
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function syncExistingMemberships() {
  try {
    console.log('🔍 Searching for paid properties with memberships...\n');

    // Find all properties with payment status 'paid'
    const propertiesResult = await client.execute(`
      SELECT 
        p.id,
        p.owner_id,
        p.plan_id,
        p.payment_status,
        p.plan_purchased_at,
        p.plan_expires_at,
        p.stripe_payment_intent_id,
        u.id as user_id,
        u.email
      FROM properties p
      JOIN user u ON p.owner_id = u.id
      WHERE p.payment_status = 'paid' AND p.plan_id IS NOT NULL
    `);

    console.log(`📊 Found ${propertiesResult.rows.length} paid properties\n`);

    if (propertiesResult.rows.length === 0) {
      console.log('No paid properties found. If you just made a payment, please check:');
      console.log('1. Is the webhook receiving events?');
      console.log('2. Check properties table: SELECT * FROM properties WHERE payment_status = "paid"');
      return;
    }

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    // Plan ID to tier mapping
    const planTierMap = {
      '1': 'bronze',
      '2': 'silver',
      '3': 'gold',
    };

    // Plan ID to price mapping
    const planPriceMap = {
      '1': 450,
      '2': 750,
      '3': 1200,
    };

    for (const row of propertiesResult.rows) {
      try {
        const userId = row.user_id;
        const email = row.email;
        const planId = row.plan_id;
        const planTier = planTierMap[planId] || 'bronze';
        const planPrice = planPriceMap[planId] || 450;

        // Check if contact exists in CRM
        const contactResult = await client.execute({
          sql: `SELECT id FROM crm_contacts WHERE user_id = ?`,
          args: [userId],
        });

        if (contactResult.rows.length === 0) {
          console.log(`⚠️  Skipped ${email} - Owner not in CRM yet`);
          skipped++;
          continue;
        }

        const contactId = contactResult.rows[0].id;

        // Check if membership already exists
        const existingMembership = await client.execute({
          sql: `SELECT id FROM crm_memberships WHERE contact_id = ?`,
          args: [contactId],
        });

        if (existingMembership.rows.length > 0) {
          console.log(`⏭️  Skipped ${email} - Membership already in CRM`);
          skipped++;
          continue;
        }

        // Create membership in CRM
        const membershipId = crypto.randomUUID();
        const startDate = row.plan_purchased_at || new Date().toISOString();
        const endDate = row.plan_expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

        await client.execute({
          sql: `
            INSERT INTO crm_memberships (
              id, contact_id, plan_tier, plan_price, billing_cycle,
              start_date, end_date, renewal_date, status, auto_renew,
              stripe_customer_id, stripe_subscription_id,
              last_payment_date, last_payment_amount, next_payment_date,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            membershipId,
            contactId,
            planTier,
            planPrice,
            'annual',
            startDate,
            endDate,
            endDate,
            'active',
            1,
            null,
            null,
            startDate,
            planPrice,
            endDate,
            new Date().toISOString(),
            new Date().toISOString(),
          ],
        });

        // Log activity
        try {
          await client.execute({
            sql: `
              INSERT INTO crm_activity_log (
                id, entity_type, entity_id, activity_type, performed_by, reason, timestamp
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
              crypto.randomUUID(),
              'membership',
              membershipId,
              'created',
              'system',
              'Synced from existing payment',
              new Date().toISOString(),
            ],
          });
        } catch (logError) {
          // Non-critical, continue
        }

        console.log(`✅ Synced: ${email} → ${planTier} plan (£${planPrice}/year)`);
        synced++;
      } catch (error) {
        console.error(`❌ Error syncing property ${row.id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Results: ✅ ${synced} synced, ⏭️  ${skipped} skipped, ❌ ${errors} errors`);
    console.log(`${'='.repeat(50)}\n`);
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

syncExistingMemberships();
