import 'dotenv/config';
import { db } from './src/db';
import { properties } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function markPropertyAsPaid() {
  try {
    console.log('Marking property ID 63 as paid...');
    
    const result = await db
      .update(properties)
      .set({ 
        paymentStatus: 'paid',
        planId: 'bronze' // Set to bronze if not already set
      })
      .where(eq(properties.id, 63))
      .returning();

    if (result.length > 0) {
      console.log('✅ Successfully updated property:', result[0]);
    } else {
      console.log('❌ Property not found');
    }
  } catch (error) {
    console.error('Error updating property:', error);
  }
}

markPropertyAsPaid();
