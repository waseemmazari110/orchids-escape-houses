import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// Generate random user IDs for testing
const TEST_USERS = [
  "user_test_001",
  "user_test_002",
  "user_test_003",
  "user_test_004",
  "user_test_005",
  "user_test_006",
  "user_test_007",
  "user_test_008",
  "user_test_009",
  "user_test_010",
];

async function runMigration(jennyId: string) {
  try {
    console.log("[MIGRATION] Starting migration with Jenny ID:", jennyId);
    
    // Get all properties
    const allProps = await db.select().from(properties);
    console.log("[MIGRATION] Total properties in DB:", allProps.length);
    
    // Jenny's newly created properties (keep ownerId)
    const jennyProperties = ["Brighton Villa", "Newquerry"];
    
    let clearedCount = 0;
    let jennyCount = 0;

    // Process each property
    for (const prop of allProps) {
      try {
        if (jennyProperties.includes(prop.title)) {
          // Assign to Jenny
          await db
            .update(properties)
            .set({ ownerId: jennyId })
            .where(eq(properties.id, prop.id));
          jennyCount++;
          console.log(`[MIGRATION] ✓ "${prop.title}" → Jenny (${jennyId})`);
        } else {
          // Clear ownerId from all other properties (set to NULL)
          await db
            .update(properties)
            .set({ ownerId: null })
            .where(eq(properties.id, prop.id));
          clearedCount++;
          console.log(`[MIGRATION] ✗ Cleared ownerId from "${prop.title}"`);
        }
      } catch (err) {
        console.error(`[MIGRATION] Error processing ${prop.title}:`, err);
      }
    }

    console.log("[MIGRATION] Complete! Jenny's properties:", jennyCount, "Cleared:", clearedCount);
    return { jennyCount, clearedCount, success: true };
  } catch (error) {
    console.error("[MIGRATION] Fatal error:", error);
    return { jennyCount: 0, clearedCount: 0, success: false, error: String(error) };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jennyId = session.user.id;
    console.log("[API] POST /reset-owners called by", session.user.email);
    
    const result = await runMigration(jennyId);

    return NextResponse.json({
      success: result.success,
      message: "Property ownership migration complete",
      jennysProperties: result.jennyCount,
      propertiesCleared: result.clearedCount,
      totalProcessed: result.jennyCount + result.clearedCount,
      error: result.error,
    });
  } catch (error) {
    console.error("[API] Error in POST:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jennyId = session.user.id;
    console.log("[API] GET /reset-owners called by", session.user.email);
    
    const result = await runMigration(jennyId);

    return NextResponse.json({
      success: result.success,
      message: "Property ownership migration complete",
      jennysProperties: result.jennyCount,
      propertiesCleared: result.clearedCount,
      totalProcessed: result.jennyCount + result.clearedCount,
      error: result.error,
    });
  } catch (error) {
    console.error("[API] Error in GET:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
