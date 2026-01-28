# Membership System - Quick Reference Card

## 🎯 Pricing Model (Strict Rules)

```
┌─────────┬──────────────┬──────────────┬────────────┐
│  Pack   │   Annual     │   Monthly    │  Savings   │
├─────────┼──────────────┼──────────────┼────────────┤
│ Bronze  │ £450 + VAT   │ £40/mo + VAT │  £30/year  │
│         │ (£540 total) │ (£576/year)  │            │
├─────────┼──────────────┼──────────────┼────────────┤
│ Silver  │ £650 + VAT   │ £57/mo + VAT │  £34/year  │
│         │ (£780 total) │ (£820/year)  │            │
├─────────┼──────────────┼──────────────┼────────────┤
│ Gold    │ £850 + VAT   │ £75/mo + VAT │  £50/year  │
│         │ (£1,020)     │ (£1,080/year)│            │
└─────────┴──────────────┴──────────────┴────────────┘
```

## 📦 Pack Features

| Feature | Bronze | Silver | Gold |
|---------|:------:|:------:|:----:|
| Fully Optimised Listing | ✅ | ✅ | ✅ |
| Page Build & Support | ❌ | ✅ | ✅ |
| Social Media Promotion | ❌ | ✅ | ✅ |
| Themed Blog Feature | ❌ | ✅ | ✅ |
| Holiday Focus Pages | 0 | 3 | 3 |
| Homepage Features | ❌ | ❌ | ✅ |
| Specialist Page | ❌ | ❌ | ✅ |

## 🔄 Property Lifecycle

```
┌─────────┐
│  DRAFT  │  Owner creates, no payment
└────┬────┘
     │ Payment completed
     ↓
┌─────────────────┐
│ PENDING_APPROVAL│  Paid, awaiting admin
└────┬────────────┘
     │
┌────┴─────┐
│          │
↓          ↓
┌──────┐  ┌──────────┐
│ LIVE │  │ REJECTED │  Admin decision
└──┬───┘  └────┬─────┘
   │           │ Can resubmit
   │           └──────────┐
   ↓                      ↓
┌────────┐         ┌─────────────────┐
│ PAUSED │         │ PENDING_APPROVAL│
└───┬────┘         └─────────────────┘
    │ Resume
    └────┐
         ↓
    ┌────────┐
    │  LIVE  │
    └────┬───┘
         │ 12 months later
         ↓
    ┌─────────┐
    │ EXPIRED │
    └────┬────┘
         │ Renewal payment
         ↓
    ┌─────────────────┐
    │ PENDING_APPROVAL│
    └─────────────────┘
```

## 🛠 Common Code Snippets

### Calculate Pack Pricing

```typescript
import { calculatePackPricing } from '@/lib/membership-utils';

const pricing = calculatePackPricing(pack, 'annual');
console.log(`
  Base: £${pricing.basePrice}
  VAT: £${pricing.vatAmount}
  Total: £${pricing.totalPrice}
  Savings: £${pricing.savingsVsMonthly}
`);
```

### Check Property Features

```typescript
import { getPropertyFeatures, hasFeature } from '@/lib/membership-utils';

const features = getPropertyFeatures(packFeatures, propertyStatus);

if (hasFeature(features, 'hasHomepageFeature')) {
  // Show homepage featuring option
}
```

### Validate Status Transition

```typescript
import { canTransitionTo } from '@/lib/membership-utils';

if (canTransitionTo(currentStatus, 'live')) {
  // Allow transition
} else {
  // Block transition
}
```

### Calculate Expiry

```typescript
import { daysUntilExpiry, isExpiringSoon } from '@/lib/membership-utils';

const endDate = new Date(subscription.endDate);
const days = daysUntilExpiry(endDate);

if (isExpiringSoon(endDate, 30)) {
  // Show renewal prompt
}
```

## 📡 API Endpoints Reference

### Public/Owner

```
GET  /api/membership-packs
     → Returns all packs with pricing

POST /api/properties/create
     Body: { title, location, ..., membershipPackId, paymentFrequency }
     → Creates draft property

POST /api/properties/checkout
     Body: { propertyIds: [1, 2, 3] }
     → Creates Stripe checkout session
```

### Admin

```
POST /api/admin/properties/approve
     Body: { propertyId }
     → Approves property, sets to live

POST /api/admin/properties/reject
     Body: { propertyId, reason }
     → Rejects property with reason
```

## 🗄 Database Queries

### Get All Pending Properties

```typescript
const pending = await db
  .select()
  .from(properties)
  .where(
    and(
      eq(properties.status, 'pending_approval'),
      eq(properties.paymentStatus, 'paid')
    )
  );
```

### Get Owner's Properties

```typescript
const userProps = await db
  .select()
  .from(properties)
  .where(eq(properties.ownerId, userId))
  .orderBy(desc(properties.createdAt));
```

### Get Active Subscriptions

```typescript
const active = await db
  .select()
  .from(propertySubscriptions)
  .where(
    and(
      eq(propertySubscriptions.status, 'active'),
      gte(propertySubscriptions.endDate, new Date().toISOString())
    )
  );
```

### Get Expiring Soon

```typescript
const thirtyDaysLater = new Date();
thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

const expiring = await db
  .select()
  .from(propertySubscriptions)
  .where(
    and(
      eq(propertySubscriptions.status, 'active'),
      between(
        propertySubscriptions.endDate,
        new Date().toISOString(),
        thirtyDaysLater.toISOString()
      )
    )
  );
```

## 🎨 Status Badge Colors

```typescript
const statusColors = {
  draft: 'gray',
  pending_approval: 'yellow',
  live: 'green',
  rejected: 'red',
  paused: 'blue',
  expired: 'purple',
};
```

## ⚠️ Business Rules Validation

```typescript
// Before creating checkout
if (!property.membershipPackId) {
  throw new Error('Must select membership pack');
}

// Before approval
if (property.status !== 'pending_approval') {
  throw new Error('Can only approve pending properties');
}

if (property.paymentStatus !== 'paid') {
  throw new Error('Payment must be confirmed');
}

// Before upgrade
const packOrder = { bronze: 1, silver: 2, gold: 3 };
if (packOrder[newPack] <= packOrder[currentPack]) {
  throw new Error('Can only upgrade to higher tier');
}
```

## 📧 Email Trigger Points

```typescript
// After payment
→ Send to owner: "Payment received, under review"
→ Send to admin: "New property pending approval"

// After approval
→ Send to owner: "Property approved and live!"

// After rejection
→ Send to owner: "Property rejected: [reason]"

// 30 days before expiry
→ Send to owner: "Membership expiring soon"

// On expiry
→ Send to owner: "Membership expired, renew now"
```

## 🔢 Common Calculations

```typescript
// VAT (20%)
const withVAT = basePrice * 1.2;
const vatOnly = basePrice * 0.2;

// 12-month total (monthly)
const yearTotal = monthlyPrice * 12;

// Annual savings
const savings = (monthlyPrice * 12) - annualPrice;

// Pro-rata refund
const dailyRate = totalPaid / 365;
const refund = dailyRate * remainingDays;
```

## 🚦 Permission Checks

```typescript
// Create property
role === 'owner' || role === 'admin'

// Approve property
role === 'admin'

// Edit own property
property.ownerId === userId || role === 'admin'

// View pending queue
role === 'admin'
```

---

**Print this card for quick reference during development!**
