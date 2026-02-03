/**
 * Quick membership add tool
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addMembership() {
  try {
    // Get test_owner contact
    const ownerResult = await client.execute({
      sql: `SELECT id, email FROM crm_contacts WHERE email = ?`,
      args: ['test_owner@gmail.com'],
    });

    if (ownerResult.rows.length === 0) {
      console.log('❌ test_owner@gmail.com not found in CRM');
      return;
    }

    const contactId = ownerResult.rows[0].id;
    console.log(`✅ Found owner: test_owner@gmail.com (${contactId})`);

    // Check existing membership
    const existing = await client.execute({
      sql: `SELECT id FROM crm_memberships WHERE contact_id = ?`,
      args: [contactId],
    });

    if (existing.rows.length > 0) {
      console.log('⚠️  Membership already exists. Deleting...');
      await client.execute({
        sql: `DELETE FROM crm_memberships WHERE contact_id = ?`,
        args: [contactId],
      });
    }

    // Add Silver plan membership
    const membershipId = crypto.randomUUID();
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    await client.execute({
      sql: `
        INSERT INTO crm_memberships (
          id, contact_id, plan_tier, plan_price, billing_cycle,
          start_date, end_date, renewal_date, status, auto_renew,
          last_payment_date, last_payment_amount, next_payment_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        membershipId,
        contactId,
        'silver',
        750,
        'annual',
        startDate,
        endDate.toISOString(),
        endDate.toISOString(),
        'active',
        1,
        startDate,
        750,
        endDate.toISOString(),
        startDate,
        startDate,
      ],
    });

    console.log('\n✅ Membership created successfully!');
    console.log('   Owner: test_owner@gmail.com');
    console.log('   Plan: Silver - £750/year');
    console.log('   Valid until:', endDate.toISOString().substring(0, 10));
    console.log('   Membership ID:', membershipId);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMembership();
