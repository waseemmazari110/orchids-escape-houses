import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookings, properties } from "../../../../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
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
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "5");

    // Get owner's properties
    const ownerProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, userId));

    const propertyIds = ownerProperties.map((p) => p.id);

    // Get bookings for owner's properties - only if owner has properties
    let ownerBookings: typeof bookings.$inferSelect[] = [];
    if (propertyIds.length > 0) {
      ownerBookings = await db
        .select()
        .from(bookings)
        .where(inArray(bookings.propertyId, propertyIds))
        .limit(limit);
    }

    return NextResponse.json({ bookings: ownerBookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
