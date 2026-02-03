/**
 * Add 2 more memberships for test_owner's 3 payments
 * (They already have 1 Silver, adding 2 more)
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addMissingMemberships() {
  try {
    console.log('💼 Adding missing memberships for 3 payments...\n');

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
    
    // Check existing memberships
    const existing = await client.execute({
      sql: `SELECT COUNT(*) as count FROM crm_memberships WHERE contact_id = ?`,
      args: [contactId],
    });

    const existingCount = Number(existing.rows[0].count);
    console.log(`Current memberships: ${existingCount}`);
    console.log('Target: 3 memberships (one for each payment)\n');

    if (existingCount >= 3) {
      console.log('✅ Already have 3 or more memberships');
      return;
    }

    const membershipsToAdd = 3 - existingCount;
    console.log(`Adding ${membershipsToAdd} more membership(s)...\n`);

    // Note: In reality, you can only have 1 active membership per user
    // This is for demonstration - you'd normally UPDATE existing membership
    // or track payment history separately

    // Let's instead UPDATE the existing membership to reflect latest payment
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    await client.execute({
      sql: `
        UPDATE crm_memberships
        SET 
          last_payment_date = ?,
          last_payment_amount = ?,
          updated_at = ?
        WHERE contact_id = ?
      `,
      args: [
        startDate,
        750,
        startDate,
        contactId,
      ],
    });

    console.log('✅ Updated membership with latest payment info');
    console.log('   Last payment: £750');
    console.log('   Payment date:', startDate.substring(0, 10));
    
    console.log('\n📝 Note: In a real system, you would:');
    console.log('   1. Track payment history in separate table');
    console.log('   2. Update membership expiry date with each payment');
    console.log('   3. Only have ONE active membership per user');
    console.log('\n   Multiple memberships would require a payment_history table.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMissingMemberships();
