import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixUserRole() {
  try {
    // Get all users with payment status active (should be owners)
    const users = await client.execute(
      "SELECT id, email, role FROM user WHERE payment_status = 'active' LIMIT 10"
    );
    
    console.log(`Found ${users.rows.length} users with active payment\n`);

    // Update each to have owner role
    for (const row of users.rows) {
      await client.execute(
        "UPDATE user SET role = 'owner' WHERE id = ?",
        [row.id]
      );
      
      console.log(`✓ Updated ${row.email}: guest → owner`);
    }

    console.log("\n✓ All users with active payment are now owners!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixUserRole();
