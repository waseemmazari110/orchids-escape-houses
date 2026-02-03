/**
 * Check payment and membership status
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkPaymentStatus() {
  try {
    console.log('🔍 Checking payment and membership status...\n');

    // Check properties table
    console.log('📋 Properties with plan information:');
    const propertiesResult = await client.execute(`
      SELECT 
        p.id,
        p.title,
        p.plan_id,
        p.payment_status,
        p.plan_purchased_at,
        p.plan_expires_at,
        u.email as owner_email
      FROM properties p
      LEFT JOIN user u ON p.owner_id = u.id
      WHERE p.plan_id IS NOT NULL
      ORDER BY p.plan_purchased_at DESC
      LIMIT 10
    `);

    if (propertiesResult.rows.length === 0) {
      console.log('   No properties with plans found.\n');
    } else {
      propertiesResult.rows.forEach(row => {
        console.log(`   ${row.id}. ${row.title}`);
        console.log(`      Owner: ${row.owner_email}`);
        console.log(`      Plan: ${row.plan_id}`);
        console.log(`      Status: ${row.payment_status || 'pending'}`);
        console.log(`      Purchased: ${row.plan_purchased_at || 'N/A'}`);
        console.log(`      Expires: ${row.plan_expires_at || 'N/A'}\n`);
      });
    }

    // Check user table for any membership-related data
    console.log('👥 Users (owners):');
    const usersResult = await client.execute(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role
      FROM user u
      WHERE u.role = 'owner'
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    usersResult.rows.forEach(row => {
      console.log(`   ${row.email} - ${row.name || '(no name)'}`);
    });

    // Check CRM memberships
    console.log('\n💼 CRM Memberships:');
    const membershipsResult = await client.execute(`
      SELECT 
        m.id,
        m.plan_tier,
        m.plan_price,
        m.status,
        m.start_date,
        m.end_date,
        c.email as owner_email
      FROM crm_memberships m
      LEFT JOIN crm_contacts c ON m.contact_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 10
    `);

    if (membershipsResult.rows.length === 0) {
      console.log('   No memberships in CRM yet.\n');
    } else {
      membershipsResult.rows.forEach(row => {
        console.log(`   ${row.owner_email}: ${row.plan_tier} - £${row.plan_price} - ${row.status}`);
        console.log(`      Valid: ${row.start_date?.substring(0, 10)} to ${row.end_date?.substring(0, 10)}\n`);
      });
    }

    // Check invoices table if it exists
    try {
      console.log('🧾 Recent Invoices/Payments:');
      const invoicesResult = await client.execute(`
        SELECT 
          i.id,
          i.status,
          i.amount,
          i.created_at,
          u.email as user_email
        FROM invoices i
        LEFT JOIN user u ON i.user_id = u.id
        ORDER BY i.created_at DESC
        LIMIT 10
      `);

      if (invoicesResult.rows.length === 0) {
        console.log('   No invoices found.\n');
      } else {
        invoicesResult.rows.forEach(row => {
          console.log(`   ${row.user_email}: £${row.amount} - ${row.status} - ${row.created_at?.substring(0, 10)}`);
        });
      }
    } catch {
      console.log('   (invoices table not found)\n');
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log(`Properties with plans: ${propertiesResult.rows.length}`);
    console.log(`CRM Memberships: ${membershipsResult.rows.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPaymentStatus();
