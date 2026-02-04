# Membership CRM Sync - Setup & Configuration Guide

## Overview

The membership to CRM sync is now fully integrated. When users purchase memberships via Stripe, the system automatically:

1. ✅ Syncs membership data to the CRM (`crm_memberships` table)
2. ✅ Tracks membership status (active, cancelled, past_due, expired)
3. ✅ Records Stripe subscription details (customer ID, subscription ID)
4. ✅ Updates on payment events (success, failure, cancellation)
5. ✅ Maintains payment history and renewal dates

## CRM Membership Tracking

### What Gets Synced

When a user purchases a membership:

```
crm_memberships table records:
├─ id: Unique membership record ID
├─ contactId: Links to crm_contacts (owner)
├─ planTier: 'bronze', 'silver', 'gold' (from plan ID)
├─ planPrice: Amount paid (from Stripe invoice)
├─ billingCycle: 'annual' or 'monthly'
├─ startDate: When membership became active
├─ endDate: When membership expires (usually +12 months)
├─ renewalDate: Next renewal date
├─ status: 'active' | 'past_due' | 'cancelled' | 'expiring_soon' | 'expired'
├─ stripeCustomerId: Stripe customer reference
├─ stripeSubscriptionId: Stripe subscription reference
├─ lastPaymentDate: Most recent payment
├─ lastPaymentAmount: Amount of last payment
├─ nextPaymentDate: When next payment is due
├─ autoRenew: Whether auto-renewal is enabled
├─ paymentFailureCount: Track payment failures
└─ cancelledDate: When subscription was cancelled
```

## Webhook Events Triggering CRM Sync

### 1. Successful Purchase - `checkout.session.completed` & `invoice.paid`

When user completes payment:
- ✅ Creates new membership record in CRM
- ✅ Sets status to 'active'
- ✅ Records Stripe IDs
- ✅ Logs membership creation in activity log

### 2. Subscription Updated - `customer.subscription.updated`

When subscription details change:
- ✅ Renews membership
- ✅ Updates next payment date
- ✅ Maintains plan tier and pricing

### 3. Subscription Cancelled - `customer.subscription.deleted`

When user cancels membership:
- ✅ Updates membership status to 'cancelled'
- ✅ Records cancellation date
- ✅ Logs cancellation event

### 4. Payment Failed - `invoice.payment_failed`

When payment fails:
- ✅ Updates membership status to 'past_due'
- ✅ Increments payment failure counter
- ✅ Tracks retry history

## Production Setup - Stripe Webhooks

### Step 1: Add Webhook Endpoint to Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate: **Developers** → **Webhooks** → **Add Endpoint**
3. Enter endpoint URL:
   ```
   https://your-domain.vercel.app/api/webhooks/stripe
   ```
4. Select events to listen for:
   ```
   ✓ checkout.session.completed
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ invoice.paid
   ✓ invoice.payment_failed
   ```
5. Click **Add Endpoint**

### Step 2: Copy Webhook Secret

After creating the endpoint:
1. Click the endpoint to view details
2. Find **Signing secret** 
3. Click **Reveal** to show the secret
4. Copy it (format: `whsec_...` or `whsec_test_...`)

### Step 3: Add to Environment Variables

**For Vercel Production:**

1. Go to Vercel Dashboard → Your Project
2. Navigate: **Settings** → **Environment Variables**
3. Add new variable:
   ```
   Name: STRIPE_WEBHOOK_SECRET
   Value: whsec_... (paste from Stripe)
   Environment: Production
   ```
4. Deploy or redeploy your app

**For Local Development:**

Add to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### Step 4: Test Webhook

From Stripe Dashboard webhook details:
1. Click **Send test event**
2. Select **customer.subscription.created**
3. Verify no errors in response

From local/production logs:
- Check for: `✅ Membership synced to CRM`
- Check for: `Processing Stripe webhook: customer.subscription.created`

## Testing Membership Sync

### Local Testing

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Make a test purchase using Stripe TEST keys
   - Use card: `4242 4242 4242 4242`
   - Any future date for expiry
   - Any CVC: `123`

3. Check logs for:
   ```
   ✅ Membership synced to CRM for [userId]
   Webhook: Updating user [userId] with plan [planId]
   ```

4. Verify in database (Turso):
   ```sql
   SELECT * FROM crm_memberships 
   WHERE contactId IN (SELECT id FROM crm_contacts WHERE userId = '[userId]')
   ORDER BY created_at DESC LIMIT 1;
   ```

