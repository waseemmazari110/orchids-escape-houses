import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { savedProperties } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    console.log("❌ [API] Unauthorized: No session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { propertyId, action } = await req.json();
  console.log(`🔍 [API] Save property request: propertyId=${propertyId}, action=${action}, userId=${session.user.id}`);

  if (!propertyId) {
    console.log("❌ [API] Missing propertyId");
    return NextResponse.json({ error: "Property ID required" }, { status: 400 });
  }

  try {
    if (action === "save") {
      // Check if already saved
      const existing = await db.query.savedProperties.findFirst({
        where: and(
          eq(savedProperties.userId, session.user.id),
          eq(savedProperties.propertyId, propertyId)
        ),
      });

      if (!existing) {
        console.log(`✅ [API] Inserting saved property`);
        await db.insert(savedProperties).values({
          userId: session.user.id,
          propertyId,
          createdAt: new Date().toISOString(),
        });
        console.log(`✅ [API] Successfully saved property ${propertyId}`);
      } else {
        console.log(`ℹ️ [API] Property already saved`);
      }
    } else {
      console.log(`🗑️ [API] Deleting saved property`);
      await db.delete(savedProperties).where(
        and(
          eq(savedProperties.userId, session.user.id),
          eq(savedProperties.propertyId, propertyId)
        )
      );
      console.log(`✅ [API] Successfully unsaved property ${propertyId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ [API] Save property error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    console.log("❌ [API] GET: Unauthorized - no session");
    return NextResponse.json({ savedIds: [] });
  }

  console.log(`🔍 [API] GET: Fetching saved properties for user ${session.user.id}`);

  try {
    const saved = await db.query.savedProperties.findMany({
      where: eq(savedProperties.userId, session.user.id),
      columns: {
        propertyId: true,
      },
    });

    const savedIds = saved.map(s => s.propertyId);
    console.log(`✅ [API] GET: Found ${savedIds.length} saved properties:`, savedIds);
    return NextResponse.json({ savedIds });
  } catch (error) {
    console.error("❌ [API] GET: Error fetching saved properties:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
