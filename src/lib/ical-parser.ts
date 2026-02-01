/**
 * iCal Parser - Extracts booked dates from iCal calendar feeds
 * Supports VEVENT entries from external calendars (Airbnb, Booking.com, Google Calendar, etc.)
 */

export interface BookedDateRange {
  start: Date;
  end: Date;
  summary?: string;
  description?: string;
}

/**
 * Parses iCal data and extracts booked date ranges
 */
export async function parseICalUrl(icalUrl: string): Promise<BookedDateRange[]> {
  if (!icalUrl) return [];

  try {
    const response = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'GroupEscapeHouses/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch iCal from ${icalUrl}: ${response.statusText}`);
      return [];
    }

    const icalData = await response.text();
    return parseICalData(icalData);
  } catch (error) {
    console.error(`Error parsing iCal URL ${icalUrl}:`, error);
    return [];
  }
}

/**
 * Parses raw iCal data string and extracts booked date ranges
 */
export function parseICalData(icalData: string): BookedDateRange[] {
  const events: BookedDateRange[] = [];

  // Match VEVENT blocks
  const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;

  while ((match = eventRegex.exec(icalData)) !== null) {
    const eventData = match[1];
    
    // Extract DTSTART and DTEND
    const dtStartMatch = eventData.match(/DTSTART(?:;[^:]*)?:([^\r\n]+)/);
    const dtEndMatch = eventData.match(/DTEND(?:;[^:]*)?:([^\r\n]+)/);
    const summaryMatch = eventData.match(/SUMMARY:([^\r\n]+)/);
    const descriptionMatch = eventData.match(/DESCRIPTION:([^\r\n]+)/);

    if (dtStartMatch && dtEndMatch) {
      const start = parseICalDate(dtStartMatch[1].trim());
      const end = parseICalDate(dtEndMatch[1].trim());

      if (start && end) {
        events.push({
          start,
          end,
          summary: summaryMatch ? summaryMatch[1].trim() : undefined,
          description: descriptionMatch ? descriptionMatch[1].trim() : undefined,
        });
      }
    }
  }

  return events;
}

/**
 * Parses iCal date format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 */
export function parseICalDate(dateStr: string): Date | null {
  // Remove timezone info if present (Z suffix)
  dateStr = dateStr.replace('Z', '').split('T')[0] + (dateStr.includes('T') ? dateStr.substring(8) : '');

  if (dateStr.length === 8) {
    // Date only format: YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  } else if (dateStr.length >= 15) {
    // DateTime format: YYYYMMDDTHHMMSS
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    const hour = parseInt(dateStr.substring(9, 11), 10);
    const minute = parseInt(dateStr.substring(11, 13), 10);
    const second = parseInt(dateStr.substring(13, 15), 10);
    return new Date(year, month, day, hour, minute, second, 0);
  }

  return null;
}

/**
 * Gets all unavailable dates from booked date ranges
 * Returns an array of Date objects that are unavailable
 */
export function getUnavailableDates(bookedRanges: BookedDateRange[]): Date[] {
  const unavailableDates: Date[] = [];

  for (const range of bookedRanges) {
    const current = new Date(range.start);
    current.setHours(0, 0, 0, 0);

    // Note: end date is typically exclusive in iCal, so we go up to but not including it
    while (current < range.end) {
      unavailableDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  return unavailableDates;
}

/**
 * Checks if a date is unavailable based on booked date ranges
 */
export function isDateUnavailable(date: Date, bookedRanges: BookedDateRange[]): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return bookedRanges.some((range) => {
    const rangeStart = new Date(range.start);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(range.end);
    rangeEnd.setHours(0, 0, 0, 0);

    return checkDate >= rangeStart && checkDate < rangeEnd;
  });
}

/**
 * Combines iCal booked dates with database bookings
 */
export function combineBookedDates(
  icalRanges: BookedDateRange[],
  dbBookings: Array<{ checkInDate: string; checkOutDate: string }>
): BookedDateRange[] {
  const allRanges = [...icalRanges];

  // Add database bookings (dates are typically stored as YYYY-MM-DD)
  for (const booking of dbBookings) {
    const start = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    
    // Ensure valid dates
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      allRanges.push({ start, end });
    }
  }

  return allRanges;
}
