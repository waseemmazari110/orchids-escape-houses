import { db } from "@/db";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
  try {
    console.log("🚀 Starting migration for saved_properties table...");
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), "drizzle/0007_add_saved_properties.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");
    
    // Split by semicolons and filter empty statements
    const statements = migrationSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s && !s.startsWith("--"));
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`⚙️ Executing: ${statement.substring(0, 50)}...`);
      await db.run(sql.raw(statement));
    }
    
    console.log("✅ Migration completed successfully!");
    console.log("📝 The saved_properties table has been created with proper indexes");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

runMigration().catch(console.error);
