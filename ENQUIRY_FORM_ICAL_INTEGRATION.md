# EnquiryForm iCal Integration Guide

## Overview
The EnquiryForm component has been updated to include synced iCal calendar functionality, matching the implementation in the BookingModal. Users now see the same unavailable dates in the enquiry form date inputs as they do in the booking modal.

## Changes Made

### 1. Updated Component Props
**File:** `src/components/EnquiryForm.tsx`

Added `propertyId` to the `EnquiryFormProps` interface:
```typescript
interface EnquiryFormProps {
  propertyTitle?: string;
  propertySlug?: string;
  propertyId?: string;  // NEW: Required to fetch availability data
}
```

### 2. Added State Management
Added three new state variables to track availability:

```typescript
const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
const [isDateDisabled, setIsDateDisabled] = useState<Map<string, boolean>>(new Map());
```

### 3. Added Availability Fetching
Created a `useEffect` hook that fetches availability when the component mounts:

```typescript
// Fetch availability when component mounts
useEffect(() => {
  if (propertyId) {
    fetchAvailability();
  }
}, [propertyId]);

const fetchAvailability = async () => {
  if (!propertyId) return;
  try {
    setIsLoadingAvailability(true);
    const url = `/api/properties/${propertyId}/availability`;
    console.log('🔍 [iCal Enquiry] Fetching availability from:', url);
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      setUnavailableDates(data.unavailableDates || []);
      console.log('✅ [iCal Enquiry] Set unavailable dates:', data.unavailableDates);
    }
  } catch (error) {
    console.error('❌ [iCal Enquiry] Error fetching availability:', error);
    setUnavailableDates([]);
  } finally {
    setIsLoadingAvailability(false);
  }
};
```

### 4. Added Date Validation
Created a helper function to check if a date is disabled:

```typescript
const isDateDisabled = (dateStr: string): boolean => {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const date = new Date(dateStr);
  
  // Disable past dates and unavailable dates from iCal/bookings
  return date < today || unavailableDates.includes(dateStr);
};
```

### 5. Updated Date Inputs
Modified both the "Arrival" and "Departure" date input fields to:
- Show disabled styling when unavailable dates are attempted to be selected
- Display toast error message when user tries to select an unavailable date
- Automatically clear invalid selection

```typescript
<Input
  id="checkin"
  name="checkin"
  type="date"
  required
  className="rounded-xl text-base py-6 min-h-[48px] pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
  onChange={(e) => {
    if (isDateDisabled(e.target.value)) {
      e.target.value = '';
      toast.error('This date is not available. Please select another date.');
    }
  }}
/>
```

### 6. Updated PropertyClient
**File:** `src/app/properties/[slug]/PropertyClient.tsx`

Updated the EnquiryForm component call to pass the property ID:

```typescript
<EnquiryForm 
  propertyTitle={property.title} 
  propertySlug={slug} 
  propertyId={property.id}  // NEW: Pass property ID for availability fetch
/>
```

## How It Works

### Data Flow
1. **Component Mount**: When EnquiryForm loads, it checks if `propertyId` is provided
2. **Availability Fetch**: If propertyId exists, it fetches availability from `/api/properties/{id}/availability`
3. **Date Parsing**: The API returns `unavailableDates` array (ISO date strings)
4. **User Interaction**: When user changes date inputs, the `isDateDisabled()` function checks against unavailable dates
5. **User Feedback**: If unavailable date is selected, it's cleared and a toast error is shown

### API Endpoint
The feature uses the existing availability API endpoint:
- **Route**: `GET /api/properties/[id]/availability`
- **Returns**: `{ unavailableDates: string[], bookedRanges: any[] }`
- **Source Data**: Combines iCal feed data with database bookings

## Debugging

The implementation includes color-coded console logging for easy troubleshooting:

```
🔍 [iCal Enquiry] - Information logs (API calls, data received)
✅ [iCal Enquiry] - Success logs (dates set, operations completed)
❌ [iCal Enquiry] - Error logs (failed API calls, exceptions)
```

Check the browser console (F12) to see these logs while testing.

## Testing

### Prerequisites
1. Ensure the property has an `iCalURL` set in the database
2. Create test bookings with confirmed status in the database
3. Or create iCal events in an external calendar feed (Airbnb, Booking.com, etc.)

### Test Steps
1. Navigate to a property page
2. Scroll down to the enquiry form
3. Open browser developer tools (F12) → Console tab
4. Try to select dates:
   - Available dates should be selectable normally
   - Unavailable dates should trigger the error message and clear the input
5. Check console for debug logs with 🔍, ✅, ❌ prefixes

### Expected Behavior
- Form loads and fetches availability in background
- Past dates cannot be selected
- Dates that match database bookings or iCal events cannot be selected
- Toast notification appears when unavailable dates are attempted
- Logging output appears in browser console for debugging

## Consistency with BookingModal

The EnquiryForm implementation mirrors the BookingModal implementation:
- Same availability API endpoint
- Same date validation logic
- Same debug logging format
- Same user feedback (toast messages)
- Same state management pattern

## Future Enhancements

Possible future improvements:
1. Add visual calendar UI with grayed-out unavailable dates (like BookingModal)
2. Add loading skeleton while availability is being fetched
3. Add date range validation (ensure checkout > checkin)
4. Cache availability data client-side to reduce API calls
5. Add a "Request custom dates" button for fully booked dates

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/EnquiryForm.tsx` | Added propertyId prop, availability fetching, date validation |
| `src/app/properties/[slug]/PropertyClient.tsx` | Pass property.id to EnquiryForm |

## Related Files
- `src/lib/ical-parser.ts` - iCal parsing utility
- `src/app/api/properties/[id]/availability/route.ts` - Availability API endpoint
- `src/components/BookingModal.tsx` - Similar implementation for booking modal
