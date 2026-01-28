# Per-Property Membership System - Implementation Guide

## Overview
The system has been updated to require a separate membership plan for each property listing. Each property now requires its own plan purchase before it can be submitted for admin approval.

---

## ✅ What Was Implemented

### 1. Database Changes
**New fields added to `properties` table:**
- `plan_id` - The membership plan (bronze/silver/gold) for this property
- `payment_status` - Payment status (pending/paid/failed)
- `stripe_payment_intent_id` - Stripe payment reference
- `plan_purchased_at` - When the plan was purchased
- `plan_expires_at` - When the plan expires (1 year from purchase)

### 2. New API Endpoints

**`/api/checkout/property-plan` (POST)**
- Creates Stripe checkout session for property-specific plan
- Requires: `planId`, `propertyId`, `propertyTitle`
- Returns: Stripe checkout URL

**`/api/webhooks/stripe-property` (POST)**
- Handles Stripe payment success webhook
- Updates property with plan details and expiry date
- Sets `payment_status` to 'paid'

**`/api/properties/submit` (POST)**
- Submits property for admin approval after payment
- Validates payment status before submission
- Changes status from 'draft' to 'pending_approval'

### 3. Updated Flows

**Property Creation Flow:**
1. Owner creates property → Saved as 'draft' with `payment_status: 'pending'`
2. Redirected to `/choose-plan?propertyId=X&propertyTitle=...`
3. Owner selects plan (Bronze/Silver/Gold)
4. Stripe checkout for that specific property
5. After payment success → Webhook updates property `payment_status: 'paid'`
6. Redirected back to dashboard with success message
7. Property automatically submitted for admin approval

**Property Update Flow:**
1. Owner edits existing property
2. If already has paid plan → submits directly for approval
3. If no plan → redirects to plan selection

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
# Run the migration to add new fields
node drizzle/migrate_property_plans.mjs
```

This adds the following columns to the properties table:
- `plan_id`
- `payment_status`
- `stripe_payment_intent_id`
- `plan_purchased_at`
- `plan_expires_at`

### Step 2: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe-property`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret
5. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Step 3: Verify Environment Variables

