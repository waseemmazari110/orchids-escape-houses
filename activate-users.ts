import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function activateUser() {
  try {
    // Get all owner users
    const owners = await client.execute("SELECT id, email, role FROM user WHERE role = 'owner' LIMIT 10");
    
    console.log(`Found ${owners.rows.length} owner users\n`);

    // Update each owner to have active payment status
    for (const row of owners.rows) {
      await client.execute(
        "UPDATE user SET payment_status = 'active', plan_id = 'gold' WHERE id = ?",
        [row.id]
      );
      
      console.log(`✓ Updated ${row.email} - Payment Status: active, Plan: gold`);
    }

    console.log("\n✓ All owner users activated!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

activateUser();
