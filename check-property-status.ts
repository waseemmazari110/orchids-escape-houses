import 'dotenv/config';
import { db } from './src/db';
import { properties } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function checkPropertyStatus() {
  try {
    console.log('Checking property 63 status...\n');
    
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.id, 63));

    if (result.length > 0) {
      const prop = result[0];
      console.log('Property Details:');
      console.log('- ID:', prop.id);
      console.log('- Title:', prop.title);
      console.log('- Slug:', prop.slug);
      console.log('- Status:', prop.status);
      console.log('- isPublished:', prop.isPublished);
      console.log('- paymentStatus:', prop.paymentStatus);
      console.log('- planId:', prop.planId);
      console.log('- approvedBy:', prop.approvedBy);
      console.log('- approvedAt:', prop.approvedAt);
      console.log('\n✅ Property found');
      
      if (prop.status !== 'live') {
        console.log('⚠️  Status is not "live"');
      }
      if (!prop.isPublished) {
        console.log('⚠️  isPublished is false or 0');
      }
    } else {
      console.log('❌ Property not found');
    }
    
    // Check all published properties
    console.log('\n--- All Published Properties ---');
    const published = await db
      .select()
      .from(properties)
      .where(eq(properties.isPublished, true));
    
    console.log(`Found ${published.length} published properties:`);
    published.forEach(p => {
      console.log(`  - ID ${p.id}: ${p.title} (status: ${p.status})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPropertyStatus();
