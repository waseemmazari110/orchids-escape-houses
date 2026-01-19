import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, user as userTable } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function checkProperties() {
  try {
    // Get ali user
    const aliUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, "ali@example.com"))
      .limit(1);

    if (!aliUser.length) {
      console.log("No user found with email ali@example.com");
      return;
    }

    const userId = aliUser[0].id;
    console.log(`\n=== Properties for user ${aliUser[0].name} (${userId}) ===\n`);

    // Get all properties for this user
    const userProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, userId));

    console.log(`Total properties: ${userProperties.length}\n`);

    userProperties.forEach((prop) => {
      console.log(`ID: ${prop.id}`);
      console.log(`Title: ${prop.title}`);
      console.log(`Status: ${prop.status}`);
      console.log(`Published: ${prop.isPublished}`);
      console.log(`Approved At: ${prop.approvedAt}`);
      console.log("---");
    });

    const activeCount = userProperties.filter(
      (p) => p.isPublished && p.status === "approved"
    ).length;

    console.log(`\nActive Properties (approved + published): ${activeCount}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkProperties();
