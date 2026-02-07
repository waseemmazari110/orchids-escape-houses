# Stripe Webhook Setup Guide

## Problem
Stripe payments complete successfully, but the webhook that saves plan purchases to the database never fires. This prevents the "unused plan" feature from working.

## Why Webhooks Don't Work Automatically

Stripe cannot send webhooks directly to `localhost:3000` - it needs either:
1. **Stripe CLI** (for local development)
2. **Public URL** (ngrok/production)

## Solution 1: Use Stripe CLI (Recommended for Local Testing)

### Step 1: Install Stripe CLI
```powershell
# Download from: https://stripe.com/docs/stripe-cli
# Or use Scoop (Windows):
scoop install stripe
```

### Step 2: Login to Stripe
```powershell
stripe login
```

### Step 3: Forward Webhooks to Local Server
```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe-property
```

This will output a webhook signing secret like:
```
whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Update .env
Replace `STRIPE_WEBHOOK_SECRET` in your `.env` file with the secret from step 3:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Restart Your Dev Server
```powershell
npm run dev
```

### Step 6: Test Payment
1. Go to `/choose-plan`
2. Click "Continue to sign up" on any plan
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Watch your terminal - you should see:
   ```
   ✅ Plan purchase saved for user <userId>, plan <planId>. Payment intent: <intentId>
   ```

### Step 7: Verify in Database
```powershell
npx tsx check-unused-plans.ts
```

You should see your unused plan!

## Solution 2: Quick Test Without Webhooks

If you want to test the feature immediately without setting up webhooks:

### Step 1: Create Manual Test Purchase
```powershell
npx tsx create-test-plan-purchase.ts
```

### Step 2: Reload Choose Plan Page
Go to `/choose-plan` and you should see "Use Your Purchased Plan" button!

### Step 3: Click the Button
It will redirect you to `/owner/properties/new` with your purchased plan pre-selected.

### Step 4: Create Property
After creating the property, the plan will be marked as used.

## Solution 3: Production Setup

For production, configure webhooks in Stripe Dashboard:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe-property`
4. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
5. Copy the signing secret
6. Add to production environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

## Troubleshooting

### Webhook Not Receiving Events
- Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe-property`
- Check webhook secret is correct in `.env`
- Check dev server is running on port 3000
- Check for webhook errors in Stripe Dashboard > Webhooks > Your endpoint

### Plan Purchase Not Saved
- Check console logs for webhook errors
- Check database connection is working
- Run: `npx tsx check-unused-plans.ts` to verify database state

### Button Still Not Showing
- Check browser console for API response
- Clear browser cache
- Check React state is updating (see logs added to choose-plan page)
- Verify planId matches between database and UI ("bronze", "silver", "gold")

## Expected Log Flow

When everything works correctly:

1. **Payment initiated:**
   ```
   POST /api/checkout/property-plan 200
   ```

2. **User completes checkout in Stripe**

3. **Webhook received:**
   ```
   [Stripe Webhook] checkout.session.completed event received
   ✅ Plan purchase saved for user <userId>, plan <planId>. Payment intent: <intentId>
   Plan valid until <date>. Property will be created next.
   ```

4. **User redirected:**
   ```
   GET /owner/properties/new?payment=success&planId=bronze&session_id=cs_test_...
   ```

5. **Check for unused plans:**
   ```
   [Unused Plan API] Session user: <userId>
   [Unused Plan API] Query results: [{id: 1, planId: "bronze", used: 0, ...}]
   [Unused Plan API] Found purchase: {...}
   [Unused Plan API] Returning response: {hasUnusedPlan: true, purchase: {...}}
   ```

6. **UI updates:**
   ```
   [Choose Plan] API Response: {hasUnusedPlan: true, purchase: {...}}
   [Choose Plan] Found unused plan: {...}
   ```

7. **Button shows:** "Use Your Purchased Plan"
