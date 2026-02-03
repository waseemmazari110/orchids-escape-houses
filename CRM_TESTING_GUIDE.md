# Custom CRM System - Testing Guide

**Created:** February 2, 2026  
**Version:** 1.0  
**Status:** Ready for Testing  

---

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Database Migration Testing](#database-migration-testing)
3. [CRM Sync Features Testing](#crm-sync-features-testing)
4. [API Endpoints Testing](#api-endpoints-testing)
5. [Integration Testing](#integration-testing)
6. [Dashboard Testing](#dashboard-testing)
7. [Performance Testing](#performance-testing)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Testing Setup

### Step 1: Run Database Migration

```bash
# CORRECT: Run this Node.js migration script
node migrate-crm.mjs
```

**✅ Expected Output:**
```
✅ Creating table: crm_contacts
✅ Creating table: crm_properties
✅ Creating table: crm_memberships
✅ Creating table: crm_interactions
✅ Creating table: crm_segments
✅ Successful: 21
✅ CRM tables found: [10 tables listed]
```

**⚠️ IMPORTANT:** Drizzle will ask if tables are "created or renamed". 
**Always select "create table"** or **"create column"** (do NOT select rename).

For each prompt, press Enter to select the default "create" option.

**Expected Output:**
```
✅ CRM tables created successfully
  - crm_contacts
  - crm_properties  
  - crm_enquiries
  - crm_memberships
  - crm_interactions
  - crm_activity_log
  - crm_segments
```

### Step 2: Verify Database Tables

```bash
# Check database structure (if using SQLite CLI)
sqlite3 local.db ".tables"
```

**Expected Result:**
You should see all 7 new CRM tables listed.

### Step 3: Start Development Server

```bash
npm run dev
```

Server should start on `http://localhost:3000`

---

## Database Migration Testing

### Test 1: Verify CRM Tables Exist

**Query Database:**
```sql
SELECT name FROM sqlite_master 
WHERE type='table' 
AND name LIKE 'crm_%';
```

**Expected Result:**
```
crm_contacts
crm_properties
crm_enquiries
crm_memberships
crm_interactions
crm_activity_log
crm_segments
```

✅ **Pass Criteria:** All 7 tables exist

### Test 2: Verify Table Schemas

**Check crm_contacts columns:**
```sql
PRAGMA table_info(crm_contacts);
```

**Expected Columns:**
- id, type, first_name, last_name, email, phone
- address, city, postcode, country
- business_name, tax_id, bank_details
- status, notes, created_at, updated_at
- last_contacted_at, user_id

✅ **Pass Criteria:** All columns present with correct types

### Test 3: Verify Indexes

**Check indexes:**
```sql
SELECT name FROM sqlite_master 
WHERE type='index' 
AND tbl_name LIKE 'crm_%';
```

**Expected Indexes:**
- idx_crm_contacts_email
- idx_crm_contacts_type
- idx_crm_properties_ownerId
- idx_crm_enquiries_status
- etc.

✅ **Pass Criteria:** All indexes created

---

## CRM Sync Features Testing

### Test 4: Owner Signup → CRM Sync

**Steps:**
1. Go to `/owner-sign-up`
2. Fill in owner registration form:
   - Name: Test Owner
   - Email: testowner@example.com
   - Phone: +44 1234567890
   - Company: Test Properties Ltd
3. Submit form

**Verification:**
```sql
SELECT * FROM crm_contacts 
WHERE email = 'testowner@example.com';
```

**Expected Result:**
```
id: [UUID]
type: owner
firstName: Test
lastName: Owner
email: testowner@example.com
phone: +44 1234567890
businessName: Test Properties Ltd
status: active
userId: [user_id]
created_at: [timestamp]
```

✅ **Pass Criteria:** 
- Contact created in CRM
- Type = 'owner'
- userId linked correctly
- Status = 'active'

**Check Activity Log:**
```sql
SELECT * FROM crm_activity_log 
WHERE entity_type = 'contact' 
AND action = 'created'
ORDER BY timestamp DESC LIMIT 1;
```

✅ **Pass Criteria:** Activity logged with reason = 'Owner signup'

---

### Test 5: Property Creation → CRM Sync

**Prerequisites:**
- Must have completed Test 4 (owner exists in CRM)

**Steps:**
1. Login as the owner created in Test 4
2. Go to owner dashboard
3. Click "Add Property"
4. Fill in property details:
   - Title: Luxury Manor House
   - Location: Lake District
   - Bedrooms: 8
   - Bathrooms: 6
   - Max Guests: 16
5. Submit property

**Verification:**
```sql
SELECT * FROM crm_properties 
WHERE title = 'Luxury Manor House';
```

**Expected Result:**
```
id: [UUID]
owner_id: [owner_contact_id]
property_id: [main_property_id]
title: Luxury Manor House
location: Lake District
bedrooms: 8
bathrooms: 6
max_guests: 16
listing_status: draft
view_count: 0
enquiry_count: 0
created_at: [timestamp]
```

✅ **Pass Criteria:**
- Property synced to CRM
- owner_id matches crm_contacts.id
- property_id matches properties.id
- All fields populated correctly

**Check Activity Log:**
```sql
SELECT * FROM crm_activity_log 
WHERE entity_type = 'property' 
AND action = 'created'
ORDER BY timestamp DESC LIMIT 1;
```

✅ **Pass Criteria:** Activity logged

---

### Test 6: Guest Enquiry → CRM Sync

**Prerequisites:**
- Property must exist (from Test 5)

**Steps:**
1. Go to property detail page (e.g., `/properties/luxury-manor-house`)
2. Click "Enquire" or "Check Availability"
3. Fill in enquiry form:
   - Name: John Smith
   - Email: john.smith@example.com
   - Phone: +44 7700900123
   - Check-in: 2026-03-15
   - Check-out: 2026-03-18
   - Group Size: 12
   - Occasion: Birthday Party
   - Message: Looking to celebrate a 30th birthday
4. Submit enquiry

**Verification Step 1: Check Guest Contact Created**
```sql
SELECT * FROM crm_contacts 
WHERE email = 'john.smith@example.com';
```

**Expected Result:**
```
id: [UUID]
type: guest
firstName: John
lastName: Smith
email: john.smith@example.com
phone: +44 7700900123
event_type: Birthday Party
status: active
created_at: [timestamp]
```

✅ **Pass Criteria:** Guest contact auto-created

**Verification Step 2: Check Enquiry Created**
```sql
SELECT * FROM crm_enquiries 
WHERE guest_email = 'john.smith@example.com';
```

**Expected Result:**
```
id: [UUID]
contact_id: [guest_contact_id]
owner_id: [owner_contact_id]
property_id: [crm_property_id]
status: new
event_date: 2026-03-15
estimated_guests: 12
guest_name: John Smith
message: Looking to celebrate a 30th birthday
priority: medium
source: form
created_at: [timestamp]
```

✅ **Pass Criteria:**
- Enquiry created in CRM
- contact_id = guest contact
- owner_id = property owner
- Status = 'new'

**Verification Step 3: Check Property Enquiry Count Updated**
```sql
SELECT enquiry_count FROM crm_properties 
WHERE title = 'Luxury Manor House';
```

**Expected Result:** `enquiry_count: 1`

✅ **Pass Criteria:** Enquiry count incremented

**Verification Step 4: Check Interaction Logged**
```sql
SELECT * FROM crm_interactions 
WHERE contact_id = [guest_contact_id]
AND type = 'message';
```

**Expected Result:**
```
type: message
content: Looking to celebrate a 30th birthday
direction: inbound
initiated_by: contact
created_at: [timestamp]
```

✅ **Pass Criteria:** Interaction logged

---

### Test 7: Payment → Membership Sync

**Prerequisites:**
- Owner must exist in CRM

**Steps:**
1. Login as owner
2. Go to `/choose-plan`
3. Select a plan (e.g., Bronze - £450/year)
4. Complete payment (use Stripe test card: 4242 4242 4242 4242)
5. Wait for webhook to process

**Verification:**
```sql
SELECT * FROM crm_memberships 
WHERE contact_id = [owner_contact_id]
ORDER BY created_at DESC LIMIT 1;
```

**Expected Result:**
```
id: [UUID]
contact_id: [owner_contact_id]
plan_tier: bronze
plan_price: 450.00
billing_cycle: annual
start_date: [today]
end_date: [today + 1 year]
status: active
auto_renew: 1
stripe_customer_id: cus_[...]
stripe_subscription_id: sub_[...]
last_payment_date: [today]
last_payment_amount: 450.00
next_payment_date: [today + 1 year]
created_at: [timestamp]
```

✅ **Pass Criteria:**
- Membership created
- Plan details correct
- Stripe IDs stored
- Status = 'active'

**Check Interaction:**
```sql
SELECT * FROM crm_interactions 
WHERE contact_id = [owner_contact_id]
AND type = 'status_change'
ORDER BY created_at DESC LIMIT 1;
```

**Expected Result:**
```
content: Membership activated: bronze
direction: outbound
initiated_by: system
```

✅ **Pass Criteria:** Interaction logged

---

## API Endpoints Testing

### Test 8: GET /api/crm/contacts

**Using cURL:**
```bash
curl -X GET http://localhost:3000/api/crm/contacts \
  -H "Cookie: [your_admin_session_cookie]"
```

**Using Postman:**
1. GET `http://localhost:3000/api/crm/contacts`
2. Login as admin first to get session cookie

**Expected Response:**
```json
[
  {
    "id": "uuid-1",
    "type": "owner",
    "firstName": "Test",
    "lastName": "Owner",
    "email": "testowner@example.com",
    "status": "active",
    ...
  },
  {
    "id": "uuid-2",
    "type": "guest",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "status": "active",
    ...
  }
]
```

✅ **Pass Criteria:**
- Returns array of contacts
- Both owner and guest visible
- All fields populated

**Test Filters:**
```bash
# Filter by type
GET /api/crm/contacts?type=owner

# Filter by status
GET /api/crm/contacts?status=active

# Search
GET /api/crm/contacts?search=john
```

✅ **Pass Criteria:** Filters work correctly

---

### Test 9: GET /api/crm/enquiries

**Request:**
```bash
curl -X GET http://localhost:3000/api/crm/enquiries \
  -H "Cookie: [your_admin_session_cookie]"
```

**Expected Response:**
```json
[
  {
    "id": "uuid-1",
    "contactId": "guest-uuid",
    "ownerId": "owner-uuid",
    "propertyId": "property-uuid",
    "status": "new",
    "guestName": "John Smith",
    "guestEmail": "john.smith@example.com",
    "eventDate": "2026-03-15",
    "estimatedGuests": 12,
    "message": "Looking to celebrate a 30th birthday",
    "priority": "medium",
    "source": "form",
    "createdAt": "2026-02-02T10:30:00Z"
  }
]
```

✅ **Pass Criteria:**
- Returns enquiries
- Sorted by date (newest first)
- All fields present

**Test Filters:**
```bash
# Filter by status
GET /api/crm/enquiries?status=new

# Filter by owner
GET /api/crm/enquiries?ownerId=[owner-uuid]

# Limit results
GET /api/crm/enquiries?limit=10
```

✅ **Pass Criteria:** Filters work

---

### Test 10: PUT /api/crm/enquiries (Update Status)

**Request:**
```bash
curl -X PUT http://localhost:3000/api/crm/enquiries \
  -H "Cookie: [your_admin_session_cookie]" \
  -H "Content-Type: application/json" \
  -d '{
    "enquiryId": "enquiry-uuid",
    "status": "contacted",
    "notes": "Called guest, awaiting confirmation"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Enquiry updated"
}
```

**Verification:**
```sql
SELECT status, internal_notes, last_updated_at 
FROM crm_enquiries 
WHERE id = 'enquiry-uuid';
```

**Expected Result:**
```
status: contacted
internal_notes: Called guest, awaiting confirmation
last_updated_at: [new timestamp]
```

✅ **Pass Criteria:** Status updated successfully

---

### Test 11: GET /api/crm/stats

**Request:**
```bash
curl -X GET http://localhost:3000/api/crm/stats \
  -H "Cookie: [your_admin_session_cookie]"
```

**Expected Response:**
```json
{
  "contacts": {
    "total": 2,
    "owners": 1,
    "guests": 1,
    "active": 2
  },
  "properties": {
    "total": 1,
    "live": 0,
    "pending": 0,
    "draft": 1,
    "totalViews": 0,
    "totalEnquiries": 1
  },
  "enquiries": {
    "total": 1,
    "new": 1,
    "contacted": 0,
    "booked": 0,
    "lost": 0,
    "conversionRate": "0.00"
  },
  "memberships": {
    "total": 1,
    "active": 1,
    "expiringSoon": 0,
    "expired": 0,
    "bronze": 1,
    "silver": 0,
    "gold": 0
  },
  "recentActivity": {
    "recentEnquiries": [...],
    "recentContacts": [...]
  }
}
```

✅ **Pass Criteria:**
- Stats calculated correctly
- All categories present
- Conversion rate formula correct

---

## Integration Testing

### Test 12: End-to-End Owner Journey

**Complete Flow:**
1. ✅ Owner signs up → Contact created in CRM
2. ✅ Owner adds property → Property synced to CRM
3. ✅ Owner purchases membership → Membership synced to CRM
4. ✅ Guest submits enquiry → Guest contact + enquiry in CRM
5. ✅ Admin updates enquiry status → CRM enquiry updated

**Verification:**
```sql
-- Count all CRM records
SELECT 
  (SELECT COUNT(*) FROM crm_contacts) as contacts,
  (SELECT COUNT(*) FROM crm_properties) as properties,
  (SELECT COUNT(*) FROM crm_enquiries) as enquiries,
  (SELECT COUNT(*) FROM crm_memberships) as memberships,
  (SELECT COUNT(*) FROM crm_interactions) as interactions,
  (SELECT COUNT(*) FROM crm_activity_log) as activities;
```

**Expected Result:**
```
contacts: 2 (1 owner + 1 guest)
properties: 1
enquiries: 1
memberships: 1
interactions: 3+ (signup, enquiry, membership activation)
activities: 4+ (all creates logged)
```

✅ **Pass Criteria:** All systems integrated correctly

---

### Test 13: Existing Features Still Work

**Test Previous Features:**

1. **User Signup/Login:**
   - ✅ Owner can sign up
   - ✅ Owner can login
   - ✅ Session persists
   - ✅ Password reset works

2. **Property Management:**
   - ✅ Create property still works
   - ✅ Edit property still works
   - ✅ Property list displays correctly
   - ✅ Property details page loads

3. **Enquiry Form:**
   - ✅ Form submits successfully
   - ✅ Email sent to owner
   - ✅ Enquiry stored in main database
   - ✅ No errors in console

4. **Payment System:**
   - ✅ Stripe checkout works
   - ✅ Webhooks process correctly
   - ✅ Payment status updated
   - ✅ Subscription created

5. **iCal System:**
   - ✅ Calendar import still works
   - ✅ Availability API responds
   - ✅ Dates blocked correctly

✅ **Pass Criteria:** NO REGRESSIONS - all existing features work

---

## Performance Testing

### Test 14: CRM Query Performance

**Test Query Speed:**
```sql
-- Time this query
.timer on
SELECT COUNT(*) FROM crm_contacts;
.timer off
```

**Expected:** < 10ms for 1000 records

✅ **Pass Criteria:** Queries execute quickly

**Test Complex Join:**
```sql
SELECT 
  c.email,
  COUNT(e.id) as enquiry_count,
  COUNT(p.id) as property_count
FROM crm_contacts c
LEFT JOIN crm_enquiries e ON c.id = e.contact_id
LEFT JOIN crm_properties p ON c.id = p.owner_id
WHERE c.type = 'owner'
GROUP BY c.id;
```

**Expected:** < 50ms

✅ **Pass Criteria:** Complex queries optimized

---

### Test 15: Sync Performance (Non-Blocking)

**Steps:**
1. Submit enquiry form
2. Measure response time

**Expected:**
- Form response: < 500ms
- CRM sync happens asynchronously
- No blocking

✅ **Pass Criteria:** User experience not impacted by CRM sync

---

## Dashboard Testing

### Test 16: CRM Dashboard View (Future Enhancement)

**Expected Dashboard URL:** `/admin/crm`

**Elements to Test:**
- ✅ Stats cards display correctly
- ✅ Contact list loads
- ✅ Enquiry list loads
- ✅ Filters work
- ✅ Search works
- ✅ Pagination works (if > 100 items)

✅ **Pass Criteria:** Dashboard functional and responsive

---

## Troubleshooting

### Issue 1: CRM Sync Fails

**Symptoms:**
- Enquiries submitted but not in CRM
- Console shows errors

**Debugging:**
```bash
# Check console for errors
console.log in crm-sync.ts

# Check database
SELECT * FROM crm_contacts WHERE email = '[test-email]';
```

**Common Fixes:**
1. Ensure migration ran: `npx drizzle-kit push:sqlite`
2. Check userId exists in main user table
3. Verify foreign keys enabled: `PRAGMA foreign_keys = ON;`

---

### Issue 2: API Returns 401 Unauthorized

**Cause:** Not logged in as admin

**Fix:**
1. Login as admin at `/admin/login`
2. Get session cookie from browser
3. Include cookie in API requests

---

### Issue 3: Duplicate Contact Error

**Cause:** Email already exists in crm_contacts

**Fix:**
```sql
DELETE FROM crm_contacts WHERE email = '[duplicate-email]';
```

Then retry the operation.

---

## Test Summary Checklist

### Database
- [ ] All 7 CRM tables created
- [ ] All indexes created
- [ ] Foreign keys working

### Sync Features
- [ ] Owner signup syncs to CRM
- [ ] Property creation syncs to CRM
- [ ] Enquiry submission syncs to CRM
- [ ] Payment syncs membership to CRM
- [ ] Activity logged for all actions

### API Endpoints
- [ ] GET /api/crm/contacts works
- [ ] GET /api/crm/enquiries works
- [ ] PUT /api/crm/enquiries works
- [ ] GET /api/crm/stats works
- [ ] All filters work
- [ ] Authentication required (admin only)

### Integration
- [ ] End-to-end flow works
- [ ] No regressions in existing features
- [ ] CRM sync is non-blocking
- [ ] Error handling works

### Performance
- [ ] Queries fast (< 50ms)
- [ ] No impact on user experience
- [ ] Console has no errors

### Data Integrity
- [ ] No orphaned records
- [ ] Foreign keys enforced
- [ ] Timestamps accurate
- [ ] Status transitions valid

---

## Final Verification

**Run this comprehensive check:**

```sql
-- Verify all CRM data integrity
SELECT 'Contacts' as table_name, COUNT(*) as count FROM crm_contacts
UNION ALL
SELECT 'Properties', COUNT(*) FROM crm_properties
UNION ALL
SELECT 'Enquiries', COUNT(*) FROM crm_enquiries
UNION ALL
SELECT 'Memberships', COUNT(*) FROM crm_memberships
UNION ALL
SELECT 'Interactions', COUNT(*) FROM crm_interactions
UNION ALL
SELECT 'Activity Log', COUNT(*) FROM crm_activity_log;
```

**Expected Output Example:**
```
table_name     | count
--------------+-------
Contacts      |   2
Properties    |   1
Enquiries     |   1
Memberships   |   1
Interactions  |   3
Activity Log  |   4
```

---

## Test Report Template

After completing all tests, fill this out:

```
CRM System Test Report
Date: __________
Tester: __________

Database Migration: ✅ / ❌
CRM Sync Features: ✅ / ❌
API Endpoints: ✅ / ❌
Integration: ✅ / ❌
Performance: ✅ / ❌
No Regressions: ✅ / ❌

Issues Found:
1. _____________________
2. _____________________

Overall Status: PASS / FAIL

Notes:
_____________________
_____________________
```

---

**Testing Complete!** 🎉

If all tests pass, the Custom CRM system is ready for production deployment.
