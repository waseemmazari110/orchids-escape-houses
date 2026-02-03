#!/usr/bin/env pwsh

<#
CRM Integration Test Helper Script
Run this after making changes to verify all CRM flows are working
#>

Write-Host "
╔════════════════════════════════════════════════════════════╗
║   CRM Integration Test Suite                              ║
║   Group Escape Houses Platform                            ║
╚════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "`n📋 Pre-Test Checklist:`n" -ForegroundColor Yellow
Write-Host "✓ Dev server running on http://localhost:3000"
Write-Host "✓ Database accessible (TURSO_CONNECTION_URL set)"
Write-Host "✓ Changes compiled (run: npm run dev)"
Write-Host "`n"

# Test 1: Owner Signup
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "TEST 1: Owner Signup & CRM Sync" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

$ownerEmail = "test-owner-$(Get-Random -Maximum 9999)@example.com"
Write-Host "
Steps:
1. Open http://localhost:3000/owner-sign-up in browser
2. Register with email: $ownerEmail
3. Password: AnySecurePassword123!
4. Check console for: ✅ Owner synced to CRM for $ownerEmail

Expected Results:
  ✅ Auth successful
  ✅ Dashboard opens
  ✅ Contact created in crm_contacts table
  ✅ Status logged in admin_activity_log
" -ForegroundColor Green

# Test 2: Property Creation
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "TEST 2: Property Creation & CRM Sync" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Write-Host "
Steps:
1. After owner login, go to Dashboard
2. Create new property with:
   - Title: Test Property - $(Get-Random -Maximum 999)
   - Location: Test City
   - Bedrooms: 4, Bathrooms: 2
3. Check console for: ✅ Property synced to CRM for [owner email]

Expected Results:
  ✅ Property created successfully
  ✅ Property appears in dashboard
  ✅ Record in crm_properties table
  ✅ Activity logged in admin_activity_log
" -ForegroundColor Green

# Test 3: Enquiry Submission
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "TEST 3: Enquiry Submission & CRM Sync (JUST FIXED)" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

$guestEmail = "guest-test-$(Get-Random -Maximum 9999)@example.com"
Write-Host "
Steps:
1. Navigate to any property page
2. Fill out enquiry form with:
   - Name: Test Guest
   - Email: $guestEmail
   - Phone: 1234567890
   - Message: Testing CRM sync
   - Dates: 2024-02-01 to 2024-02-05
   - Guests: 4
3. Submit form
4. Check console for: ✅ Enquiry synced to CRM for $guestEmail

Expected Results:
  ✅ Form submitted successfully
  ✅ Confirmation message shown
  ✅ Email sent to property owner
  ✅ Guest contact in crm_contacts
  ✅ Enquiry record in crm_enquiries with status='new'
  ✅ Activity logged in admin_activity_log
" -ForegroundColor Green

# Test 4: Payment Webhook (Optional)
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "TEST 4: Payment → Membership CRM (Optional - Requires Stripe CLI)" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Write-Host "
Steps (if you have Stripe CLI set up):
1. Complete checkout on any property
2. Use test card: 4242 4242 4242 4242
3. Check console for: ✅ Membership synced to CRM

To set up Stripe webhooks:
  Follow: WEBHOOK_SETUP_GUIDE.md

Expected Results (when webhook working):
  ✅ Membership created in crm_memberships
  ✅ Contact tier updated to paid plan
  ✅ Activity logged
" -ForegroundColor Yellow

# Database Verification Commands
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "DATABASE VERIFICATION QUERIES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "
After running tests, verify data was synced:

1. Check all owners synced:
   SELECT COUNT(*) as owner_count FROM crm_contacts WHERE type = 'owner';

2. Check all properties synced:
   SELECT COUNT(*) as property_count FROM crm_properties;

3. Check all enquiries synced:
   SELECT COUNT(*) as enquiry_count FROM crm_enquiries;

4. View latest enquiry:
   SELECT id, guest_name, guest_email, status, created_at
   FROM crm_enquiries
   ORDER BY created_at DESC LIMIT 1;

5. View activity log:
   SELECT * FROM admin_activity_log
   ORDER BY created_at DESC LIMIT 10;
" -ForegroundColor Cyan

# Troubleshooting
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "TROUBLESHOOTING" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "
❌ Issue: 500 error on enquiry submission
✅ Solution: Check console for exact error. If schema error, run:
   PRAGMA table_info(crm_enquiries);
   Compare with src/db/schema.ts

❌ Issue: Console shows ❌ instead of ✅
✅ Solution: Non-blocking errors logged but didn't break functionality
   Check exact error message in console
   Verify database table exists

❌ Issue: Data not appearing in CRM tables
✅ Solution: 
   1. Verify database connection works
   2. Check if owner/property exists first
   3. Look for error messages in console
   4. Run: SELECT COUNT(*) FROM crm_enquiries;

For more details, see:
  - CRM_QUICK_REFERENCE.md (troubleshooting guide)
  - CRM_IMPLEMENTATION_COMPLETE.md (full spec)
  - CRM_ENQUIRY_SYNC_FIX.md (technical details)
" -ForegroundColor Yellow

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Ready to Test!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "
Start with TEST 1 (Owner Signup) first
Each test depends on previous ones
Run tests in order: 1 → 2 → 3 → 4 (optional)
" -ForegroundColor Green
