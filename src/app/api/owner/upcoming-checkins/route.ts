import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookings, properties } from "../../../../../drizzle/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Get owner's properties
    const ownerProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, userId));

    const propertyIds = ownerProperties.map((p) => p.id);

    // Get upcoming check-ins (within next 30 days) - only if owner has properties
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let upcomingCheckIns: typeof bookings.$inferSelect[] = [];
    if (propertyIds.length > 0) {
      upcomingCheckIns = await db
        .select()
        .from(bookings)
        .where(
          and(
            inArray(bookings.propertyId, propertyIds),
            gte(bookings.checkInDate, now.toISOString()),
            lte(bookings.checkInDate, thirtyDaysFromNow.toISOString())
          )
        )
        .limit(10);
    }

    return NextResponse.json({ checkIns: upcomingCheckIns });
  } catch (error) {
    console.error("Error fetching upcoming check-ins:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming check-ins" },
      { status: 500 }
    );
  }
}
