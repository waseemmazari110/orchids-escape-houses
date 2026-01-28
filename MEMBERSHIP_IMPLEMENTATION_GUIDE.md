# Membership System Implementation Guide

## Overview

This guide covers the implementation of the per-property membership system with Bronze, Silver, and Gold tiers. All changes follow the architecture defined in `MEMBERSHIP_SYSTEM_ARCHITECTURE.md`.

## ✅ Completed Changes

### 1. Database Schema Updates

**Files Modified:**
- `src/db/schema.ts` - Added new tables and updated existing ones
- `drizzle/0005_add_membership_system.sql` - Migration file

**New Tables:**
- `membershipPacks` - Configuration for Bronze, Silver, Gold packs
- `propertySubscriptions` - Tracks membership periods for each property
- `adminActivityLog` - Logs all admin actions

**Updated Tables:**
- `properties` - Added lifecycle fields, membership tracking, and admin approval fields
- `payments` - Added property and subscription references
- `enquiries` - Enhanced with property-specific fields
- `user` - Updated role to support 'guest', 'owner', 'admin'

### 2. Business Logic Utilities

**File Created:** `src/lib/membership-utils.ts`

**Functions:**
- `calculatePackPricing()` - Calculate pricing with VAT
- `calculateMultiPropertyTotal()` - Multi-property checkout calculations
- `getPropertyFeatures()` - Get features based on pack
- `canTransitionTo()` - Validate status transitions
- `getStatusInfo()` - Get status labels and colors
- `calculateSubscriptionEndDate()` - Calculate 12-month periods
- `calculateProRataRefund()` - Calculate refunds for upgrades
- `canSubmitForApproval()` - Validation helpers
- `formatPrice()` - Display formatters

### 3. API Routes Created

#### Membership Packs
- `GET /api/membership-packs` - Get all active packs with pricing

#### Property Management
- `POST /api/properties/create` - Create property (draft, no payment)
- `POST /api/properties/checkout` - Multi-property Stripe checkout

#### Admin Routes
- `POST /api/admin/properties/approve` - Approve property
- `POST /api/admin/properties/reject` - Reject property with reason

### 4. Seed Data

**File Created:** `scripts/seed-membership-packs.ts`

Seeds the three membership packs:
- Bronze: £450/year or £40/month
- Silver: £650/year or £57/month  
- Gold: £850/year or £75/month

## 🔧 Next Steps to Complete Implementation

### 1. Run Database Migration

```bash
# Apply the migration
npm run db:push

# Or if using drizzle migrations:
npx drizzle-kit push:sqlite

# Seed membership packs
npx tsx scripts/seed-membership-packs.ts
```

### 2. Update Environment Variables

Add to `.env`:

```env
# Stripe (already exists)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Update Stripe Webhook Handler

The existing webhook at `src/app/api/webhooks/stripe/route.ts` needs to be updated to handle property membership payments. Add these event handlers:

```typescript
// Add to existing webhook:
case 'checkout.session.completed':
  if (metadata.type === 'property_membership') {
    // Update properties to pending_approval
    // Create property_subscriptions records
    // Send notifications
  }
  break;

case 'invoice.payment_succeeded':
  // Handle recurring monthly payments
  break;

case 'customer.subscription.deleted':
  // Mark subscriptions as cancelled
  break;
