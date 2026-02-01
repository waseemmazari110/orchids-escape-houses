import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { properties, bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { parseICalUrl, combineBookedDates, getUnavailableDates, BookedDateRange } from '@/lib/ical-parser';

/**
 * GET /api/properties/[id]/availability
 * Returns unavailable dates for a property based on:
 * 1. Synced iCal calendar (Airbnb, Booking.com, etc.)
 * 2. Confirmed bookings in the database
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const resolvedParams = await params;
    const propertyId = parseInt(resolvedParams.id, 10);
    console.log('🔍 [API] Availability request for property ID:', resolvedParams.id, '(parsed as:', propertyId, ')');

    if (isNaN(propertyId)) {
      console.error('❌ [API] Invalid property ID:', resolvedParams.id);
      return NextResponse.json(
        { error: 'Invalid property ID' },
        { status: 400 }
      );
    }

    // Fetch property with iCal URL
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
      columns: {
        id: true,
        title: true,
        iCalURL: true,
      }
    });

    if (!property) {
      console.error('❌ [API] Property not found:', propertyId);
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    console.log('✅ [API] Found property:', property.title);

    // Parse iCal if URL exists
    let icalBookedDates: BookedDateRange[] = [];
    if (property.iCalURL) {
      try {
        console.log('🔍 [API] Fetching iCal from:', property.iCalURL);
        icalBookedDates = await parseICalUrl(property.iCalURL);
        console.log('✅ [API] Parsed iCal events:', icalBookedDates.length);
      } catch (error) {
        console.error(`❌ [API] Failed to parse iCal for property ${propertyId}:`, error);
        // Continue with just database bookings if iCal fails
      }
    } else {
      console.log('ℹ️ [API] No iCal URL for this property');
    }

    // Fetch confirmed bookings from database by property name
    console.log('🔍 [API] Querying database for bookings of property:', property.title);
    const dbBookings = await db.query.bookings.findMany({
      where: eq(bookings.propertyName, property.title),
      columns: {
        checkInDate: true,
        checkOutDate: true,
        bookingStatus: true,
      },
    });

    console.log('✅ [API] Found', dbBookings.length, 'bookings matching property name:', property.title);
    
    // If no bookings found by property name, try to find any bookings to debug
    if (dbBookings.length === 0) {
      const allBookings = await db.query.bookings.findMany();
      console.warn('⚠️ [API] No bookings found for property name "' + property.title + '"');
      console.warn('⚠️ [API] Available property names in bookings:', [...new Set(allBookings.map((b: any) => b.propertyName))]);
    }

    // Only include confirmed/paid bookings as unavailable
    const confirmedBookings = dbBookings
      .filter((b: any) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'paid')
      .map((b: any) => ({
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
      }));

    console.log('✅ [API] Confirmed/paid bookings:', confirmedBookings.length);

    // Combine all booked ranges
    const allBookedRanges = combineBookedDates(icalBookedDates, confirmedBookings);

    // Get array of unavailable dates
    const unavailableDates = getUnavailableDates(allBookedRanges);

    // Convert to ISO strings for JSON serialization
    const unavailableDateStrings = unavailableDates.map((d) =>
      d.toISOString().split('T')[0]
    );

    console.log('✅ [API] Total unavailable dates:', unavailableDateStrings.length);
    console.log('✅ [API] Unavailable dates:', unavailableDateStrings);

    return NextResponse.json(
      {
        propertyId,
        unavailableDates: unavailableDateStrings,
        bookedRanges: allBookedRanges.map((r) => ({
          start: r.start.toISOString().split('T')[0],
          end: r.end.toISOString().split('T')[0],
          summary: r.summary,
          source: r.summary ? 'ical' : 'database',
        })),
        hasICalUrl: !!property.iCalURL,
        cachedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('❌ [API] Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
