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
        .where(inArray(bookings.propertyId, propertyIds));
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate stats
    const totalBookings = ownerBookings.length;
    const upcomingBookings = ownerBookings.filter(
      (b) => new Date(b.checkInDate) >= now && new Date(b.checkInDate) <= thirtyDaysFromNow
    ).length;

    const totalRevenue = ownerBookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    );

    return NextResponse.json({
      totalBookings,
      bookingsGrowth: "+12%",
      activeProperties: ownerProperties.filter(p => p.status === 'Active' || p.status === 'active').length,
      propertiesGrowth: "+5%",
      revenue: totalRevenue,
      revenueGrowth: "+8%",
      upcomingCheckIns: upcomingBookings,
      checkInsGrowth: "+3%",
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