```

### 4. Create Owner Dashboard Pages

**Pages to Create:**

`src/app/dashboard/properties/page.tsx`
- List all owner's properties
- Show status badges (Draft, Pending, Live, Rejected, Expired)
- Quick actions (Edit, Pay, View)

`src/app/dashboard/properties/new/page.tsx`
- Multi-step form for property creation
- Membership pack selection with pricing
- Save as draft or proceed to payment

`src/app/dashboard/properties/[id]/page.tsx`
- Property details view
- Edit functionality
- Payment/renewal button if needed

`src/app/dashboard/payment-success/page.tsx`
- Success page after checkout
- Show properties submitted for approval

### 5. Create Admin Dashboard Pages

**Pages to Create:**

`src/app/admin/properties/pending/page.tsx`
- Queue of properties pending approval
- Property preview
- Approve/reject buttons

`src/app/admin/properties/all/page.tsx`
- All properties with filters (status, pack, owner)
- Bulk actions

`src/app/admin/owners/page.tsx`
- List all owners
- View properties per owner
- Revenue stats

### 6. Create Cron Jobs for Renewals

**File to Create:** `src/app/api/cron/check-expiring-subscriptions/route.ts`

```typescript
// Run daily via Vercel Cron or similar
export async function GET() {
  // Find subscriptions expiring in 30 days
  // Send renewal reminder emails
  
  // Find expired subscriptions
  // Mark properties as expired
  // Send expiry notifications
}
```

### 7. Email Notifications

**Templates Needed:**

- `payment-success.tsx` - Payment received, under review
- `property-approved.tsx` - Property approved and live
- `property-rejected.tsx` - Property rejected with reason
- `renewal-reminder-30-days.tsx` - Renewal reminder
- `membership-expired.tsx` - Membership expired
- `new-property-pending.tsx` - Admin notification

### 8. Update Navigation

Add to owner dashboard nav:
- My Properties
- Add New Property  
- Payments & Invoices
- Enquiries

Add to admin nav:
- Pending Approvals (with count badge)
- All Properties
- Owners
- Membership Packs

### 9. Property Listing Updates

Update public property pages to respect lifecycle:
- Only show properties with `status === 'live'`
- Check `isPublished === true`
- Respect pack features (homepage feature, specialist pages)

### 10. Testing Checklist

**Owner Flow:**
- [ ] Sign up as owner (role = 'owner')
- [ ] Create property without payment (draft)
- [ ] Select membership pack
- [ ] Complete payment for single property
- [ ] Complete payment for multiple properties
- [ ] View pending approval status
- [ ] Receive approval notification
- [ ] See property go live

**Admin Flow:**
- [ ] View pending properties queue
- [ ] Approve property
- [ ] Reject property with reason
- [ ] View all properties by status
- [ ] View owner list with properties

**Payment Flow:**
- [ ] Annual payment (one-time)
- [ ] Monthly payment (subscription)
- [ ] Multi-property checkout
- [ ] Webhook processing
- [ ] Subscription renewal
- [ ] Subscription cancellation

**Lifecycle:**
- [ ] Draft → Pending (after payment)
- [ ] Pending → Live (admin approval)
- [ ] Pending → Rejected (admin rejection)
- [ ] Live → Paused (owner action)
- [ ] Live → Expired (end date reached)
- [ ] Expired → Pending (after renewal payment)

## 📊 Database Schema Summary

### Key Relationships

```
user (owner)
  ├── properties (one-to-many)
  │     ├── membershipPacks (many-to-one)
  │     ├── propertySubscriptions (one-to-many)
  │     ├── payments (one-to-many)
  │     └── enquiries (one-to-many)
  └── payments (one-to-many)

admin (user with role='admin')
  ├── adminActivityLog (one-to-many)
  └── properties.approvedByAdminId (one-to-many)
```

### Property Status Flow

```
draft
  ↓ (payment completed)
pending_approval
  ↓ (admin approves)         ↓ (admin rejects)
live                         rejected
  ↓ (owner pauses)            ↓ (owner edits & pays)
paused                       pending_approval
  ↓ (owner resumes)
live
  ↓ (subscription expires)
expired
  ↓ (owner renews & pays)
pending_approval
```

## 🎯 Success Criteria

The implementation is complete when:

1. ✅ Owners can sign up for free
2. ✅ Owners can create unlimited draft properties
3. ✅ Each property must select Bronze, Silver, or Gold pack
4. ✅ Owners can pay for multiple properties in one checkout
5. ✅ Payment marks properties as pending approval
6. ✅ Admin can approve/reject properties
7. ✅ Approved properties appear on website
8. ✅ Rejected properties can be edited and resubmitted
9. ✅ Features are enforced based on pack tier
10. ✅ Subscriptions expire after 12 months
11. ✅ Renewal reminders sent 30 days before expiry
12. ✅ Expired properties are unpublished automatically

## 🔗 Related Documentation

- `MEMBERSHIP_SYSTEM_ARCHITECTURE.md` - Complete architecture guide
- `src/lib/membership-utils.ts` - Business logic utilities
- `drizzle/0005_add_membership_system.sql` - Database migration

## 🆘 Support

For questions or issues:
1. Check `MEMBERSHIP_SYSTEM_ARCHITECTURE.md` for detailed specifications
2. Review `src/lib/membership-utils.ts` for business logic examples
3. Check console logs for webhook debugging
4. Verify Stripe webhook secret is correct

---

**Implementation Status:** Foundation Complete
**Remaining Work:** UI/UX, Webhooks, Cron Jobs, Email Templates
**Estimated Time:** 2-3 weeks for full implementation
