# Add Test Bookings to See Grayed-Out Dates

## Quick SQL Commands to Add Test Data

Copy and paste these SQL commands into your database tool (SQLite, Database Manager, or terminal):

### Command 1: Add first test booking (Feb 1-5, 2026)
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
  'Test Guest 1',
  'test1@example.com',
  '01273 569301',
  '2026-02-01',
  '2026-02-05',
  4,
  'confirmed',
  datetime('now'),
  datetime('now')
);
```

### Command 2: Add second test booking (Feb 10-15, 2026)
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
  'Test Guest 2',
  'test2@example.com',
  '01273 569302',
  '2026-02-10',
  '2026-02-15',
  6,
  'confirmed',
  datetime('now'),
  datetime('now')
);
```

### Command 3: Add third test booking (Feb 20-25, 2026)
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
  'Test Guest 3',
  'test3@example.com',
  '01273 569303',
  '2026-02-20',
  '2026-02-25',
  5,
  'confirmed',
  datetime('now'),
  datetime('now')
);
```

## After Adding Test Data:

1. **Refresh your browser** (Ctrl+Shift+R for hard refresh)
2. **Open the booking modal** (Click "Book Now" on Brighton Seafront Villa)
3. **You should now see:**
   - Feb 1-5: Grayed out (unavailable)
   - Feb 6-9: White (available)
   - Feb 10-15: Grayed out (unavailable)
   - Feb 16-19: White (available)
   - Feb 20-25: Grayed out (unavailable)
   - Feb 26+: White (available)

## Verify It's Working:

### In Browser Console (F12):
```javascript
// Test the API response
fetch('/api/properties/1/availability')
  .then(r => r.json())
  .then(d => console.log('Unavailable:', d.unavailableDates))
```

Expected output:
```
Unavailable: ["2026-02-01", "2026-02-02", "2026-02-03", "2026-02-04", "2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13", "2026-02-14", "2026-02-20", "2026-02-21", "2026-02-22", "2026-02-23", "2026-02-24"]
```

## View Current Bookings:

To see all bookings for Brighton Seafront Villa:
```sql
SELECT 
  id,
  guest_name,
  check_in_date,
  check_out_date,
  booking_status
FROM bookings
WHERE property_name = 'Brighton Seafront Villa'
ORDER BY check_in_date;
```

## Delete Test Data (if needed):

Remove all test bookings:
```sql
DELETE FROM bookings 
WHERE property_name = 'Brighton Seafront Villa'
  AND guest_name LIKE 'Test Guest%';
```

Or delete a specific booking:
```sql
DELETE FROM bookings 
WHERE id = 123;  -- Replace 123 with actual ID
```

---

## Important Notes:

1. **Only "confirmed" or "paid" bookings show as unavailable**
   - Status must be: `booking_status = 'confirmed'` or `booking_status = 'paid'`
   - Pending bookings don't block dates

2. **Property name must match exactly**
   - The INSERT statements use: `'Brighton Seafront Villa'`
   - Check your database for the exact property name
   - If different, update the SQL accordingly

3. **Dates must be in YYYY-MM-DD format**
   - Always use: `2026-02-01` (not `01/02/2026` or other formats)

4. **Cache affects visibility**
   - API caches for 1 hour
   - Do a hard refresh (Ctrl+Shift+R) after adding data
   - Or wait 1 hour for cache to expire

---

## Getting Your Property ID:

If you don't know if you're using property 1, find the correct property:

```sql
SELECT id, title 
FROM properties 
WHERE title LIKE '%Brighton%' 
   OR title LIKE '%Seafront%';
```

Then use the correct property ID in API calls:
```
/api/properties/{id}/availability
```

