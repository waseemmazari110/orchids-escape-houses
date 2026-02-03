# Webhook Setup Guide

## Problem

Your Stripe payments are completing, but the webhooks aren't reaching your local development server (localhost:3000). This is why:
- Properties show `plan_id: none`
- Payment status stays `pending`
- No memberships are created in CRM

## Solution 1: Stripe CLI (Recommended for Development)

### Install Stripe CLI

**Windows:**
```powershell
# Download from https://github.com/stripe/stripe-cli/releases/latest
# Or use Scoop:
scoop install stripe
```

### Forward Webhooks to Localhost

1. **Login to Stripe:**
```bash
stripe login
```

2. **Forward webhooks:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe-property
```

3. **Copy the webhook signing secret** (starts with `whsec_...`)

4. **Update your .env.local:**
```
STRIPE_WEBHOOK_SECRET=whsec_...your_secret_here
```

5. **Restart your dev server**

6. **Test a payment** - you should see logs in the Stripe CLI terminal

### Expected Output

When you make a payment, you should see:
```
✅ Webhook received: checkout.session.completed
✅ CRM sync triggered for user [id], plan silver, amount £750
✅ Property [id] plan [planId] activated until [date]
✅ Membership synced to CRM: [id]
```

## Solution 2: Manual Membership Sync (Quick Fix)

For your 3 existing payments, run these scripts:

### Sync All Memberships:
```bash
node quick-add-membership.mjs
```

### Sync All Properties:
```bash
node sync-existing-properties.mjs
```

## Solution 3: ngrok (Alternative to Stripe CLI)

If Stripe CLI doesn't work:

1. **Install ngrok:** https://ngrok.com/download

2. **Start ngrok:**
```bash
ngrok http 3000
```

3. **Copy the https URL** (e.g., `https://abc123.ngrok.io`)

4. **Add webhook endpoint in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `https://abc123.ngrok.io/api/webhooks/stripe-property`
   - Events: Select `checkout.session.completed` and `invoice.paid`
   - Copy the signing secret to `.env.local`

5. **Restart your server**

## Troubleshooting

### Webhook Not Receiving Events

Check your terminal for:
```
POST /api/webhooks/stripe-property 200 in XXXms
```

If you don't see this, webhooks aren't reaching your server.

### Webhook Receiving But Errors

Check console for:
```
❌ Failed to sync membership to CRM: [error]
```

### Check CRM Data

Run verification script:
```bash
node check-recent-activity.mjs
```

Expected output:
```
💼 CRM Memberships:
   test_owner@gmail.com: silver - £750
      Status: active
```

## Production Setup

For production (Vercel), add the webhook endpoint:
1. Deploy to Vercel
2. Get your production URL
3. Add webhook: `https://your-domain.com/api/webhooks/stripe-property`
4. Add signing secret to Vercel environment variables

## Current Status

- ✅ Webhook code integrated
- ✅ CRM sync functions ready
- ❌ Webhooks not reaching localhost
- ❌ Need to set up Stripe CLI or ngrok

## Quick Test

After setting up Stripe CLI:

1. Start Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe-property`
2. Keep terminal open
3. Make a test payment
4. Watch the Stripe CLI terminal for events
5. Check CRM: `node check-recent-activity.mjs`
6. You should see new membership in crm_memberships table

---

**Need Help?** Check if port 3000 is accessible and your dev server is running.
