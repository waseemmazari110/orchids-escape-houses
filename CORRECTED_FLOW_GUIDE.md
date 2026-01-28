# Complete Flow: Plan Selection → Payment → Property Creation

## User Flow

1. **Owner Dashboard → Add Property**
   - User clicks "Add Property" button on owner dashboard
   - Button redirects to `/choose-plan` (not `/owner/properties/new`)

2. **Choose Plan Page** (`/choose-plan`)
   - User sees Bronze/Silver/Gold plan options
   - User selects a plan and clicks "Continue to Secure Payment"
   - System creates Stripe checkout session WITHOUT propertyId
   - Success URL: `/owner/properties/new?payment=success&planId=PLAN_ID&session_id=SESSION_ID`

3. **Stripe Payment**
   - User completes payment on Stripe checkout page
   - Stripe webhook fires (`checkout.session.completed`)
   - Webhook logs payment info but doesn't update database yet (no propertyId)
   - User redirected back to success URL

4. **Property Form** (`/owner/properties/new`)
   - Page checks for `payment=success` and `session_id` params
   - Calls `/api/payment/verify?session_id=XXX` to verify payment
   - Shows green success banner confirming plan is active
   - User fills out property details (all 8 steps)
   - User clicks "Submit for Approval"

5. **Property Submission**
   - OwnerPropertyForm receives `paidPlanId` and `paymentIntentId` props
   - On submit, adds payment fields to property data:
     - `plan_id`: The purchased plan (bronze/silver/gold)
     - `payment_status`: 'paid'
     - `stripe_payment_intent_id`: Payment reference
     - `plan_purchased_at`: Current timestamp
     - `plan_expires_at`: 1 year from now
   - Property created with status `pending_approval`
   - Redirects to owner dashboard

6. **Admin Approval**
   - Admin reviews property in admin dashboard
   - Property already has `payment_status = 'paid'`
   - Admin approves → property goes live
   - Admin rejects → property status = 'rejected'

## Technical Implementation

### API Routes

#### `/api/checkout/property-plan` (POST)
- **Purpose**: Create Stripe checkout for plan purchase
- **Body**: `{ planId, propertyId?, propertyTitle? }`
- **Returns**: `{ sessionId, url }`
- **Success URL**: `/owner/properties/new?payment=success&planId=X&session_id=Y`
- **Note**: `propertyId` is optional (null for new properties)

#### `/api/payment/verify` (GET)
- **Purpose**: Verify payment after Stripe redirect
- **Query**: `?session_id=XXX`
- **Returns**: `{ success, planId, paymentIntentId, amountPaid, currency }`
- **Security**: Verifies session belongs to logged-in user

#### `/api/webhooks/stripe-property` (POST)
- **Purpose**: Handle Stripe webhook events
- **Event**: `checkout.session.completed`
- **Action**: 
  - If `propertyId` exists: Update property with payment info
  - If no `propertyId`: Just log payment (property created later)

### Database Schema

Properties table includes:
```sql
plan_id TEXT                    -- bronze/silver/gold
payment_status TEXT             -- paid/pending/expired
stripe_payment_intent_id TEXT   -- Payment reference
plan_purchased_at TEXT          -- ISO timestamp
plan_expires_at TEXT            -- ISO timestamp (1 year later)
```

### Component Props

**OwnerPropertyForm**
```tsx
interface OwnerPropertyFormProps {
  propertyId?: string;
  initialData?: Partial<PropertyFormData>;
  paidPlanId?: string;           // NEW: From payment verification
  paymentIntentId?: string;      // NEW: From payment verification
}
```

## Migration Status

⚠️ **Database migration NOT YET APPLIED**

The 5 new columns need to be added to the `properties` table:

**Option 1: Admin API Endpoint**
```javascript
// From browser console while logged in as admin
fetch('/api/admin/migrate/property-plans', {method:'POST'})
  .then(r=>r.json())
  .then(console.log)
```

**Option 2: Turso CLI**
```bash
turso db shell orchids-escape-houses-1 < drizzle/0006_add_property_plan_fields.sql
```

**Option 3: Turso Dashboard**
1. Go to turso.tech dashboard
2. Select database
3. Open SQL console
4. Paste contents of `drizzle/0006_add_property_plan_fields.sql`
5. Execute

## Environment Variables Required

```env
# Existing
STRIPE_SECRET_KEY=sk_...
STRIPE_BRONZE_PRICE_ID=price_...
STRIPE_SILVER_PRICE_ID=price_...
STRIPE_GOLD_PRICE_ID=price_...

# NEW: For webhook verification
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Stripe Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe-property`
3. Select event: `checkout.session.completed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Testing Checklist

- [ ] Click "Add Property" redirects to `/choose-plan`
- [ ] Select plan → Stripe checkout opens
- [ ] Complete test payment (use test card: 4242 4242 4242 4242)
- [ ] Redirected to `/owner/properties/new` with success banner
- [ ] Payment verified (green banner shows plan details)
- [ ] Fill property form and submit
- [ ] Property created with `payment_status = 'paid'`
- [ ] Property appears in owner dashboard as "Pending Approval"
- [ ] Admin can see payment status in admin dashboard
- [ ] Admin approval works correctly

## Files Modified

1. **src/app/owner-dashboard/page.tsx**
   - Changed Add Property button: `href="/choose-plan"`

2. **src/app/choose-plan/page.tsx**
   - Removed warning banner for missing propertyId
   - Made propertyId optional in checkout request

3. **src/app/api/checkout/property-plan/route.ts**
   - Made propertyId optional
   - Dynamic success/cancel URLs based on flow
   - Conditional metadata (includes propertyId only if exists)

4. **src/app/api/webhooks/stripe-property/route.ts**
   - Handle both flows: with/without propertyId
   - Log payment for future association if no propertyId

5. **src/app/api/payment/verify/route.ts** (NEW)
   - Verify Stripe session after redirect
   - Return payment details for property form

6. **src/app/owner/properties/new/page.tsx**
   - Check for payment success params
   - Verify payment via API
   - Show success banner
   - Pass payment info to form

7. **src/components/OwnerPropertyForm.tsx**
   - Accept `paidPlanId` and `paymentIntentId` props
   - Include payment fields when submitting property
   - Calculate plan expiry (1 year from purchase)

## Key Differences from Previous Flow

**BEFORE (Incorrect)**:
1. Create property as draft
2. Redirect to choose plan
3. Pay for plan
4. Update property with payment

**NOW (Correct)**:
1. Choose plan
2. Pay for plan
3. Create property with payment info
4. Submit for approval

This ensures payment happens BEFORE property creation, as requested by user.
