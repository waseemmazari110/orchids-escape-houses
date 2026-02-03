/**
 * Sync existing properties to CRM
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function syncProperties() {
  try {
    console.log('🔍 Syncing existing properties to CRM...\n');

    // Get all properties with owners in CRM
    const propsResult = await client.execute(`
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
        p.is_published,
        p.plan_id,
        p.created_at,
        u.email as owner_email
      FROM properties p
      JOIN user u ON p.owner_id = u.id
      WHERE p.owner_id IS NOT NULL
      ORDER BY p.created_at DESC
    `);

    console.log(`📊 Found ${propsResult.rows.length} properties\n`);

    let synced = 0;
    let skipped = 0;

    for (const prop of propsResult.rows) {
      try {
        // Get owner's CRM contact
        const ownerResult = await client.execute({
          sql: `SELECT id FROM crm_contacts WHERE user_id = ?`,
          args: [prop.owner_id],
        });

        if (ownerResult.rows.length === 0) {
          console.log(`⏭️  Skipped: ${prop.title} - Owner not in CRM`);
          skipped++;
          continue;
        }

        const ownerId = ownerResult.rows[0].id;

        // Check if property already in CRM
        const existingResult = await client.execute({
          sql: `SELECT id FROM crm_properties WHERE property_id = ?`,
          args: [prop.id],
        });

        if (existingResult.rows.length > 0) {
          console.log(`⏭️  Already synced: ${prop.title}`);
          skipped++;
          continue;
        }

        // Map plan_id to tier
        const tierMap = { '1': 'bronze', '2': 'silver', '3': 'gold' };
        const tier = prop.plan_id ? (tierMap[prop.plan_id] || null) : null;

        // Map status to listing_status
        let listingStatus = 'draft';
        if (prop.status === 'live' || prop.status === 'published') {
          listingStatus = 'live';
        } else if (prop.status === 'pending_approval') {
          listingStatus = 'pending';
        } else if (prop.status === 'rejected') {
          listingStatus = 'inactive';
        }

        // Create CRM property
        const crmPropId = crypto.randomUUID();
        await client.execute({
          sql: `
            INSERT INTO crm_properties (
              id, owner_id, property_id, title, location, bedrooms, bathrooms,
              max_guests, price_per_night, listing_status, membership_tier,
              view_count, enquiry_count, booking_count, total_revenue,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            tier,
            0,
            0,
            0,
            0,
            prop.created_at || new Date().toISOString(),
            new Date().toISOString(),
          ],
        });

        console.log(`✅ Synced: ${prop.title} (${prop.owner_email}) → CRM`);
        synced++;
      } catch (error) {
        console.error(`❌ Error syncing ${prop.title}:`, error.message);
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Results: ✅ ${synced} synced, ⏭️  ${skipped} skipped`);
    console.log(`${'='.repeat(50)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

syncProperties();
