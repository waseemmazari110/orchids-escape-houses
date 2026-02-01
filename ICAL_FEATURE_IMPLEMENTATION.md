# Synced iCal Calendar Feature - Implementation Guide

## Overview
Successfully implemented a synced iCal calendar feature that displays real-time availability when users select booking dates. Unavailable dates (booked or synced from external calendars) are now grayed out and cannot be selected.

## What Was Added

### 1. iCal Parser Utility (`src/lib/ical-parser.ts`)
A comprehensive utility for parsing iCal calendar feeds and extracting booked date ranges.

**Key Functions:**
- `parseICalUrl(url: string)` - Fetches and parses iCal data from external URLs (Airbnb, Booking.com, Google Calendar, etc.)
- `parseICalData(data: string)` - Parses raw iCal data strings
- `parseICalDate(dateStr: string)` - Converts iCal date format (YYYYMMDD or YYYYMMDDTHHMMSS) to JavaScript Date
- `getUnavailableDates(bookedRanges)` - Converts booked date ranges into individual unavailable dates
- `isDateUnavailable(date, bookedRanges)` - Checks if a specific date is unavailable
- `combineBookedDates()` - Merges iCal events with database bookings

**Features:**
- Extracts VEVENT entries from iCal files
- Parses DTSTART and DTEND timestamps
- Handles both date-only (YYYYMMDD) and datetime (YYYYMMDDTHHMMSS) formats
- Graceful error handling for malformed iCal data

### 2. Availability API Endpoint (`src/app/api/properties/[id]/availability/route.ts`)
A new GET endpoint that returns unavailable dates for any property.

**Endpoint:** `GET /api/properties/{propertyId}/availability`

**Returns:**
```json
{
  "propertyId": 123,
  "unavailableDates": ["2026-02-01", "2026-02-02", "2026-02-03"],
  "bookedRanges": [
    {
      "start": "2026-02-01",
      "end": "2026-02-05",
      "summary": "Booking Reference",
      "source": "ical"
    }
  ],
  "hasICalUrl": true,
  "cachedAt": "2026-01-30T12:00:00Z"
}
```

**Data Sources:**
1. **iCal Calendar Sync** - Fetches from `property.iCalURL` if configured
2. **Database Bookings** - Queries local database for confirmed/paid bookings
3. **Smart Caching** - 1-hour cache with 24-hour stale-while-revalidate

### 3. Updated BookingModal Component (`src/components/BookingModal.tsx`)

**Key Changes:**
- Added state for tracking unavailable dates
- Implemented `useEffect` hook to fetch availability when modal opens
- New `isDateDisabled()` function that prevents selection of:
  - Past dates (before today)
  - Dates from iCal calendar syncs
  - Confirmed/paid bookings from database

**Visual Improvements:**
- Loading indicator (spinner) while fetching availability
- Info banner explaining grayed-out unavailable dates
- Dates are automatically disabled in the calendar UI
- Smooth user experience with pre-filled forms after selection

## How It Works

### User Flow
1. User clicks "Book Now" button on property page
2. BookingModal opens and fetches availability from `/api/properties/{id}/availability`
3. Calendar displays with unavailable dates grayed out and unselectable
4. User can only select available dates
5. Selected dates are pre-filled in the enquiry form

### Data Integration
```
External Calendars (iCal URLs)
    ↓
iCal Parser → Date Ranges
    ↓
Availability API ← Database Bookings
    ↓
Calendar Component (disabled dates)
```

## Configuration

### Setting Up iCal URLs for Properties
1. Property owners add their iCal URL in the property settings
2. Supported sources:
   - Airbnb (calendar feed URL)
   - Booking.com (calendar sync)
   - Google Calendar (shared calendar link)
   - VRBO
   - Any standard iCal-compatible calendar

The URL should be stored in `properties.iCalURL` field (already in schema).

## Error Handling
- If iCal fetch fails, system gracefully falls back to database bookings only
- Invalid dates are skipped during parsing
- Missing data doesn't break the calendar UI
- API returns empty array if no bookings found

## Performance Considerations
- **Caching:** 1-hour server-side cache for availability data
- **Stale-While-Revalidate:** Serves stale data while updating in background
- **Client-side:** Unavailable dates stored in state, not re-fetched on user interaction
- **Efficient parsing:** Optimized regex patterns for iCal parsing

## Testing the Feature

### With iCal URLs
1. Add an iCal URL to a property
2. Create some events in the external calendar
3. Open booking modal - events should appear as unavailable dates

### With Database Bookings
1. Create a confirmed booking in database
2. Check-in and check-out dates should be unavailable
3. Date range should be grayed out in calendar

### No iCal URL
1. System still works with database bookings only
2. No errors or warnings
3. Graceful degradation

## Files Modified/Created
- ✅ `src/lib/ical-parser.ts` (NEW)
- ✅ `src/app/api/properties/[id]/availability/route.ts` (NEW)
- ✅ `src/components/BookingModal.tsx` (MODIFIED)

## Future Enhancements (Optional)
- Add property-specific availability rules (blocked-out periods)
- Implement manual availability management for property owners
- Add timezone support for international properties
- Implement availability for specific room/unit variants
- Add minimum stay requirements
- Create admin dashboard for availability management
- Email notifications for last-minute bookings

## API Response Caching Strategy
- First request: Fetches fresh data
- Subsequent requests (within 1 hour): Returns cached data
- After 1 hour: Refreshes in background while serving stale data
- Reduces load while keeping data relatively fresh

## Notes
- Only confirmed/paid bookings are marked as unavailable
- Pending bookings don't block dates (can be reassigned)
- Past dates are always disabled regardless of booking status
- System is read-only from user perspective (no modifications)
