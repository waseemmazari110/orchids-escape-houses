import 'dotenv/config';
import { db } from './src/db';
import { properties } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function markAllPendingPropertiesAsPaid() {
  try {
    console.log('Marking all pending_approval properties as paid...\n');
    
    // Get all pending properties
    const pendingProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.status, 'pending_approval'));
    
    console.log(`Found ${pendingProperties.length} pending properties\n`);
    
    // Update each one
    for (const prop of pendingProperties) {
      console.log(`Updating: ${prop.title} (ID: ${prop.id})`);
      
      await db
        .update(properties)
        .set({ 
          paymentStatus: 'paid',
          planId: prop.planId || 'bronze'
        })
        .where(eq(properties.id, prop.id));
    }
    
    console.log('\n✅ All pending properties marked as paid!');
    
    // Show summary
    console.log('\nUpdated properties:');
    for (const prop of pendingProperties) {
      console.log(`  - ${prop.title} (ID: ${prop.id})`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

markAllPendingPropertiesAsPaid();
