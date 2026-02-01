# Enhanced EnquiryForm - Visual Calendar with Disabled Dates

## What Changed

The EnquiryForm date inputs have been upgraded from simple HTML date inputs to a visual calendar interface with disabled/grayed-out dates, matching the BookingModal experience.

## Features

### 1. **Visual Calendar Picker**
- Click on "Arrival" button to open a calendar popover
- Click on "Departure" button to open a calendar popover
- Shows dates in format: "dd MMM yyyy" (e.g., "15 Feb 2026")
- Selected dates remain visible in the buttons

### 2. **Disabled Dates (Grayed Out)**
- Dates from iCal feeds are visually disabled
- Database booking dates are visually disabled
- Past dates cannot be selected
- Users can see which dates are unavailable at a glance

### 3. **Smart Date Validation**
- **Arrival date**: Can select any available date
- **Departure date**: Must be after arrival date
  - Automatically disables all dates on or before check-in date
  - Shows helpful message if user tries to select invalid date
- Toast error notifications for invalid selections

### 4. **Information Hints**
- Blue info box shows: "Grayed-out dates are unavailable (booked or synced from your calendar)"
- Departure calendar shows selected arrival date for reference
- Helps users understand why certain dates are disabled

## Implementation Details

### Components Used
```typescript
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
```

### Date Management
```typescript
const [checkInDate, setCheckInDate] = useState<Date | undefined>(undefined);
const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(undefined);
const [checkInPopoverOpen, setCheckInPopoverOpen] = useState(false);
const [checkOutPopoverOpen, setCheckOutPopoverOpen] = useState(false);
```

### Disabled Date Logic
```typescript
const isDateDisabled = (date: Date): boolean => {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const dateStr = date.toISOString().split('T')[0];
  
  // Disable past dates and unavailable dates from iCal/bookings
  return date < today || unavailableDates.includes(dateStr);
};
```

### Form Submission
The selected dates are converted to ISO format (YYYY-MM-DD) before submission:
```typescript
const checkinStr = format(checkInDate, "yyyy-MM-dd");
const checkoutStr = format(checkOutDate, "yyyy-MM-dd");
```

## User Experience

### Before
- Simple HTML date inputs
- No visual indication of unavailable dates
- Users could select and submit unavailable dates
- No validation feedback

### After
- Beautiful calendar interface
- Grayed-out dates show availability at a glance
- Dates cannot be selected if unavailable
- Real-time validation with toast messages
- Better visual hierarchy and design consistency

## How It Works

### User Flow
1. User clicks "Arrival" button → Calendar popover opens
2. User selects an available date (unavailable dates are grayed out)
3. Selected date appears in the button
4. User clicks "Departure" button → Calendar popover opens
5. Dates on or before check-in date are disabled
6. User selects a later available date
7. Form shows both dates selected
8. User fills other fields and submits
9. Dates are sent to API in ISO format

### Data Flow
```
Property Page Load
  ↓
EnquiryForm receives propertyId
  ↓
Fetches /api/properties/{id}/availability
  ↓
Gets unavailableDates array
  ↓
Calendar disables those dates
  ↓
User selects dates via calendar
  ↓
Dates stored in state
  ↓
Form submission uses state values
  ↓
API receives ISO-formatted dates
```

## Integration with Availability API

The form uses the same availability endpoint as BookingModal:

**Endpoint:** `GET /api/properties/{id}/availability`

**Response:**
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
  "bookedRanges": [...]
}
```

## Files Modified

| File | Changes |
|------|---------|
| `src/components/EnquiryForm.tsx` | Added calendar UI, popover state, date management, validation |

## Imports Added
```typescript
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
```

## CSS Classes Used
- `rounded-xl` - Rounded button corners
- `w-full` - Full width buttons
- `h-12` - Standard button height
- `bg-blue-50` - Light blue info box background
- `border-blue-200` - Blue info box border
- `text-gray-400` - Icon color
- `opacity-50` - Disabled date opacity

## Browser Support
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design adapts to mobile/tablet/desktop
- Touch-friendly calendar interface on mobile

## Accessibility
- Proper ARIA labels on buttons
- Keyboard navigation through calendar
- Screen reader friendly date format
- Semantic HTML structure

## Performance
- Calendar only fetches data once on component mount
- Efficient date checking with string comparison
- Memoized validation function
- No unnecessary re-renders

## Testing Checklist

✅ When opening enquiry form:
- Calendar popover appears on button click
- Unavailable dates are grayed out
- Available dates are selectable

✅ When selecting arrival date:
- Date appears in button
- Popover closes automatically
- Button shows formatted date

✅ When selecting departure date:
- Dates before/on check-in are disabled
- Available dates after check-in are selectable
- Info box shows check-in date

✅ Form submission:
- Both dates are required
- Dates are sent in ISO format
- Validation error if dates missing
- Success message on submit

## Related Features
- **BookingModal**: Similar calendar implementation for bookings
- **Availability API**: `/api/properties/{id}/availability`
- **iCal Parser**: `src/lib/ical-parser.ts`
- **Database Integration**: Combines iCal feeds + booking records
