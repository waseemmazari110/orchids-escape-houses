/**
 * Manual membership sync tool
 * Use this to manually add a membership to CRM
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function manualMembershipSync() {
  try {
    console.log('🔧 Manual Membership Sync Tool\n');
    console.log('This tool will help you manually add a membership to CRM\n');

    // Get list of owners in CRM
    const ownersResult = await client.execute(`
      SELECT 
        c.id,
        c.email,
        c.first_name,
        c.last_name,
        c.business_name
      FROM crm_contacts c
      WHERE c.type = 'owner'
      ORDER BY c.created_at DESC
    `);

    if (ownersResult.rows.length === 0) {
      console.log('❌ No owners found in CRM. Please register an owner first.');
      rl.close();
      return;
    }

    console.log('Available owners in CRM:');
    ownersResult.rows.forEach((owner, index) => {
      console.log(`   ${index + 1}. ${owner.email} - ${owner.first_name} ${owner.last_name} (${owner.business_name || 'No company'})`);
    });
    console.log('');

    const ownerIndex = await question('Select owner number: ');
    const selectedOwner = ownersResult.rows[parseInt(ownerIndex) - 1];

    if (!selectedOwner) {
      console.log('❌ Invalid selection');
      rl.close();
      return;
    }

    console.log('\nPlan tiers:');
    console.log('   1. Bronze - £450/year');
    console.log('   2. Silver - £750/year');
    console.log('   3. Gold - £1200/year\n');

    const planChoice = await question('Select plan (1-3): ');
    
    const planMap = {
      '1': { tier: 'bronze', price: 450 },
      '2': { tier: 'silver', price: 750 },
      '3': { tier: 'gold', price: 1200 },
    };

    const plan = planMap[planChoice];
    if (!plan) {
      console.log('❌ Invalid plan selection');
      rl.close();
      return;
    }

    // Check if membership already exists
    const existingResult = await client.execute({
      sql: `SELECT id FROM crm_memberships WHERE contact_id = ?`,
      args: [selectedOwner.id],
    });

    if (existingResult.rows.length > 0) {
      const overwrite = await question('\n⚠️  Membership already exists. Overwrite? (yes/no): ');
      if (overwrite.toLowerCase() !== 'yes') {
        console.log('Cancelled.');
        rl.close();
        return;
      }

      await client.execute({
        sql: `DELETE FROM crm_memberships WHERE contact_id = ?`,
        args: [selectedOwner.id],
      });
    }

    // Create membership
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
        selectedOwner.id,
        plan.tier,
        plan.price,
        'annual',
        startDate,
        endDate.toISOString(),
        endDate.toISOString(),
        'active',
        1,
        startDate,
        plan.price,
        endDate.toISOString(),
        startDate,
        startDate,
      ],
    });

    // Log activity
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
        'admin',
        'Manual membership sync',
        new Date().toISOString(),
      ],
    });

    console.log('\n✅ Membership created successfully!');
    console.log(`   Owner: ${selectedOwner.email}`);
    console.log(`   Plan: ${plan.tier} - £${plan.price}/year`);
    console.log(`   Valid until: ${endDate.toISOString().substring(0, 10)}`);
    console.log(`   Membership ID: ${membershipId}\n`);

    // Verify
    const verifyResult = await client.execute(`
      SELECT * FROM crm_memberships WHERE id = '${membershipId}'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Verified: Membership exists in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
  }
}

manualMembershipSync();
