# Owner Enquiry Dashboard - Implementation Guide

## Overview

The owner enquiry dashboard allows property owners to view and manage all customer enquiries received for their properties directly from the owner dashboard.

## Features Implemented

### 1. New API Endpoint: `/api/owner/enquiries`

**GET Request**
- Fetches all enquiries for the logged-in owner's properties
- Returns enquiries with guest details, property info, and status
- Requires authentication
- Returns empty array if owner has no enquiries

**PATCH Request**
- Updates the status of an enquiry
- Required fields: `enquiryId`, `status`
- Validates ownership before updating
- Returns success/error response

**Response Format:**
```json
{
  "enquiries": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "guestName": "John Smith",
      "propertyName": "Luxury Manor House",
      "guestEmail": "john@example.com",
      "guestPhone": "+44 1234 567890",
      "message": "Is the property dog-friendly?",
      "status": "new",
      "createdAt": "2024-01-15T10:30:00Z",
      "propertyLocation": "Cotswolds"
    }
  ]
}
```

### 2. Dashboard UI Updates

**Navigation**
- Added "Enquiries" menu item to sidebar navigation
- Shows in both desktop sidebar and mobile menu
- Uses Mail icon from lucide-react

**Enquiries View**
- Accessible at `/owner-dashboard?view=enquiries` or via sidebar
- Displays professional table of all enquiries

**Table Columns:**
| Column | Purpose |
|--------|---------|
| Guest Name | Customer name |
| Property | Property title |
| Email | Clickable email link (opens mailto) |
| Phone | Clickable phone link (opens tel) |
| Date | Formatted UK date (DD MMM YYYY) |
| Status | Dropdown to change status (new, contacted, converted) |
| Actions | Reply button to send email |

**Status Filter:**
- All: Show all enquiries
- New: Show uncontacted enquiries
- Contacted: Show enquiries owner has replied to
- Converted: Show enquiries that became bookings

**Additional Sections:**
- Empty state when no enquiries with helpful message
- Recent message preview showing latest 3 enquiries' messages

### 3. Database Integration

Uses existing CRM tables:
- `crm_enquiries`: Stores enquiry data with status field
- `crm_contacts`: Links enquiries to owners via userId
- `crm_properties`: Provides property details

**Status Values:**
- `new` - Initial enquiry received
- `contacted` - Owner has replied
- `converted` - Customer converted to booking

### 4. State Management

**Dashboard States:**
- `enquiries`: Array of all owner enquiries
- `loadingEnquiries`: Boolean for loading state
- `enquiryStatusFilter`: Current filter selection
- `activeView`: Set to 'enquiries' when viewing

**Handler Functions:**
- `handleEnquiryStatusChange(enquiryId, newStatus)` - Updates status via API
- Shows toast notifications for success/error

## How to Use

### For Property Owners

1. **View Dashboard**
   - Log in at `/owner/login` as a property owner
   - Go to `/owner-dashboard`

2. **Access Enquiries**
   - Click "Enquiries" in the sidebar navigation
   - View all customer enquiries for your properties

3. **Manage Enquiries**
   - **Reply**: Click "Reply" button to email customer
   - **Update Status**: Use dropdown to mark as Contacted/Converted
   - **Filter**: Use status filter to view specific enquiries

4. **View Details**
   - Guest name, email, phone clearly displayed
   - Full enquiry message visible in preview section
   - Property name shows which property was enquired about
   - Date shows when enquiry was received

### For Testing

**Test Flow:**
1. Owner logs in to dashboard
2. Submit test enquiry for owner's property (via public site)
3. Enquiry syncs to `crm_enquiries` table
4. Owner refreshes dashboard (or views Enquiries tab)
5. Enquiry appears in table
6. Owner can update status
7. Status updates in real-time

**Test Data:**
```sql
-- Check enquiries for owner
SELECT e.*, p.title as property_name 
FROM crm_enquiries e
JOIN crm_properties p ON e.property_id = p.id
WHERE e.owner_id = (SELECT id FROM crm_contacts WHERE user_id = 'OWNER_USER_ID')
ORDER BY e.created_at DESC;
```

## API Integration Details

### Authentication
- Uses Next.js auth session from `better-auth`
- Validates user is owner before returning enquiries
- Rejects requests without valid session

### Error Handling
- Missing owner contact returns empty array (no error)
- Unauthorized access returns 401
- Validation errors return 400
- Database errors return 500

### Performance
- Direct database queries (no N+1 issues)
- Ordered by creation date DESC
- Lightweight response payload

## File Locations

**API Route:**
- `src/app/api/owner/enquiries/route.ts`

**Dashboard Page:**
- `src/app/owner-dashboard/page.tsx` (updated)
- Lines: Navigation ~700, View ~1550, Handler ~375, State ~213

**Related Files:**
- `src/lib/crm-sync.ts` - CRM sync engine
- `src/db/schema.ts` - Database schema (crmEnquiries table)

## Deployment

### Vercel Deployment
- Build succeeds: ✅ 0 errors, 168 pages
- Ready for production deployment
- No environment variables needed

### Testing on Production
1. Deploy to Vercel: `git push origin main`
2. Owner logs in at production URL
3. Submit enquiry via property page
4. Verify enquiry appears in owner dashboard

## Future Enhancements

Potential improvements for next phase:
1. Bulk status updates
2. Enquiry search functionality
3. Email templates for replies
4. Enquiry conversion tracking
5. Analytics on enquiry response time
6. Automated follow-up reminders
7. Enquiry export to CSV
8. Integration with email provider API

## Related Features

This feature completes the CRM enquiry sync flow:
- ✅ Enquiry submission (`/api/enquiry`)
- ✅ Enquiry sync to CRM (`syncEnquiryToCRM`)
- ✅ **NEW: Owner dashboard display**
- ⏳ Email notification to owner (future)
- ⏳ Automated follow-up workflow (future)

## Support

For issues or questions about the enquiry dashboard:
1. Check that owner has properties in the system
2. Verify enquiries are in `crm_enquiries` table
3. Check that `crm_contacts` has entry for owner's user ID
4. Review browser console for errors
5. Check server logs for API errors
