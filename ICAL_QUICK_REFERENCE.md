# iCal Calendar Feature - Quick Reference

## What's New?
✅ **Synced iCal Calendar Integration** - Users now see real-time availability when selecting booking dates

## How to Use

### For Property Owners
1. Go to property settings
2. Add your iCal calendar feed URL (from Airbnb, Booking.com, Google Calendar, etc.)
3. Calendar data syncs automatically within 1 hour
4. No manual management needed - system combines iCal + database bookings

### For Guests
1. Click "Book Now" on any property
2. Calendar opens showing available dates (white) and unavailable dates (grayed out)
3. Cannot select unavailable dates
4. Once dates are selected, they auto-fill the enquiry form

## API Endpoint
```
GET /api/properties/{propertyId}/availability
```

Returns:
- List of unavailable dates (YYYY-MM-DD format)
- Booked date ranges with source (iCal or database)
- Whether property has iCal URL configured
- Cache timestamp

## Files Added
- `src/lib/ical-parser.ts` - iCal parsing utility
- `src/app/api/properties/[id]/availability/route.ts` - Availability API
- `ICAL_FEATURE_IMPLEMENTATION.md` - Full documentation

## Files Modified
- `src/components/BookingModal.tsx` - Added availability fetching and disabled dates

## Key Features
✅ Real-time iCal syncing from external calendars
✅ Combines iCal events + database bookings
✅ Graceful error handling
✅ Performance optimized with caching
✅ Visual indication of unavailable dates
✅ Responsive calendar UI
✅ Only confirmed/paid bookings block dates

## Supported Calendar Sources
- Airbnb
- Booking.com
- Google Calendar
- VRBO
- Any iCal-compatible calendar service

## Data Flow
```
Property Details Page
         ↓
    "Book Now" clicked
         ↓
  BookingModal opens
         ↓
API fetches availability (iCal + DB)
         ↓
Calendar displays with disabled dates
         ↓
User selects available dates
         ↓
Enquiry form pre-filled
```

## Important Notes
⚠️ Only dates stored in `properties.iCalURL` are synced
⚠️ System gracefully handles missing iCal URLs
⚠️ Past dates always disabled (no manual override)
⚠️ Only confirmed/paid bookings block availability
⚠️ Pending enquiries don't block dates

## Testing
- Add iCal URL to a test property
- Create events in external calendar
- Open booking modal and verify unavailable dates appear grayed out
- Try selecting available vs unavailable dates

## Troubleshooting

### Dates not showing as unavailable
1. Verify iCal URL is correct and accessible
2. Check external calendar has events
3. Wait up to 1 hour for cache to clear
4. Try refreshing the page

### iCal not syncing
1. Verify calendar feed URL is publicly accessible
2. Check calendar event format matches iCal standard
3. Review browser console for errors
4. Check API response at `/api/properties/{id}/availability`

## Future Improvements
- Manual availability override for owners
- Timezone support
- Minimum stay requirements
- Block-out periods for cleaning
- Availability calendar widget for property dashboard
