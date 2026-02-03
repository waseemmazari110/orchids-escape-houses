/**
 * Check latest property and sync it
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function syncLatestProperty() {
  try {
    console.log('🔍 Checking latest property...\n');

    // Get the latest property
    const propResult = await client.execute(`
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.owner_id,
        p.location,
        p.bedrooms,
        p.bathrooms,
        p.sleeps_max,
        p.price_from_weekend,
        p.status,
        p.created_at
      FROM properties p
      WHERE p.id = 68
      LIMIT 1
    `);

    if (propResult.rows.length === 0) {
      console.log('❌ Property ID 68 not found');
      return;
    }

    const prop = propResult.rows[0];
    console.log('📋 Property Found:');
    console.log('   ID:', prop.id);
    console.log('   Title:', prop.title);
    console.log('   Status:', prop.status);
    console.log('   Owner ID:', prop.owner_id);

    // Get owner's CRM contact
    const ownerResult = await client.execute({
      sql: `SELECT id, email FROM crm_contacts WHERE user_id = ?`,
      args: [prop.owner_id],
    });

    if (ownerResult.rows.length === 0) {
      console.log('\n❌ Owner not found in CRM');
      return;
    }

    const ownerId = ownerResult.rows[0].id;
    console.log('   Owner CRM ID:', ownerId);
    console.log('   Owner Email:', ownerResult.rows[0].email);

    // Check if already in CRM
    const existingResult = await client.execute({
      sql: `SELECT id FROM crm_properties WHERE property_id = ?`,
      args: [prop.id],
    });

    if (existingResult.rows.length > 0) {
      console.log('\n⚠️  Property already in CRM');
      return;
    }

    // Map status
    let listingStatus = 'draft';
    if (prop.status === 'live' || prop.status === 'published') {
      listingStatus = 'live';
    } else if (prop.status === 'pending_approval') {
      listingStatus = 'pending_approval';
    } else if (prop.status === 'rejected') {
      listingStatus = 'rejected';
    } else if (prop.status === 'paused') {
      listingStatus = 'paused';
    }

    // Sync to CRM
    const crmPropId = crypto.randomUUID();
    await client.execute({
      sql: `
        INSERT INTO crm_properties (
          id, owner_id, property_id, title, location, bedrooms, bathrooms,
          max_guests, price_per_night, listing_status, membership_tier,
          view_count, enquiry_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        crmPropId,
        ownerId,
        prop.id,
        prop.title,
        prop.location || '',
        prop.bedrooms || 0,
        prop.bathrooms || 0,
        prop.sleeps_max || 0,
        prop.price_from_weekend || 0,
        listingStatus,
        null,
        0,
        0,
        prop.created_at || new Date().toISOString(),
        new Date().toISOString(),
      ],
    });

    console.log('\n✅ Property synced to CRM!');
    console.log('   CRM Property ID:', crmPropId);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

syncLatestProperty();
