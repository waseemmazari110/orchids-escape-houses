# iCal Calendar Feature - Setup & Testing Guide

## Prerequisites
- Node.js 18+
- Existing database with properties and bookings tables
- Access to property data via API

## Installation

No additional dependencies needed! The feature uses existing packages:
- `date-fns` (date manipulation)
- `react` (UI framework)
- `next.js` (API routes)
- `drizzle-orm` (database)

## File Structure

```
src/
├── lib/
│   └── ical-parser.ts .................... NEW
│
├── components/
│   └── BookingModal.tsx .................. MODIFIED
│       ├── Added useEffect hook
│       ├── Added fetchAvailability()
│       ├── Added isDateDisabled()
│       └── Added UI enhancements
│
└── app/
    └── api/
        └── properties/
            └── [id]/
                └── availability/ ......... NEW
                    └── route.ts

Documentation/
├── ICAL_FEATURE_IMPLEMENTATION.md ....... Complete technical docs
├── ICAL_QUICK_REFERENCE.md .............. Quick start guide
├── ICAL_DEPLOYMENT_SUMMARY.md ........... Deployment checklist
└── ICAL_ARCHITECTURE_GUIDE.md ........... Visual architecture
```

## Setup Steps

### 1. Enable iCal URLs on Properties
The database field already exists: `properties.iCalURL`

To manually set an iCal URL:
```sql
UPDATE properties 
SET ical_url = 'https://calendar.google.com/calendar/ical/xxx/public/basic.ics'
WHERE id = 123;
```

Or via API (if property update endpoint supports it):
```json
{
  "iCalURL": "https://your-calendar-feed-url"
}
```

### 2. Test with Sample Properties

Create a test property with an iCal URL:
```bash
# Update a test property with a sample Google Calendar
UPDATE properties 
SET ical_url = 'https://calendar.google.com/calendar/ical/test@gmail.com/public/basic.ics'
WHERE id = 1;
```

### 3. Create Test Bookings

```sql
INSERT INTO bookings (
  property_name,
  guest_name,
  guest_email,
  guest_phone,
  check_in_date,
  check_out_date,
  number_of_guests,
  booking_status,
  created_at,
  updated_at
) VALUES (
  'Brighton Seafront Villa',
  'Test Guest',
  'test@example.com',
  '01273 569301',
  '2026-02-10',
  '2026-02-15',
  4,
  'confirmed',
  datetime('now'),
  datetime('now')
);
```

## Testing Checklist

### Unit Tests

Test iCal parsing:
```typescript
import { parseICalData, getUnavailableDates } from '@/lib/ical-parser';

describe('iCal Parser', () => {
  it('should parse basic iCal data', () => {
    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
DTSTART:20260201T000000Z
DTEND:20260205T000000Z
SUMMARY:Test Event
END:VEVENT
END:VCALENDAR`;

    const events = parseICalData(ical);
    expect(events).toHaveLength(1);
    expect(events[0].start).toEqual(new Date(2026, 1, 1));
  });

  it('should get unavailable dates from ranges', () => {
    const ranges = [
      {
        start: new Date(2026, 1, 1),
        end: new Date(2026, 1, 5),
        summary: 'Test'
      }
    ];
    
    const unavailable = getUnavailableDates(ranges);
    expect(unavailable).toHaveLength(4);
  });
});
```

### Integration Tests

Test the availability API:
```bash
# Test with property that has iCal URL
curl http://localhost:3000/api/properties/1/availability

