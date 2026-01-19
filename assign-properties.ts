import { db } from "./src/db";
import { properties, user as userTable } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function assignPropertiesToOwner() {
  try {
    // Find ali user
    const aliUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, "ali@example.com"));

    if (!aliUsers.length) {
      console.log("❌ User ali@example.com not found");
      return;
    }

    const aliId = aliUsers[0].id;
    console.log(`✓ Found user ali (ID: ${aliId})\n`);

    // Get all published properties
    const allProperties = await db.select().from(properties);
    console.log(`Total properties in database: ${allProperties.length}`);

    // Assign first 5 published properties to ali
    const propertiesToAssign = allProperties
      .filter((p) => p.isPublished === 1)
      .slice(0, 5);

    console.log(
      `Assigning ${propertiesToAssign.length} properties to ali...\n`
    );

    for (const prop of propertiesToAssign) {
      await db
        .update(properties)
        .set({ ownerId: aliId })
        .where(eq(properties.id, prop.id));

      console.log(`✓ Assigned: ${prop.title}`);
    }

    console.log("\n✓ Property assignment complete!");

    // Verify
    const assignedProps = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, aliId));

    console.log(
      `\n✓ Ali now owns ${assignedProps.length} properties:`,
      assignedProps.map((p) => p.title)
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

assignPropertiesToOwner();