Ensure these are set in `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_BRONZE_PRICE_ID=price_xxxxx
STRIPE_SILVER_PRICE_ID=price_xxxxx
STRIPE_GOLD_PRICE_ID=price_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Test the Flow

1. **Create a new property:**
   ```
   Login as owner → Add Property → Fill all steps → Publish
   → Redirected to plan selection
   → Choose plan → Pay via Stripe
   → Redirected back to dashboard
   → Property shows as "Pending" in Approvals tab
   ```

2. **Admin approval:**
   ```
   Login as admin → Approvals tab
   → See property with "Paid" status
   → Approve/Reject property
   ```

3. **Verify database:**
   ```sql
   SELECT id, title, plan_id, payment_status, plan_purchased_at, plan_expires_at 
   FROM properties 
   WHERE owner_id = 'user_id';
   ```

---

## 📋 User Experience Flow

### For Property Owners

1. **First Property:**
   - Sign up → Dashboard
   - Click "Add Property"
   - Fill property details (8 steps)
   - Click "Publish"
   - **NEW**: Redirected to plan selection page
   - Choose Bronze (£450), Silver (£650), or Gold (£850)
   - Complete Stripe payment
   - Property automatically submitted for admin approval
   - See in "Pending" tab on Approvals page

2. **Additional Properties:**
   - Click "Add Property" again
   - Fill details
   - **NEW**: Must purchase separate plan for each property
   - Each property = separate payment

3. **Editing Properties:**
   - If property already has paid plan → can update and resubmit
   - If rejected property is resubmitted → uses existing plan (no re-payment needed)

### For Admins

1. **Approval Queue:**
   - See properties with plan status indicator
   - Can only approve if `payment_status = 'paid'`
   - If payment not confirmed → shows "Payment pending" message

2. **Property Details:**
   - See which plan owner purchased (Bronze/Silver/Gold)
   - See plan expiry date
   - Can verify payment status before approving

---

## 🔍 Key Features

### 1. Plan Per Property
- Each property requires its own membership plan
- Multiple properties = multiple plan purchases
- No "bulk" or "unlimited property" plans

### 2. Payment Validation
- Property cannot be approved without payment
- Admin sees payment status in approval interface
- Automatic expiry tracking (1 year from purchase)

### 3. Draft Saving
- Properties saved as drafts before payment
- Owners can come back later to complete payment
- Draft properties not visible to public

### 4. Stripe Integration
- Secure payment processing
- Automatic webhook handling
- Payment history tracking

### 5. Plan Expiry
- Plans expire 1 year after purchase
- `plan_expires_at` field tracks expiry
- (Future: Can add renewal reminders)

---

## 📊 Database Schema

```sql
CREATE TABLE properties (
  -- Existing fields...
  
  -- NEW: Per-Property Membership Fields
  plan_id TEXT,                      -- 'bronze', 'silver', 'gold'
  payment_status TEXT DEFAULT 'pending',  -- 'pending', 'paid', 'failed'
  stripe_payment_intent_id TEXT,     -- Reference to Stripe payment
  plan_purchased_at TEXT,            -- ISO timestamp
  plan_expires_at TEXT               -- ISO timestamp (1 year after purchase)
);
```

---

## 🧪 Testing Checklist

- [ ] Create new property → Redirects to plan selection
- [ ] Select Bronze plan → Stripe checkout opens
- [ ] Complete test payment → Redirected to dashboard
- [ ] Property shows in "Pending" approvals
- [ ] Database shows `payment_status: 'paid'`
- [ ] Database shows `plan_expires_at` = 1 year from now
- [ ] Admin can see property in approval queue
- [ ] Admin can approve property
- [ ] Approved property shows as "Approved" in owner dashboard
- [ ] Create second property → Must purchase separate plan
- [ ] Edit existing property with paid plan → Can update without re-payment

---

## 🐛 Troubleshooting

### Issue: Payment succeeds but property not submitted
**Solution:** Check webhook is configured correctly and webhook secret is set

### Issue: Property stuck in draft after payment
**Solution:** Check `/owner-dashboard?payment=success&propertyId=X` triggers submission

### Issue: Admin can't approve property
**Solution:** Verify `payment_status = 'paid'` in database

### Issue: Stripe webhook fails
**Solution:** 
1. Check Stripe Dashboard → Webhooks → Events
2. Verify webhook secret matches `.env.local`
3. Check server logs for webhook errors

### Issue: Property doesn't redirect to plan selection
**Solution:** Check `OwnerPropertyForm.tsx` line 373 redirects properly

---

## 🔄 Migration from Old System

If you had properties created under the old "one plan for all properties" system:

1. **Run backfill script:**
   ```sql
   -- Assign default Bronze plan to all existing properties
   UPDATE properties 
   SET plan_id = 'bronze',
       payment_status = 'paid',
       plan_purchased_at = created_at,
       plan_expires_at = datetime(created_at, '+1 year')
   WHERE plan_id IS NULL;
   ```

2. **Notify existing owners:**
   - Send email about new per-property pricing
   - Existing properties grandfathered with current plan
   - New properties require separate plans

---

## 📈 Future Enhancements

### Potential Improvements:
1. **Plan Renewal System:**
   - Email reminders 30 days before expiry
   - Auto-renewal option with saved cards
   - Grace period after expiry

2. **Plan Upgrades:**
   - Allow upgrading from Bronze → Silver → Gold
   - Pro-rated pricing for upgrades

3. **Bulk Discounts:**
   - Offer discount for 3+ properties
   - Annual vs monthly pricing options

4. **Plan Analytics:**
   - Dashboard showing plan distribution
   - Revenue by plan type
   - Expiry calendar

5. **Auto-Unpublish:**
   - Automatically unpublish properties when plan expires
   - Send notification to owner

---

## 🎯 Summary

✅ **Implemented:**
- Database migration for per-property plans
- Stripe checkout for individual properties
- Webhook handler for payment confirmation
- Property submission after payment
- Admin approval checks payment status
- Dashboard shows plan status per property

✅ **User Flow:**
1. Create property → Select plan → Pay → Submit for approval
2. Each property requires its own plan purchase
3. Plans expire after 1 year

✅ **Admin Experience:**
- Can see which plan each property has
- Can verify payment before approving
- Can track plan expiry dates

---

## 📞 Support

For issues or questions:
1. Check Stripe Dashboard for payment status
2. Check database for property plan fields
3. Verify webhook configuration
4. Check server logs for errors

**Key Files Modified:**
- `drizzle/schema.ts` - Added plan fields
- `src/app/api/checkout/property-plan/route.ts` - New checkout endpoint
- `src/app/api/webhooks/stripe-property/route.ts` - Webhook handler
- `src/app/api/properties/submit/route.ts` - Property submission
- `src/components/OwnerPropertyForm.tsx` - Updated flow
- `src/app/choose-plan/page.tsx` - Per-property plan selection
- `src/app/owner-dashboard/page.tsx` - Post-payment handling

---

**Implementation Date:** January 26, 2026
**Version:** 1.0
**Status:** ✅ Ready for Testing
