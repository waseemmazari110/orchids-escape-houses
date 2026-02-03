// Fix Invalid JSON in Properties Table
// This script cleans up properties that have invalid JSON in images/amenities columns

import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const db = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixInvalidJSON() {
  console.log('\n🔧 Fixing invalid JSON in properties table...\n');
  
  try {
    // Get all properties
    const result = await db.execute('SELECT id, title, images, amenities FROM properties');
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const row of result.rows) {
      let needsUpdate = false;
      let newImages = row.images;
      let newAmenities = row.amenities;
      
      // Check images column
      if (row.images) {
        try {
          // If it's already valid JSON, this won't throw
          JSON.parse(row.images);
        } catch (e) {
          console.log(`❌ Invalid images JSON for property: ${row.title}`);
          console.log(`   Current value: ${row.images}`);
          newImages = '[]'; // Set to empty array
          needsUpdate = true;
        }
      }
      
      // Check amenities column
      if (row.amenities) {
        try {
          JSON.parse(row.amenities);
        } catch (e) {
          console.log(`❌ Invalid amenities JSON for property: ${row.title}`);
          console.log(`   Current value: ${row.amenities}`);
          newAmenities = '[]'; // Set to empty array
          needsUpdate = true;
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        try {
          await db.execute({
            sql: 'UPDATE properties SET images = ?, amenities = ? WHERE id = ?',
            args: [newImages, newAmenities, row.id]
          });
          console.log(`✅ Fixed property: ${row.title}\n`);
          fixedCount++;
        } catch (error) {
          console.error(`❌ Failed to fix property ${row.title}:`, error);
          errorCount++;
        }
      }
    }
    
    console.log('\n========================================');
    console.log('  Results');
    console.log('========================================\n');
    console.log(`✅ Fixed: ${fixedCount} properties`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total properties checked: ${result.rows.length}\n`);
    
    if (fixedCount > 0) {
      console.log('✅ Invalid JSON has been cleaned up!');
      console.log('   All images/amenities columns now contain valid JSON (empty arrays)');
      console.log('   You can now populate them properly through the UI.\n');
    } else {
      console.log('✅ No invalid JSON found - all properties are OK!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixInvalidJSON().catch(console.error);