# Expected response:
# {
#   "propertyId": 1,
#   "unavailableDates": ["2026-02-01", "2026-02-02", ...],
#   "bookedRanges": [...],
#   "hasICalUrl": true,
#   "cachedAt": "2026-01-30T12:00:00Z"
# }
```

### Manual UI Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to a property page**
   ```
   http://localhost:3000/properties/brighton-seafront-villa
   ```

3. **Click "Book Now"**
   - Should see loading spinner
   - Calendar should load
   - Some dates should be grayed out

4. **Try selecting dates:**
   - Available dates should be selectable
   - Unavailable dates should not respond to clicks
   - Date range should update correctly

5. **Verify API response:**
   ```
   Open DevTools → Network tab
   Filter: "availability"
   Check response includes unavailableDates array
   ```

## Testing Different Scenarios

### Scenario 1: Property with iCal URL
1. Set `iCalURL` for a property
2. Create external calendar with events
3. Click "Book Now"
4. Verify external events appear as unavailable

**Expected:** Dates from iCal show as grayed out

### Scenario 2: Property with Database Bookings
1. Don't set `iCalURL`
2. Create booking in database with status = 'confirmed'
3. Click "Book Now"
4. Verify booking dates are unavailable

**Expected:** Database booking dates show as grayed out

### Scenario 3: Property with Both
1. Set `iCalURL` AND create database booking
2. Click "Book Now"
3. Both sources should contribute to unavailable dates

**Expected:** Combined unavailable dates from both sources

### Scenario 4: No Bookings or iCal
1. Clear `iCalURL`
2. Delete all bookings for property
3. Click "Book Now"
4. All future dates should be available

**Expected:** No grayed-out dates (except past dates)

### Scenario 5: Invalid iCal URL
1. Set `iCalURL` to non-existent URL
2. Click "Book Now"
3. System should gracefully fall back

**Expected:** No error, calendar shows database bookings only

## Browser DevTools Debugging

### Check Network Requests
```
DevTools → Network tab
Filter: XHR/Fetch
Look for: GET /api/properties/[id]/availability
```

### Check Console
```
DevTools → Console
Look for errors or warnings about:
- Failed to parse iCal
- Failed to fetch availability
- Date parsing issues
```

### Check Component State
```
React DevTools → Components
Select BookingModal
Inspect state:
- unavailableDates
- isLoadingAvailability
- checkInDate
- checkOutDate
```

## Performance Testing

### Load Testing
```bash
# Test API response time
time curl http://localhost:3000/api/properties/1/availability

# Should respond in < 500ms
```

### Browser Performance
```
DevTools → Performance tab
1. Start recording
2. Click "Book Now"
3. Wait for calendar to load
4. Stop recording
5. Check timeline for bottlenecks
```

### Cache Testing
```
1. First request: Should be slower (fetching from API)
2. Immediate second request: Should be cached (faster)
3. After 1 hour: Should refresh
4. Check Response Headers for Cache-Control
```

## Deployment Testing

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Performance acceptable
- [ ] Error handling tested
- [ ] API response valid JSON
- [ ] Calendar UI renders correctly

### Staging Environment
1. Deploy to staging
2. Run full test suite
3. Test with real iCal URLs
4. Monitor for errors
5. Check performance metrics

### Production Deployment
1. Execute migration scripts (if any)
2. Deploy new code
3. Monitor error logs
4. Verify API responses
5. Test with real users

## Rollback Procedure

If issues occur:

1. **Quick Rollback** (revert changes)
   ```bash
   git revert <commit-hash>
   npm run build
   npm start
   ```

2. **Remove API Endpoint**
   - Delete `src/app/api/properties/[id]/availability/` folder
   - BookingModal falls back to old behavior

3. **Disable iCal Features**
   - Comment out `fetchAvailability()` call
   - Remove `useEffect` hook
   - Calendar uses only `date < today` logic

4. **Database Cleanup** (if needed)
   ```sql
   UPDATE properties SET ical_url = NULL;
   ```

## Monitoring in Production

### Key Metrics
1. **API Response Time**
   - Target: < 500ms
   - Monitor: CloudWatch/New Relic

2. **Error Rate**
   - Target: < 0.1%
   - Monitor: Error logs

3. **Cache Hit Ratio**
   - Target: > 80%
   - Monitor: API gateway

4. **User Engagement**
   - Monitor: Booking conversion rate
   - Check: Did availability affect bookings?

### Alerts to Set Up
```
- API response time > 1s
- Error rate > 1%
- iCal parse failures > 10%
- Availability API down
```

## Support & Troubleshooting

### Common Issues

**Issue:** "Cannot find module '@/lib/ical-parser'"
**Fix:** Ensure file exists at `src/lib/ical-parser.ts`

**Issue:** API returns 404
**Fix:** Verify property ID exists in database

**Issue:** iCal not syncing
**Fix:** 
- Check iCal URL is public
- Verify URL returns valid iCal data
- Check 1-hour cache hasn't expired

**Issue:** Calendar dates seem wrong
**Fix:**
- Clear browser cache
- Check timezone settings
- Verify database dates are correct

## Resources

- **iCal Format Spec:** https://tools.ietf.org/html/rfc5545
- **Google Calendar iCal URL:** https://support.google.com/calendar/answer/37103
- **React Day Picker:** https://react-day-picker.js.org/
- **Date-fns Documentation:** https://date-fns.org/

## Questions?

Refer to:
1. `ICAL_FEATURE_IMPLEMENTATION.md` - Technical details
2. `ICAL_ARCHITECTURE_GUIDE.md` - System design
3. Source code comments in:
   - `src/lib/ical-parser.ts`
   - `src/app/api/properties/[id]/availability/route.ts`
   - `src/components/BookingModal.tsx`
