#!/usr/bin/env pwsh

Write-Host "🧪 CRM Integration Test Suite`n" -ForegroundColor Cyan
Write-Host "Testing all CRM sync functions...`n" -ForegroundColor Yellow

# Test 1: Owner Sync (via registration)
Write-Host "Test 1: Owner Registration & CRM Sync" -ForegroundColor Magenta
Write-Host "=====================================`n"
$ownerPayload = @{
    email = "test-owner-$(Get-Random)@example.com"
    password = "TestPassword123!"
    name = "CRM Test Owner"
} | ConvertTo-Json

Write-Host "Payload:" 
Write-Host $ownerPayload
Write-Host "`nTo test: Register at http://localhost:3000/owner-sign-up`n"

# Test 2: Property Sync
Write-Host "`nTest 2: Property Creation & CRM Sync" -ForegroundColor Magenta
Write-Host "===================================`n"
$propertyPayload = @{
    title = "CRM Test Property - $(Get-Random)"
    location = "Test Location, Test City"
    bedrooms = 4
    bathrooms = 2
    sleepsMax = 8
    description = "A test property for CRM sync"
    amenities = @("WiFi", "Kitchen", "Parking")
} | ConvertTo-Json

Write-Host "Payload (sample):" 
Write-Host $propertyPayload
Write-Host "`nTo test: POST to http://localhost:3000/api/properties with auth header`n"

# Test 3: Enquiry Sync
Write-Host "`nTest 3: Enquiry Submission & CRM Sync" -ForegroundColor Magenta
Write-Host "===================================`n"
$enquiryPayload = @{
    name = "CRM Test Guest"
    email = "crm-test-guest-$(Get-Random)@example.com"
    phone = "1234567890"
    message = "This is a test enquiry to verify CRM sync integration"
    propertySlug = "test-property"
    checkin = "2024-02-01"
    checkout = "2024-02-05"
    groupSize = 4
    occasion = "Team Building"
    budget = 2000
} | ConvertTo-Json

Write-Host "Payload:" 
Write-Host $enquiryPayload
Write-Host "`nTo test, run:`n"

$curlCmd = @"
`$body = '$enquiryPayload' | ConvertFrom-Json | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/api/enquiry" `
  -Method POST `
  -ContentType "application/json" `
  -Body `$body
"@

Write-Host $curlCmd
Write-Host "`n`n✅ Expected Results:" -ForegroundColor Green
Write-Host "  - Owner registration: Contact created in crm_contacts"
Write-Host "  - Property creation: Property synced to crm_properties"
Write-Host "  - Enquiry submission: Guest contact created, enquiry added to crm_enquiries"
Write-Host "  - Console should show: '✅ [Action] synced to CRM for [email]'`n"

Write-Host "📋 Database Queries to Verify:" -ForegroundColor Yellow
Write-Host "  SELECT COUNT(*) FROM crm_contacts;"
Write-Host "  SELECT COUNT(*) FROM crm_properties;"
Write-Host "  SELECT COUNT(*) FROM crm_enquiries;"
Write-Host "  SELECT * FROM crm_enquiries ORDER BY created_at DESC LIMIT 1;`n"
