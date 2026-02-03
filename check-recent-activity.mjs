/**
 * Check recent database activity
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkRecentActivity() {
  try {
    console.log('🔍 Checking recent activity...\n');

    // Check recent properties
    console.log('📋 Recent Properties (last 5):');
    const propsResult = await client.execute(`
      SELECT 
        p.id,
        p.title,
        p.status,
        p.plan_id,
        p.payment_status,
        p.created_at,
        u.email as owner_email
      FROM properties p
      LEFT JOIN user u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    if (propsResult.rows.length === 0) {
      console.log('   No properties found\n');
    } else {
      propsResult.rows.forEach(row => {
        console.log(`   ${row.id}. ${row.title}`);
        console.log(`      Owner: ${row.owner_email}`);
        console.log(`      Status: ${row.status}`);
        console.log(`      Plan: ${row.plan_id || 'none'}`);
        console.log(`      Payment: ${row.payment_status || 'none'}`);
        console.log(`      Created: ${row.created_at?.substring(0, 19)}\n`);
      });
    }

    // Check CRM properties
    console.log('🏠 CRM Properties:');
    const crmPropsResult = await client.execute(`
      SELECT 
        cp.id,
        cp.title,
        cp.property_id,
        cp.listing_status,
        cp.created_at
      FROM crm_properties cp
      ORDER BY cp.created_at DESC
      LIMIT 5
    `);

    if (crmPropsResult.rows.length === 0) {
      console.log('   No properties in CRM\n');
    } else {
      crmPropsResult.rows.forEach(row => {
        console.log(`   ${row.title} (ID: ${row.property_id})`);
        console.log(`      Status: ${row.listing_status}`);
        console.log(`      Created: ${row.created_at?.substring(0, 19)}\n`);
      });
    }

    // Check CRM memberships
    console.log('💼 CRM Memberships:');
    const membershipsResult = await client.execute(`
      SELECT 
        m.id,
        m.plan_tier,
        m.plan_price,
        m.status,
        m.created_at,
        c.email as owner_email
      FROM crm_memberships m
      LEFT JOIN crm_contacts c ON m.contact_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 5
    `);

    if (membershipsResult.rows.length === 0) {
      console.log('   No memberships in CRM\n');
    } else {
      membershipsResult.rows.forEach(row => {
        console.log(`   ${row.owner_email}: ${row.plan_tier} - £${row.plan_price}`);
        console.log(`      Status: ${row.status}`);
        console.log(`      Created: ${row.created_at?.substring(0, 19)}\n`);
      });
    }

    // Check webhook logs (if any)
    console.log('🔔 Recent Stripe Payment Intents:');
    const paymentsResult = await client.execute(`
      SELECT 
        p.id,
        p.title,
        p.stripe_payment_intent_id,
        p.plan_purchased_at
      FROM properties p
      WHERE p.stripe_payment_intent_id IS NOT NULL
      ORDER BY p.plan_purchased_at DESC
      LIMIT 5
    `);

    if (paymentsResult.rows.length === 0) {
      console.log('   No payment intents found\n');
    } else {
      paymentsResult.rows.forEach(row => {
        console.log(`   ${row.title}`);
        console.log(`      Payment Intent: ${row.stripe_payment_intent_id}`);
        console.log(`      Purchased: ${row.plan_purchased_at?.substring(0, 19)}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRecentActivity();
