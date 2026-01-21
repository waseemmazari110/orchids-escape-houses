import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[DEBUG] Assigning owner. User ID:", session.user.id);

    // Assign all unowned properties to the current user
    const result = await db
      .update(properties)
      .set({ ownerId: session.user.id })
      .where(isNull(properties.ownerId))
      .returning();

    console.log("[DEBUG] Update result:", result);

    return NextResponse.json({
      success: true,
      message: `Assigned unowned properties to user ${session.user.id}`,
      updatedCount: result?.length || 0
    });
  } catch (error) {
    console.error("[DEBUG] Error assigning owner:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
