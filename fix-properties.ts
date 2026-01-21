import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq, isNull, or } from "drizzle-orm";

async function fixProperties() {
  try {
    // This is a temporary script to fix unowned properties
    // Get all properties without an owner
    const unownedProperties = await db
      .select()
      .from(properties)
      .where(isNull(properties.ownerId));

    console.log("Found unowned properties:", unownedProperties.length);
    console.log("Properties:", unownedProperties.map(p => ({ id: p.id, title: p.title, ownerId: p.ownerId })));

    // For testing: assign the first property to the test user
    if (unownedProperties.length > 0) {
      const testUserId = "PYz9bGdb9pJvKBKd8JGQmxjXxi3TSIAf"; // Jenny's user ID from the screenshot
      
      await db
        .update(properties)
        .set({ ownerId: testUserId })
        .where(isNull(properties.ownerId));

      console.log("✓ Fixed unowned properties - assigned to user:", testUserId);
    }

    // Show all properties now
    const allProperties = await db.select().from(properties);
    console.log("\n=== ALL PROPERTIES ===");
    allProperties.forEach(p => {
      console.log(`[${p.id}] ${p.title} - Owner: ${p.ownerId} - Published: ${p.isPublished}`);
    });

  } catch (error) {
    console.error("Error fixing properties:", error);
  }
}

fixProperties();
