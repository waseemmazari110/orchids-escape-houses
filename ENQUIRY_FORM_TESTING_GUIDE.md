# EnquiryForm iCal Integration - Testing Guide

## Quick Test Checklist

### ✅ Step 1: Verify Files Were Updated
- [x] `src/components/EnquiryForm.tsx` - Added propertyId prop, availability fetching, date validation
- [x] `src/app/properties/[slug]/PropertyClient.tsx` - Pass property.id to EnquiryForm
- [x] No TypeScript errors present

### ✅ Step 2: Set Up Test Data (Database)
If you want to test with actual unavailable dates, create a test booking:

```sql
-- Create a test booking for a property (e.g., propertyId = 1)
INSERT INTO bookings (
  propertyName,
  propertyId,
  guestName,
  guestEmail,
  guestPhone,
  checkInDate,
  checkOutDate,
  groupSize,
  bookingStatus,
  createdAt
) VALUES (
  'Bath Spa Retreat',
  1,
  'Test Guest',
  'test@example.com',
  '01225123456',
  '2026-02-15',
  '2026-02-22',
  8,
  'confirmed',
  NOW()
);
```

### ✅ Step 3: Manual Testing in Browser

#### Test A: Form Loads and Fetches Availability
1. Go to a property page (e.g., `/properties/bath-spa-retreat`)
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for logs with emoji prefixes:
   - 🔍 [iCal Enquiry] Fetching availability from: /api/properties/1/availability
   - 🔍 [iCal Enquiry] API Response status: 200
   - ✅ [iCal Enquiry] Set unavailable dates: ["2026-02-15", "2026-02-16", ...]

Expected: Logs appear when page loads

#### Test B: Try to Select Available Date
1. Scroll down to the Enquiry Form
2. Click the "Arrival" date input
3. Select a date that is NOT in the unavailable dates (e.g., 2026-02-10 if unavailable starts on 2026-02-15)
4. The date should be accepted without error

Expected: Date is selected normally, no error message

#### Test C: Try to Select Unavailable Date
1. Click the "Arrival" date input
2. Try to select a date that IS in the unavailable dates (e.g., 2026-02-15)
3. The input should clear and show a toast error

Expected: 
- Input clears immediately
- Toast message: "This date is not available. Please select another date."
- Console shows: 🔍 [iCal Enquiry] Date validation triggered

#### Test D: Try to Select Past Date
1. Click the "Arrival" date input
2. Try to select a date in the past (e.g., 2020-01-01)
3. The input should clear and show a toast error

Expected: Same behavior as unavailable dates

#### Test E: Submit Form with Valid Dates
1. Fill in all form fields with valid data
2. Select both arrival and departure dates (both available)
3. Click Submit
4. Should see success message: "Enquiry Sent!"

Expected: Form submits successfully with valid dates

### ✅ Step 4: Verify API Integration

#### Check API Response
1. Open DevTools Network tab (F12 → Network)
2. Reload property page
3. Look for request to `/api/properties/1/availability` (or whatever property ID)
4. Click the request and check Response tab

Expected Response:
```json
{
  "unavailableDates": [
    "2026-02-15",
    "2026-02-16",
    "2026-02-17",
    "2026-02-18",
    "2026-02-19",
    "2026-02-20",
    "2026-02-21"
  ],
  "bookedRanges": [
    {
      "start": "2026-02-15",
      "end": "2026-02-22"
    }
  ]
}
```

### ✅ Step 5: Comparison with BookingModal

Test that both forms have consistent behavior:

1. Open a property page with a booking modal button
2. Open booking modal (should also show unavailable dates)
3. Note the unavailable dates in booking modal
4. Close booking modal
5. Check enquiry form's unavailable dates
6. They should match!

Expected: Both modals show the same unavailable dates

## Debugging Tips

### If dates aren't showing as unavailable:

1. **Check if property has bookings:**
   ```sql
   SELECT * FROM bookings WHERE propertyId = 1 AND bookingStatus = 'confirmed';
   ```

2. **Check if property has iCalURL:**
   ```sql
   SELECT id, title, iCalURL FROM properties WHERE id = 1;
   ```

3. **Check console logs:**
   - Look for 🔍 logs to see what dates were fetched
   - Look for ❌ logs to see if there were errors

4. **Check API directly:**
   - Open `http://localhost:3000/api/properties/1/availability` in a new tab
   - You should see the JSON response with unavailableDates

### If no logs appear in console:

1. Refresh the page (hard refresh with Ctrl+F5)
2. Check that propertyId is being passed to EnquiryForm
   - Add this to browser console: `console.log('Property ID should be in component props')`
   - Check PropertyClient.tsx line where EnquiryForm is called

### If "Date is not available" error doesn't show:

1. Make sure you created test bookings in the database
2. Check that bookings have status = 'confirmed'
3. Verify the date you're trying to select matches a booked date exactly (ISO format: YYYY-MM-DD)

## Expected vs Actual

### Expected Behavior
- Form loads → API call made
- Console shows 🔍, ✅ logs
- User can select available dates
- User cannot select unavailable/past dates
- Toast message appears on invalid selection

### Actual Results
(Fill in after testing)

Date Tested: ___________
Property Tested: ___________
Results: ___________

## Success Criteria

✅ All of the following should be true:
- [ ] Component renders without errors
- [ ] Console shows availability fetch logs
- [ ] API returns unavailable dates
- [ ] User can select available dates
- [ ] User cannot select unavailable dates
- [ ] Toast error appears for invalid dates
- [ ] Form submits successfully with valid dates
- [ ] Behavior matches BookingModal

## Support

If something isn't working:
1. Check all console logs (F12 → Console)
2. Check network requests (F12 → Network)
3. Verify test data exists in database
4. Check that property.id is being passed from PropertyClient
5. Review the implementation in EnquiryForm.tsx
