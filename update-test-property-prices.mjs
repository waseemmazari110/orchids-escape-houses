#!/usr/bin/env node
import { db } from '@/db/index.ts';
import { properties } from '@/db/schema.ts';
import { eq } from 'drizzle-orm';

// Update Test Property 6 with prices
async function updateTestPropertyPrices() {
  try {
    console.log('Updating Test Property 6 with prices...');
    
    const result = await db
      .update(properties)
      .set({
        priceFromWeekend: 750,
        priceFromMidweek: 450,
      })
      .where(eq(properties.title, 'Test Property 6'))
      .returning();

    if (result && result.length > 0) {
      console.log('✅ Property updated successfully:');
      console.log(`  Title: ${result[0].title}`);
      console.log(`  Weekend Price: £${result[0].priceFromWeekend}`);
      console.log(`  Midweek Price: £${result[0].priceFromMidweek}`);
    } else {
      console.log('❌ Test Property 6 not found');
    }
  } catch (error) {
    console.error('❌ Error updating property:', error);
  }
}

updateTestPropertyPrices();