### Production Testing

After deploying to Vercel:

1. From Stripe Dashboard, send test webhook:
   - Event: `customer.subscription.created`
   - Verify response: `200 OK`

2. Check Vercel Function Logs:
   - Go to Vercel Dashboard → Deployments → Functions
   - Filter: `/api/webhooks/stripe`
   - Verify: `✅ Membership synced to CRM`

3. Query production database:
   ```sql
   -- Find recent membership syncs
   SELECT m.*, c.email 
   FROM crm_memberships m
   JOIN crm_contacts c ON m.contact_id = c.id
   ORDER BY m.created_at DESC 
   LIMIT 10;
   ```

## CRM Membership Sync Flow

```
Stripe Webhook Event
    ↓
/api/webhooks/stripe (validate signature)
    ↓
    ├─ checkout.session.completed / invoice.paid
    │  ↓
    │  syncMembershipToCRM()
    │  ├─ Find contact by userId
    │  ├─ Create membership record
    │  ├─ Set status = 'active'
    │  ├─ Record Stripe IDs
    │  └─ Log to crm_activity_log
    │
    ├─ customer.subscription.deleted
    │  ↓
    │  updateMembershipInCRM()
    │  ├─ Find contact by userId
    │  ├─ Find active membership
    │  ├─ Update status = 'cancelled'
    │  └─ Record cancellation_date
    │
    └─ invoice.payment_failed
       ↓
       updateMembershipInCRM()
       ├─ Find contact by userId
       ├─ Find active membership
       ├─ Update status = 'past_due'
       └─ Increment payment_failure_count
    ↓
Return 200 (success)
```

## Database Queries

### Find User's Membership Status

```sql
SELECT m.*, c.email
FROM crm_memberships m
JOIN crm_contacts c ON m.contact_id = c.id
WHERE c.user_id = 'USER_ID'
ORDER BY m.created_at DESC
LIMIT 1;
```

### Find Cancelled Memberships

```sql
SELECT m.*, c.email
FROM crm_memberships m
JOIN crm_contacts c ON m.contact_id = c.id
WHERE m.status = 'cancelled'
ORDER BY m.cancelled_date DESC;
```

### Find Payment Failures

```sql
SELECT m.*, c.email
FROM crm_memberships m
JOIN crm_contacts c ON m.contact_id = c.id
WHERE m.payment_failure_count > 0
ORDER BY m.updated_at DESC;
```

### Track Membership Revenue

```sql
SELECT 
    m.plan_tier,
    COUNT(*) as active_count,
    SUM(m.plan_price) as monthly_revenue,
    AVG(m.plan_price) as avg_plan_price
FROM crm_memberships m
WHERE m.status = 'active'
GROUP BY m.plan_tier;
```

## Troubleshooting

### Issue: Webhook not delivering events

**Solution:**
1. Verify webhook secret is correct (no spaces, exact match)
2. Check Vercel Function logs for errors
3. Ensure endpoint URL is publicly accessible
4. Test with Stripe test event first

### Issue: "Contact not found in CRM"

**Solution:**
1. Verify contact exists in `crm_contacts`
2. Check `userId` matches in both `user` and `crm_contacts` tables
3. Verify user registered/signed up before purchasing

### Issue: Membership not appearing in CRM

**Solution:**
1. Check database connection is working
2. Verify membership table exists with correct schema
3. Check for non-blocking error logs (message starts with `❌`)
4. Manually sync from checkout completion webhook instead

## Next Steps

After webhook configuration:

1. ✅ Monitor production logs for 1-2 weeks
2. ✅ Test with real test transactions
3. ✅ Create admin dashboard queries for membership analytics
4. ✅ Set up alerts for payment failures > threshold
5. ✅ Plan auto-renewal failure handling

## Files Modified

- `src/app/api/webhooks/stripe/route.ts` - Added CRM sync calls
- `src/lib/crm-sync.ts` - Added `updateMembershipInCRM()` function
- Database: `crm_memberships` table (already created)

## Related Documentation

- [CRM Enquiry Sync Guide](./ENQUIRY_FORM_ICAL_INTEGRATION.md)
- [CRM Owner/Property Sync](./ICAL_QUICK_REFERENCE.md)
- [Stripe Integration](./STRIPE_INTEGRATION.md)
