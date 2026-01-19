import { db } from "../src/db";
import { properties, user as userTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function assignPropertiesToOwners() {
  try {
    // Get all users
    const allUsers = await db.select().from(userTable);
    console.log(`\n📋 Found ${allUsers.length} users\n`);

    // Get all published properties
    const allProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.isPublished, 1));

    console.log(`📋 Found ${allProperties.length} published properties\n`);

    // Filter to owners
    const owners = allUsers.filter((u) => (u as any).role === "owner");
    console.log(`👥 Found ${owners.length} owner(s)\n`);

    if (owners.length === 0) {
      console.log("❌ No owners found in database");
      return;
    }

    // Distribute properties evenly among owners
    const propertiesPerOwner = Math.floor(allProperties.length / owners.length);
    let propertyIndex = 0;

    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      const start = i * propertiesPerOwner;
      const end =
        i === owners.length - 1
          ? allProperties.length
          : (i + 1) * propertiesPerOwner;
      const ownerProperties = allProperties.slice(start, end);

      console.log(
        `\n✏️ Assigning ${ownerProperties.length} properties to ${owner.name} (${owner.email}):`
      );

      for (const prop of ownerProperties) {
        await db
          .update(properties)
          .set({ ownerId: owner.id })
          .where(eq(properties.id, prop.id));

        console.log(`   ✓ ${prop.title}`);
      }
    }

    console.log("\n✅ Property assignment complete!\n");

    // Verify assignments
    console.log("📊 Verification:\n");
    for (const owner of owners) {
      const ownerProps = await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, owner.id));

      console.log(`${owner.name}: ${ownerProps.length} properties`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

assignPropertiesToOwners();
