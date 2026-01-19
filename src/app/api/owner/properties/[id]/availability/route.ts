import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, bookings } from "../../../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const propertyId = parseInt(id);

    // Verify property belongs to user
    const property = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.ownerId, userId)
        )
      );

    if (!property.length) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Get bookings for this property
    const propertyBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.propertyId, propertyId));

    // Generate availability data
    const availability = [];
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const isBooked = propertyBookings.some(
        (b) =>
          new Date(b.checkInDate) <= date &&
          new Date(b.checkOutDate) > date
      );

      availability.push({
        date: dateStr,
        available: !isBooked,
        status: isBooked ? 'booked' : 'available',
      });
    }

    return NextResponse.json({
      propertyId,
      availability,
      bookings: propertyBookings.map((b) => ({
        id: b.id,
        checkIn: b.checkInDate,
        checkOut: b.checkOutDate,
        guestName: b.guestName,
        status: b.bookingStatus,
      })),
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
