# Debugging Guide - iCal Calendar Not Showing Unavailable Dates

## Quick Troubleshooting Checklist

### Step 1: Check Browser Console
1. Open DevTools (F12 in Chrome)
2. Go to Console tab
3. Look for any error messages about:
   - "Failed to fetch availability"
   - "Error fetching availability"
   - Network errors

### Step 2: Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Book Now" to open the modal
4. Look for a request to `/api/properties/[id]/availability`
5. Click on it and check:
   - Status code (should be 200)
   - Response body (should have `unavailableDates` array)

### Step 3: Test the API Directly
Open your browser and test the API:
```
http://localhost:3000/api/properties/1/availability
```

You should see a JSON response like:
```json
{
  "propertyId": 1,
  "unavailableDates": ["2026-02-01", "2026-02-02"],
  "bookedRanges": [...],
  "hasICalUrl": false,
  "cachedAt": "2026-01-30T12:00:00Z"
}
```

### Step 4: Create Test Data
If the API returns empty `unavailableDates`, you need test bookings.

**Option A: Add test booking via API**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "propertyName": "Brighton Seafront Villa",
    "guestName": "Test Guest",
    "guestEmail": "test@example.com",
    "guestPhone": "01273 569301",
    "checkInDate": "2026-02-01",
    "checkOutDate": "2026-02-05",
    "numberOfGuests": 4,
    "bookingStatus": "confirmed"
  }'
```

**Option B: Add test booking via Database**
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
  '2026-02-01',
  '2026-02-05',
  4,
  'confirmed',
  datetime('now'),
  datetime('now')
);
```

### Step 5: Verify Calendar Styling
The disabled dates should appear grayed out. If they don't:

1. **Check CSS is loaded:** Open DevTools → Inspector → Select a calendar date
2. **Look for** `aria-disabled="true"` attribute
3. **Check computed styles** - should have `opacity: 0.5` or similar

---

## Common Issues & Solutions

### Issue 1: API returns 404
**Cause:** Property doesn't exist  
**Solution:** Verify property ID matches a real property in database

```sql
SELECT id, title FROM properties LIMIT 5;
```

### Issue 2: API returns empty `unavailableDates`
**Cause:** No bookings for this property  
**Solution:** Add test bookings (see Step 4 above)

### Issue 3: API returns `hasICalUrl: false`
**Cause:** Property doesn't have iCal URL configured  
**Solution:** This is normal - system falls back to database bookings

### Issue 4: Dates don't appear grayed out even with unavailable dates
**Cause:** Calendar styling issue  
**Solution:** 
1. Check browser console for CSS errors
2. Verify `disabled` prop is being passed correctly
3. Check if custom CSS is overriding styles

### Issue 5: Modal shows loading spinner forever
**Cause:** API is not responding  
**Solution:**
1. Check if API endpoint exists
2. Verify server is running
3. Check server logs for errors

---

## Manual Testing Steps

### To See Disabled Dates In Action:

1. **Add a test booking:**
   ```sql
   INSERT INTO bookings (property_name, guest_name, guest_email, guest_phone, check_in_date, check_out_date, number_of_guests, booking_status, created_at, updated_at)
   VALUES ('Brighton Seafront Villa', 'Test', 'test@test.com', '123', '2026-02-05', '2026-02-10', 4, 'confirmed', datetime('now'), datetime('now'));
   ```

2. **Refresh the page** (important - clears cache)

3. **Click "Book Now"** on Brighton Seafront Villa

4. **Check the calendar:**
   - Dates 5-10 February should be grayed out
   - Other dates should be selectable
   - Try clicking unavailable dates (should not select)
   - Try clicking available dates (should select)

---

## Debugging with Browser Console

### Check if availability was fetched:
```javascript
// In browser console, type:
localStorage.setItem('debug', 'ical');
// Then reload page and check console logs
```

### Manually test the API:
```javascript
fetch('/api/properties/1/availability')
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(e => console.error('Error:', e))
```

---

## Expected Behavior

### With No Bookings
- All future dates are **white** (available)
- Can select any available date
- API returns `unavailableDates: []`

### With Confirmed Booking (Feb 5-10)
- Dates 1-4: White (available)
- Dates 5-10: **Gray** (unavailable) ← These should be grayed out
- Dates 11+: White (available)

### Visual Indicator
- **Gray** = Disabled (cannot click)
- **White** = Available (can click)
- **Selected Range** = Blue/highlighted

---

## Quick Fix Checklist

If dates aren't showing as grayed out:

- [ ] Add test booking for Feb 5-10, 2026
- [ ] Refresh browser (hard refresh: Ctrl+Shift+R)
- [ ] Check Network tab for API response
- [ ] Verify API returns `unavailableDates` array
- [ ] Check browser console for errors
- [ ] Verify `disabled` prop reaches calendar

---

## Still Not Working?

Try these steps in order:

1. **Restart development server:**
   ```bash
   npm run dev
   ```

2. **Clear browser cache:**
   - DevTools → Application → Storage → Clear All

3. **Hard refresh page:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

4. **Check server logs:**
   - Look for any API errors
   - Verify database connection

5. **Add console logging:**
   - Open DevTools
   - Check console for any errors
   - Look for "Failed to fetch availability"

---

## Need More Help?

Check these files for more info:
- **Full docs:** ICAL_FEATURE_IMPLEMENTATION.md
- **Setup guide:** ICAL_SETUP_AND_TESTING.md
- **Troubleshooting:** ICAL_QUICK_REFERENCE.md

