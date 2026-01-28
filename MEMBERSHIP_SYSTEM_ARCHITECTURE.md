# Property Listing Platform - Membership System Architecture

## System Overview
Platform for property owners to list group accommodation properties with tiered membership packs. Each property requires its own membership pack. Admin approval required before properties go live.

---

## Pricing Model (Strict Rules)

### Membership Packs (Per Property)

**Bronze Pack**
- Annual: £450 + VAT per year
- Monthly: £40/month (£480 total over 12 months)
- Minimum commitment: 1 year
- **Features**: Annual Membership with Fully Optimised Listing

**Silver Pack**
- Annual: £650 + VAT per year
- Monthly: £57/month (£684 total over 12 months)
- Minimum commitment: 1 year
- **Features**: All Bronze features PLUS:
  - Page build and ongoing production support
  - Social media promotion (including late deals)
  - Themed blog feature
  - 3 holiday focus pages

**Gold Pack**
- Annual: £850 + VAT per year
- Monthly: £75/month (£900 total over 12 months)
- Minimum commitment: 1 year
- **Features**: All Silver features PLUS:
  - Homepage features
  - Specialist page (Weddings, Youth, or Business)

### Critical Pricing Rules
1. ✅ Membership is **per property**, NOT per owner
2. ✅ One owner can have multiple properties, each with different packs
3. ✅ Monthly payments require 12-month minimum commitment
4. ✅ Annual payment is cheaper than monthly (savings shown below)
5. ✅ VAT is added on top of all prices
6. ❌ One pack CANNOT cover multiple properties

**Savings Comparison:**
- Bronze: Annual saves £30 vs Monthly (£450 vs £480)
- Silver: Annual saves £34 vs Monthly (£650 vs £684)
- Gold: Annual saves £50 vs Monthly (£850 vs £900)

---

## Owner Journey Flow

### 1. Registration (Free, No Payment Required)
```
┌─────────────────────────────────────────────────────────┐
│ Owner visits website → Click "List Your Property"      │
│                                                         │
│ Registration Form:                                      │
│  - Full Name                                           │
│  - Email Address                                       │
│  - Password                                            │
│  - Phone Number (optional)                             │
│  - Company Name (optional)                             │
│                                                         │
│ ✅ Submit → Email verification → Auto-login            │
│                                                         │
│ Result: Immediate access to Owner Dashboard            │
│         No payment required                            │
└─────────────────────────────────────────────────────────┘
```

### 2. Owner Dashboard Access (Post-Signup)
```
Owner Dashboard
├── My Properties (list of all properties)
│   ├── Draft properties (unpaid)
│   ├── Pending approval (paid, waiting for admin)
│   ├── Live properties (approved & published)
│   └── Rejected properties (admin rejected)
│
├── Add New Property (button)
├── Payments & Invoices
├── Enquiries Inbox
├── Property Analytics
└── Account Settings
```

### 3. Adding a Property (Pre-Payment)
```
Step 1: Property Details
├── Property Name *
├── Property Type (Manor House, Farmhouse, Lodge, etc.)
├── Location (Address, Postcode, Region)
├── Description *
├── Sleeps (max guests) *
├── Bedrooms *
├── Bathrooms *
└── Continue

Step 2: Amenities & Features
├── Kitchen facilities
├── Parking
├── Wi-Fi
├── Pet-friendly
├── Hot tub / Pool
├── Accessible
└── Continue

Step 3: Photos Upload
├── Upload property images (min 5, max 30)
├── Set featured image
└── Continue

Step 4: Pricing & Availability
├── Nightly rate (low season)
├── Nightly rate (high season)
├── Minimum stay (nights)
├── Booking calendar setup
└── Continue

Step 5: Select Membership Pack *
┌─────────────────────────────────────────────────┐
│ ⚪ Bronze - £450/year or £40/month             │
│    ✓ Fully Optimised Listing                   │
│                                                 │
│ ⚪ Silver - £650/year or £57/month             │
│    ✓ Everything in Bronze                      │
│    ✓ Page build & production support           │
│    ✓ Social media promotion                    │
│    ✓ Themed blog feature                       │
│    ✓ 3 holiday focus pages                     │
│                                                 │
│ ⚪ Gold - £850/year or £75/month               │
│    ✓ Everything in Silver                      │
│    ✓ Homepage features                         │
│    ✓ Specialist page (Weddings/Youth/Business) │
└─────────────────────────────────────────────────┘
    │
    ├── Select payment frequency: ⚪ Annual  ⚪ Monthly
    └── Continue

Step 6: Review & Save
├── Review all property details
├── Review selected membership pack
├── Total cost preview (incl. VAT)
└── Actions:
    ├── [Save as Draft] → Property saved, no payment
    └── [Save & Pay Now] → Redirect to checkout
```

### 4. Payment Flow
```
Scenario A: Pay for Single Property
┌──────────────────────────────────────────────┐
│ Checkout Summary                             │
│                                              │
│ Property: Willow Manor House                 │
│ Pack: Silver (Annual)                        │
│ Subtotal: £650.00                            │
│ VAT (20%): £130.00                           │
│ ──────────────────                           │
│ Total: £780.00                               │
│                                              │
│ [Pay with Stripe] [Pay with PayPal]          │
└──────────────────────────────────────────────┘

Scenario B: Pay for Multiple Properties at Once
┌──────────────────────────────────────────────┐
│ Shopping Cart (Multiple Properties)          │
│                                              │
│ 1. Willow Manor - Silver Annual: £650       │
│ 2. Oak Lodge - Bronze Annual: £450          │
│ 3. Pine Retreat - Gold Monthly: £75/mo      │
│                                              │
│ Subtotal: £1,175.00 + £75/mo recurring       │
│ VAT (20%): £235.00 + £15/mo                  │
│ ──────────────────                           │
│ Due Today: £1,410.00                         │
│ Recurring: £90/month for 12 months           │
│                                              │
│ [Pay with Stripe]                            │
└──────────────────────────────────────────────┘
```

### 5. Post-Payment Status
```
✅ Payment Successful
│
├── Property status: PAID (awaiting approval)
├── Invoice sent to owner email
├── Admin notification: "New property pending approval"
│
└── Owner Dashboard updated:
    ├── Property shown in "Pending Approval" section
    ├── Yellow/orange status badge
    └── Message: "Your property is under review. 
                  You'll be notified when approved."
```

### 6. Post-Approval Experience
```
After Admin Approves:
│
├── ✅ Property status: LIVE (published on website)
├── 📧 Email notification to owner: "Property approved!"
├── Property appears in public search results
│
└── Owner Dashboard:
    ├── Property in "Live Properties" section
    ├── Green "Live" badge
    ├── Access to:
    │   ├── View enquiries
    │   ├── View property analytics (views, clicks)
    │   ├── Edit property details
    │   ├── Manage availability calendar
    │   └── View booking requests
```

---

## Admin Journey Flow

### 1. Admin Dashboard Overview
```
Admin Dashboard
├── 📊 Overview Stats
│   ├── Total owners: 234
│   ├── Total properties: 456
│   ├── Pending approval: 12
│   ├── Live properties: 387
│   ├── Monthly revenue: £45,678
│
├── 🔔 Notifications
│   ├── "3 new properties awaiting approval"
│   ├── "5 memberships expiring this month"
│
├── Quick Actions
│   ├── Review pending properties
│   ├── Manage membership packs
│   └── View all owners
```

### 2. Property Approval Workflow
```
Pending Properties Queue
┌───────────────────────────────────────────────────────┐
│ Property: Willow Manor House                          │
│ Owner: John Smith (john@example.com)                  │
│ Pack: Silver (Annual) - £650 + VAT                    │
│ Payment Status: ✅ PAID (£780 received)               │
│ Submitted: 2026-01-20 14:30                           │
│                                                       │
│ Property Details:                                     │
│  - Type: Manor House                                  │
│  - Sleeps: 20 guests                                  │
│  - Bedrooms: 8, Bathrooms: 6                          │
│  - Location: Cornwall, UK                             │
│  - Photos: 12 uploaded                                │
│                                                       │
│ [View Full Listing Preview]                           │
│                                                       │
│ Admin Actions:                                        │
│ ┌────────────────────────────────────────┐           │
│ │ Review Checklist:                      │           │
│ │ □ Property details complete            │           │
│ │ □ Photos meet quality standards        │           │
│ │ □ Description appropriate              │           │
│ │ □ Pricing reasonable                   │           │
│ │ □ Location verified                    │           │
│ └────────────────────────────────────────┘           │
│                                                       │
│ Decision:                                             │
│ [✅ Approve & Publish] [❌ Reject] [💬 Request Info] │
└───────────────────────────────────────────────────────┘

If Approved:
├── Property status → LIVE
├── Email sent to owner: "Property approved!"
├── Property appears on public website
└── Admin can add featured placements (if Gold pack)

If Rejected:
├── Property status → REJECTED
├── Admin must provide rejection reason
├── Email sent to owner with reason
└── Owner can edit and resubmit
```

### 3. Owner Management View
```
All Owners List
┌─────────────────────────────────────────────────────┐
│ Search: [________] Filter by: [All] [Active] [Inactive] │
│                                                     │
│ Owner: John Smith (john@example.com)                │
│ Joined: 2024-06-15                                  │
│ Properties: 3                                       │
│   1. Willow Manor - Silver (Annual) - LIVE         │
│   2. Oak Lodge - Bronze (Annual) - PENDING          │
│   3. Pine Retreat - Gold (Monthly) - DRAFT (unpaid) │
│                                                     │
│ Total Revenue: £1,430 (£780 + £650)                 │
│ [View Details] [Contact Owner] [View Properties]    │
├─────────────────────────────────────────────────────┤
│ Owner: Sarah Johnson (sarah@example.com)            │
│ Joined: 2025-03-10                                  │
│ Properties: 1                                       │
│   1. Seaside Cottage - Bronze (Monthly) - LIVE     │
│ [View Details] [Contact Owner]                      │
└─────────────────────────────────────────────────────┘
```

### 4. Membership Pack Management
```
Configure Membership Packs
┌─────────────────────────────────────────────────┐
│ Bronze Pack                           [Edit]    │
│ ─────────────────────────────────────────────   │
│ Annual Price: £450 + VAT                        │
│ Monthly Price: £40/month (£480 total)           │
│ Commitment: 12 months minimum                   │
│                                                 │
│ Features:                                       │
│ • Annual Membership with Fully Optimised Listing│
│                                                 │
│ Active Properties: 156                          │
│ Annual Revenue: £70,200                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Silver Pack                           [Edit]    │
│ ─────────────────────────────────────────────   │
│ Annual Price: £650 + VAT                        │
│ Monthly Price: £57/month (£684 total)           │
│                                                 │
│ Features:                                       │
│ • Everything in Bronze                          │
│ • Page build and ongoing production support     │
│ • Social media promotion (including late deals) │
│ • Themed blog feature                           │
│ • 3 holiday focus pages                         │
│                                                 │
│ Active Properties: 89                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Gold Pack                             [Edit]    │
│ ─────────────────────────────────────────────   │
│ Annual Price: £850 + VAT                        │
│ Monthly Price: £75/month (£900 total)           │
│                                                 │
│ Features:                                       │
│ • Everything in Silver                          │
│ • Homepage features                             │
│ • Specialist page (Weddings, Youth, Business)   │
│                                                 │
│ Active Properties: 45                           │
└─────────────────────────────────────────────────┘
```

---

## Property Lifecycle States

### State Machine Diagram
```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌─────────────────────┐
│  DRAFT              │ ← Owner creates property
│  (unpaid)           │   Selects pack but doesn't pay
│                     │   Can edit freely
│  Actions:           │
│  - Edit             │
│  - Delete           │
│  - Proceed to Pay   │
└──────────┬──────────┘
           │ Owner completes payment
           ▼
┌─────────────────────┐
│  PAID               │ ← Payment successful
│  (pending approval) │   Admin notified
│                     │   Owner cannot edit
│  Actions:           │
│  - Wait for admin   │
└──────────┬──────────┘
           │ Admin reviews
           │
      ┌────┴────┐
      │         │
      ▼         ▼
┌──────────┐  ┌──────────┐
│ APPROVED │  │ REJECTED │
│  (live)  │  │          │
│          │  │ Reason:  │
│ Visible  │  │ "..."    │
│ on site  │  │          │
│          │  │ Can      │
│ Actions: │  │ resubmit │
│ - Edit*  │  └──────────┘
│ - Pause  │
│ - Stats  │
└────┬─────┘
     │ Membership expires
     ▼
┌──────────┐
│ EXPIRED  │ ← Not visible on site
│          │   Owner prompted to renew
│ Actions: │
│ - Renew  │
│ - Delete │
└──────────┘

*Edit may require re-approval for major changes
```

### Detailed State Definitions

**DRAFT** (unpaid)
- **Trigger**: Owner creates property, selects pack, saves without payment
- **Visible to**: Owner only (in dashboard)
- **Visible on website**: No
- **Owner can**: Edit all fields, delete, select different pack, proceed to payment
- **Admin can**: View but not approve (no payment yet)
- **Database**: `status = 'draft'`, `payment_status = 'unpaid'`, `approved_at = null`

**PAID** (pending approval)
- **Trigger**: Payment successfully processed
- **Visible to**: Owner (in dashboard), Admin (approval queue)
- **Visible on website**: No (not approved yet)
- **Owner can**: View only, cancel (with refund window?)
- **Admin can**: Approve, reject, request changes
- **Database**: `status = 'pending_approval'`, `payment_status = 'paid'`, `paid_at = timestamp`, `approved_at = null`
- **Emails**: 
  - Owner: "Payment received, property under review"
  - Admin: "New property pending approval"

**APPROVED** (live/published)
- **Trigger**: Admin approves property
- **Visible to**: Everyone (public website)
- **Visible on website**: Yes (search results, map, listings)
- **Owner can**: View analytics, edit (minor changes allowed, major changes may trigger re-review), pause listing
- **Admin can**: Unpublish, edit, feature on homepage (if Gold pack)
- **Database**: `status = 'live'`, `payment_status = 'paid'`, `approved_at = timestamp`, `published_at = timestamp`
- **Emails**: Owner: "Property approved and live!"
- **Features unlocked**: Based on pack tier (Bronze/Silver/Gold features activated)

**REJECTED**
- **Trigger**: Admin rejects property
- **Visible to**: Owner only
- **Visible on website**: No
- **Owner can**: View rejection reason, edit and resubmit, request refund
- **Admin can**: View, reconsider
- **Database**: `status = 'rejected'`, `payment_status = 'paid'`, `rejected_at = timestamp`, `rejection_reason = text`
- **Emails**: Owner: "Property rejected: [reason]"
- **Refund policy**: TBD (e.g., full refund if rejected within 7 days)

**PAUSED**
- **Trigger**: Owner manually pauses listing
- **Visible to**: Owner only
- **Visible on website**: No
- **Owner can**: Resume, edit
- **Database**: `status = 'paused'`, `paused_at = timestamp`
- **Note**: Membership still active, just temporarily hidden

**EXPIRED**
- **Trigger**: Membership end date reached without renewal
- **Visible to**: Owner (dashboard warning)
- **Visible on website**: No (auto-unpublished)
- **Owner can**: Renew membership
- **Database**: `status = 'expired'`, `expired_at = timestamp`
- **Emails**: 
  - 30 days before: "Membership expiring soon"
  - 7 days before: "Final reminder: Renew now"
  - On expiry: "Membership expired, property unpublished"

---

## Database Schema

### Tables and Relationships

```sql
-- Users Table (Owners & Admins)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'owner', -- 'owner', 'admin'
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membership Packs Configuration (System Config)
CREATE TABLE membership_packs (
  id VARCHAR(20) PRIMARY KEY, -- 'bronze', 'silver', 'gold'
  name VARCHAR(50) NOT NULL, -- 'Bronze', 'Silver', 'Gold'
  description TEXT,
  
  -- Pricing
  annual_price DECIMAL(10, 2) NOT NULL, -- £450, £650, £850
  monthly_price DECIMAL(10, 2) NOT NULL, -- £40, £57, £75
  vat_rate DECIMAL(5, 2) DEFAULT 20.00, -- 20% VAT
  
  -- Features (JSON)
  features JSONB NOT NULL,
  /* Example:
  {
    "listing": true,
    "page_build": false,
    "social_media": false,
    "blog_feature": false,
    "holiday_pages": 0,
    "homepage_feature": false,
    "specialist_page": false
  }
  */
  
  -- Constraints
  minimum_commitment_months INTEGER DEFAULT 12,
  
  -- Display
  display_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  property_type VARCHAR(100), -- 'Manor House', 'Farmhouse', etc.
  description TEXT,
  
  -- Location
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  county VARCHAR(100),
  postcode VARCHAR(20),
  country VARCHAR(100) DEFAULT 'United Kingdom',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Capacity
  sleeps INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  
  -- Amenities (JSON)
  amenities JSONB,
  /* Example:
  {
    "kitchen": true,
    "parking": true,
    "wifi": true,
    "pets": false,
    "hot_tub": true,
    "pool": false,
    "accessible": true
  }
  */
  
  -- Media
  featured_image_url VARCHAR(500),
  images JSONB, -- Array of image URLs
  
  -- Pricing
  nightly_rate_low_season DECIMAL(10, 2),
  nightly_rate_high_season DECIMAL(10, 2),
  minimum_stay_nights INTEGER DEFAULT 1,
  
  -- Membership
  membership_pack_id VARCHAR(20) REFERENCES membership_packs(id),
  payment_frequency VARCHAR(10), -- 'annual', 'monthly'
  
  -- Status & Lifecycle
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- Possible values: 'draft', 'pending_approval', 'live', 'rejected', 'paused', 'expired'
  
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  -- Possible values: 'unpaid', 'paid', 'refunded', 'failed'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  submitted_for_approval_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  published_at TIMESTAMP,
  paused_at TIMESTAMP,
  expired_at TIMESTAMP,
  
  -- Admin
  approved_by_admin_id UUID REFERENCES users(id),
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  enquiry_count INTEGER DEFAULT 0,
  
  CONSTRAINT valid_status CHECK (
    status IN ('draft', 'pending_approval', 'live', 'rejected', 'paused', 'expired')
  ),
  CONSTRAINT valid_payment_status CHECK (
    payment_status IN ('unpaid', 'paid', 'refunded', 'failed')
  )
);

-- Property Subscriptions (Tracks membership periods)
CREATE TABLE property_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  membership_pack_id VARCHAR(20) NOT NULL REFERENCES membership_packs(id),
  
  -- Subscription details
  payment_frequency VARCHAR(10) NOT NULL, -- 'annual', 'monthly'
  
  -- Pricing at time of purchase (historical record)
  base_price DECIMAL(10, 2) NOT NULL,
  vat_amount DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL, -- Always 12 months from start
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  -- Possible values: 'active', 'expired', 'cancelled', 'upgraded'
  
  -- Payment tracking
  stripe_subscription_id VARCHAR(255), -- If monthly
  stripe_payment_intent_id VARCHAR(255), -- If annual
  
  -- Renewal
  auto_renew BOOLEAN DEFAULT TRUE,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_subscription_status CHECK (
    status IN ('active', 'expired', 'cancelled', 'upgraded')
  )
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  property_id UUID REFERENCES properties(id), -- Can be NULL for other payments
  subscription_id UUID REFERENCES property_subscriptions(id),
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  payment_status VARCHAR(50) NOT NULL,
  
  -- Stripe
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Metadata
  description TEXT,
  receipt_url VARCHAR(500),
  receipt_email VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  
  CONSTRAINT valid_payment_status CHECK (
    payment_status IN ('pending', 'succeeded', 'failed', 'refunded')
  )
);

-- Property Enquiries (Direct enquiries from guests)
CREATE TABLE enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Guest details
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50),
  
  -- Enquiry
  check_in_date DATE,
  check_out_date DATE,
  number_of_guests INTEGER,
  message TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'new',
  -- Possible values: 'new', 'read', 'replied', 'closed'
  
  -- Owner response
  owner_reply TEXT,
  replied_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_enquiry_status CHECK (
    status IN ('new', 'read', 'replied', 'closed')
  )
);

-- Admin Activity Log
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- 'approve_property', 'reject_property', etc.
  entity_type VARCHAR(50), -- 'property', 'user', 'payment'
  entity_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_membership ON properties(membership_pack_id);
CREATE INDEX idx_subscriptions_property ON property_subscriptions(property_id);
CREATE INDEX idx_subscriptions_status ON property_subscriptions(status);
CREATE INDEX idx_subscriptions_dates ON property_subscriptions(start_date, end_date);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_property ON payments(property_id);
CREATE INDEX idx_enquiries_property ON enquiries(property_id);
CREATE INDEX idx_enquiries_status ON enquiries(status);
```

---

## Backend Business Rules

### Rule 1: Property Creation
```typescript
// RULE: Any owner can create unlimited properties WITHOUT payment
async function createProperty(ownerId: string, propertyData: PropertyInput) {
  // Validate owner exists
  const owner = await db.users.findUnique({ where: { id: ownerId }});
  if (!owner) throw new Error('Owner not found');
  
  // Create property in DRAFT status
  const property = await db.properties.create({
    data: {
      ...propertyData,
      owner_id: ownerId,
      status: 'draft',
      payment_status: 'unpaid',
      // membership_pack_id can be selected but not enforced yet
    }
  });
  
  return property;
}
```

### Rule 2: Pack Selection per Property
```typescript
// RULE: Each property MUST have its own membership pack
// One pack CANNOT cover multiple properties
async function assignMembershipPack(
  propertyId: string, 
  packId: string,
  paymentFrequency: 'annual' | 'monthly'
) {
  // Validate pack exists
  const pack = await db.membership_packs.findUnique({ 
    where: { id: packId } 
  });
  if (!pack) throw new Error('Invalid membership pack');
  
  // Update property
  await db.properties.update({
    where: { id: propertyId },
    data: {
      membership_pack_id: packId,
      payment_frequency: paymentFrequency,
      updated_at: new Date()
    }
  });
  
  // DO NOT mark as paid or change status yet
  // Payment happens in separate flow
}
```

### Rule 3: Multi-Property Checkout
```typescript
// RULE: Owner can pay for multiple properties in one transaction
async function createCheckoutSession(
  ownerId: string,
  propertyIds: string[]
) {
  // Fetch all properties
  const properties = await db.properties.findMany({
    where: {
      id: { in: propertyIds },
      owner_id: ownerId,
      status: 'draft', // Only unpaid properties
      membership_pack_id: { not: null } // Must have pack selected
    },
    include: { membership_pack: true }
  });
  
  if (properties.length !== propertyIds.length) {
    throw new Error('Some properties are invalid or already paid');
  }
  
  // Calculate total
  let lineItems = [];
  let totalAmount = 0;
  
  for (const property of properties) {
    const pack = property.membership_pack;
    const isAnnual = property.payment_frequency === 'annual';
    
    const basePrice = isAnnual ? pack.annual_price : pack.monthly_price;
    const vatAmount = basePrice * (pack.vat_rate / 100);
    const totalPrice = basePrice + vatAmount;
    
    lineItems.push({
      property_id: property.id,
      property_name: property.name,
      pack_name: pack.name,
      frequency: property.payment_frequency,
      base_price: basePrice,
      vat_amount: vatAmount,
      total_price: totalPrice
    });
    
    totalAmount += totalPrice;
  }
  
  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    customer_email: owner.email,
    mode: 'payment', // Or 'subscription' for monthly
    line_items: lineItems.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `${item.pack_name} Membership - ${item.property_name}`,
          description: `${item.frequency === 'annual' ? 'Annual' : 'Monthly (12 months)'}`
        },
        unit_amount: Math.round(item.total_price * 100), // Pence
      },
      quantity: 1
    })),
    metadata: {
      owner_id: ownerId,
      property_ids: JSON.stringify(propertyIds)
    },
    success_url: `${process.env.DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DOMAIN}/dashboard/properties`
  });
  
  return session;
}
```

### Rule 4: Payment Completion Handler
```typescript
// RULE: On successful payment, mark properties as PAID and notify admin
async function handlePaymentSuccess(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  
  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }
  
  const ownerId = session.metadata.owner_id;
  const propertyIds = JSON.parse(session.metadata.property_ids);
  
  // Start transaction
  await db.$transaction(async (tx) => {
    // Update all properties to PAID status
    const now = new Date();
    await tx.properties.updateMany({
      where: { id: { in: propertyIds } },
      data: {
        status: 'pending_approval',
        payment_status: 'paid',
        paid_at: now,
        submitted_for_approval_at: now,
        updated_at: now
      }
    });
    
    // Create subscription records
    for (const propertyId of propertyIds) {
      const property = await tx.properties.findUnique({
        where: { id: propertyId },
        include: { membership_pack: true }
      });
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 12 months
      
      const isAnnual = property.payment_frequency === 'annual';
      const basePrice = isAnnual 
        ? property.membership_pack.annual_price 
        : property.membership_pack.monthly_price;
      const vatAmount = basePrice * (property.membership_pack.vat_rate / 100);
      
      await tx.property_subscriptions.create({
        data: {
          property_id: propertyId,
          membership_pack_id: property.membership_pack_id,
          payment_frequency: property.payment_frequency,
          base_price: basePrice,
          vat_amount: vatAmount,
          total_price: basePrice + vatAmount,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          stripe_payment_intent_id: session.payment_intent
        }
      });
    }
    
    // Create payment record
    await tx.payments.create({
      data: {
        user_id: ownerId,
        amount: session.amount_total / 100,
        currency: session.currency,
        payment_status: 'succeeded',
        stripe_payment_intent_id: session.payment_intent,
        stripe_charge_id: session.latest_charge,
        description: `Membership for ${propertyIds.length} properties`,
        processed_at: now
      }
    });
  });
  
  // Send notifications
  await sendEmail({
    to: owner.email,
    subject: 'Payment Successful - Properties Under Review',
    template: 'payment-success',
    data: { propertyIds }
  });
  
  await notifyAdmins({
    message: `${propertyIds.length} new properties pending approval`,
    propertyIds
  });
}
```

### Rule 5: Admin Approval
```typescript
// RULE: Only admin can approve. Approval makes property LIVE
async function approveProperty(adminId: string, propertyId: string) {
  // Verify admin role
  const admin = await db.users.findUnique({ where: { id: adminId }});
  if (admin.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  // Verify property is paid and pending
  const property = await db.properties.findUnique({
    where: { id: propertyId }
  });
  
  if (property.status !== 'pending_approval' || property.payment_status !== 'paid') {
    throw new Error('Property must be paid and pending approval');
  }
  
  // Approve and publish
  const now = new Date();
  await db.properties.update({
    where: { id: propertyId },
    data: {
      status: 'live',
      approved_at: now,
      published_at: now,
      approved_by_admin_id: adminId,
      updated_at: now
    }
  });
  
  // Log admin action
  await db.admin_activity_log.create({
    data: {
      admin_id: adminId,
      action: 'approve_property',
      entity_type: 'property',
      entity_id: propertyId
    }
  });
  
  // Send notification to owner
  await sendEmail({
    to: property.owner.email,
    subject: 'Property Approved!',
    template: 'property-approved',
    data: { propertyName: property.name }
  });
}
```

### Rule 6: Pack Feature Enforcement
```typescript
// RULE: Features are enabled based on membership pack tier
function getPropertyFeatures(property: Property): PropertyFeatures {
  const packFeatures = property.membership_pack.features;
  
  return {
    // Bronze features (all packs)
    has_listing: true,
    
    // Silver features
    has_page_build: packFeatures.page_build || false,
    has_social_media: packFeatures.social_media || false,
    has_blog_feature: packFeatures.blog_feature || false,
    holiday_pages_count: packFeatures.holiday_pages || 0,
    
    // Gold features
    has_homepage_feature: packFeatures.homepage_feature || false,
    has_specialist_page: packFeatures.specialist_page || false,
    
    // Status-based features
    can_receive_enquiries: property.status === 'live',
    is_searchable: property.status === 'live',
    show_on_map: property.status === 'live'
  };
}

// Example: Check if property can be featured on homepage
async function featurePropertyOnHomepage(propertyId: string) {
  const property = await db.properties.findUnique({
    where: { id: propertyId },
    include: { membership_pack: true }
  });
  
  const features = getPropertyFeatures(property);
  
  if (!features.has_homepage_feature) {
    throw new Error('Gold membership required for homepage features');
  }
  
  if (property.status !== 'live') {
    throw new Error('Only live properties can be featured');
  }
  
  // Proceed with homepage featuring...
}
```

### Rule 7: Property Lifecycle Guards
```typescript
// RULE: State transitions must follow the lifecycle
function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = {
    'draft': ['pending_approval'], // Only after payment
    'pending_approval': ['live', 'rejected'],
    'live': ['paused', 'expired'],
    'rejected': ['pending_approval'], // Can resubmit after edits
    'paused': ['live'],
    'expired': ['pending_approval'] // Needs renewal payment
  };
  
  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
}

async function updatePropertyStatus(
  propertyId: string, 
  newStatus: string
) {
  const property = await db.properties.findUnique({ 
    where: { id: propertyId } 
  });
  
  if (!canTransitionTo(property.status, newStatus)) {
    throw new Error(`Cannot transition from ${property.status} to ${newStatus}`);
  }
  
  await db.properties.update({
    where: { id: propertyId },
    data: { status: newStatus, updated_at: new Date() }
  });
}
```

---

## Renewals, Upgrades & Expiry Handling

### Membership Renewal

**30 Days Before Expiry:**
```typescript
// Cron job runs daily to check expiring subscriptions
async function sendRenewalReminders() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const expiringSubscriptions = await db.property_subscriptions.findMany({
    where: {
      status: 'active',
      end_date: {
        gte: new Date(),
        lte: thirtyDaysFromNow
      }
    },
    include: {
      property: {
        include: { owner: true }
      }
    }
  });
  
  for (const sub of expiringSubscriptions) {
    await sendEmail({
      to: sub.property.owner.email,
      subject: `Membership Expiring Soon: ${sub.property.name}`,
      template: 'renewal-reminder-30-days',
      data: {
        propertyName: sub.property.name,
        expiryDate: sub.end_date,
        renewalUrl: `${process.env.DOMAIN}/dashboard/renew/${sub.property.id}`
      }
    });
  }
}
```

**On Expiry Day:**
```typescript
// Cron job runs daily to expire memberships
async function handleExpiredMemberships() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiredSubscriptions = await db.property_subscriptions.findMany({
    where: {
      status: 'active',
      end_date: { lt: today }
    },
    include: { property: true }
  });
  
  for (const sub of expiredSubscriptions) {
    await db.$transaction(async (tx) => {
      // Mark subscription as expired
      await tx.property_subscriptions.update({
        where: { id: sub.id },
        data: { status: 'expired' }
      });
      
      // Unpublish property
      await tx.properties.update({
        where: { id: sub.property_id },
        data: {
          status: 'expired',
          expired_at: new Date()
        }
      });
    });
    
    // Notify owner
    await sendEmail({
      to: sub.property.owner.email,
      subject: `Membership Expired: ${sub.property.name}`,
      template: 'membership-expired',
      data: {
        propertyName: sub.property.name,
        renewalUrl: `${process.env.DOMAIN}/dashboard/renew/${sub.property.id}`
      }
    });
  }
}
```

**Renewal Process:**
```typescript
// Owner clicks renewal link from dashboard
async function renewMembership(
  propertyId: string,
  paymentFrequency: 'annual' | 'monthly'
) {
  const property = await db.properties.findUnique({
    where: { id: propertyId },
    include: {
      membership_pack: true,
      subscriptions: {
        where: { status: 'expired' },
        orderBy: { end_date: 'desc' },
        take: 1
      }
    }
  });
  
  if (property.status !== 'expired') {
    throw new Error('Property membership is still active');
  }
  
  // Create new checkout for renewal
  const pack = property.membership_pack;
  const basePrice = paymentFrequency === 'annual' 
    ? pack.annual_price 
    : pack.monthly_price;
  const vatAmount = basePrice * (pack.vat_rate / 100);
  const totalPrice = basePrice + vatAmount;
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `${pack.name} Membership Renewal - ${property.name}`
        },
        unit_amount: Math.round(totalPrice * 100)
      },
      quantity: 1
    }],
    metadata: {
      property_id: propertyId,
      is_renewal: 'true',
      payment_frequency: paymentFrequency
    },
    success_url: `${process.env.DOMAIN}/dashboard/renewal-success`,
    cancel_url: `${process.env.DOMAIN}/dashboard/properties`
  });
  
  return session;
}

// After renewal payment success
async function handleRenewalSuccess(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const propertyId = session.metadata.property_id;
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);
  
  await db.$transaction(async (tx) => {
    // Create new subscription
    await tx.property_subscriptions.create({
      data: {
        property_id: propertyId,
        membership_pack_id: property.membership_pack_id,
        payment_frequency: session.metadata.payment_frequency,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        // ... pricing details
      }
    });
    
    // Reactivate property (but needs re-approval)
    await tx.properties.update({
      where: { id: propertyId },
      data: {
        status: 'pending_approval', // Admin must re-approve
        payment_status: 'paid',
        paid_at: new Date()
      }
    });
  });
  
  // Notify admin and owner
}
```

### Pack Upgrades

**Owner Initiates Upgrade (e.g., Bronze → Silver):**
```typescript
async function upgradePropertyPack(
  propertyId: string,
  newPackId: string,
  paymentFrequency: 'annual' | 'monthly'
) {
  const property = await db.properties.findUnique({
    where: { id: propertyId },
    include: {
      membership_pack: true,
      subscriptions: {
        where: { status: 'active' },
        orderBy: { created_at: 'desc' },
        take: 1
      }
    }
  });
  
  if (!property.subscriptions.length) {
    throw new Error('No active subscription found');
  }
  
  const currentSub = property.subscriptions[0];
  const newPack = await db.membership_packs.findUnique({
    where: { id: newPackId }
  });
  
  // Calculate pro-rata refund for remaining period
  const now = new Date();
  const remainingDays = Math.ceil(
    (currentSub.end_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalDays = 365;
  const unusedAmount = (currentSub.total_price / totalDays) * remainingDays;
  
  // Calculate new pack price
  const newBasePrice = paymentFrequency === 'annual' 
    ? newPack.annual_price 
    : newPack.monthly_price;
  const newVatAmount = newBasePrice * (newPack.vat_rate / 100);
  const newTotalPrice = newBasePrice + newVatAmount;
  
  // Amount to charge = new pack - unused credit
  const upgradeAmount = Math.max(0, newTotalPrice - unusedAmount);
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `Upgrade to ${newPack.name} - ${property.name}`,
          description: `Credit applied: £${unusedAmount.toFixed(2)}`
        },
        unit_amount: Math.round(upgradeAmount * 100)
      },
      quantity: 1
    }],
    metadata: {
      property_id: propertyId,
      is_upgrade: 'true',
      old_pack_id: property.membership_pack_id,
      new_pack_id: newPackId,
      old_subscription_id: currentSub.id
    },
    success_url: `${process.env.DOMAIN}/dashboard/upgrade-success`,
    cancel_url: `${process.env.DOMAIN}/dashboard/properties`
  });
  
  return session;
}

// After upgrade payment
async function handleUpgradeSuccess(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const { property_id, new_pack_id, old_subscription_id } = session.metadata;
  
  await db.$transaction(async (tx) => {
    // Mark old subscription as upgraded
    await tx.property_subscriptions.update({
      where: { id: old_subscription_id },
      data: {
        status: 'upgraded',
        cancelled_at: new Date()
      }
    });
    
    // Create new subscription with remaining period
    const oldSub = await tx.property_subscriptions.findUnique({
      where: { id: old_subscription_id }
    });
    
    await tx.property_subscriptions.create({
      data: {
        property_id: property_id,
        membership_pack_id: new_pack_id,
        start_date: new Date(),
        end_date: oldSub.end_date, // Keep same expiry
        status: 'active',
        // ... pricing details
      }
    });
    
    // Update property pack
    await tx.properties.update({
      where: { id: property_id },
      data: {
        membership_pack_id: new_pack_id,
        updated_at: new Date()
      }
    });
  });
  
  // New features unlocked immediately
}
```

### Pack Downgrades

**Not allowed mid-subscription:**
```typescript
// Owners can only downgrade at renewal time
function canDowngradePack(propertyId: string): boolean {
  // Check if subscription is near expiry (within 30 days)
  // Only then allow downgrade selection for next period
  return false; // Mid-subscription downgrades not permitted
}
```

**At Renewal:**
```typescript
// Owner can select lower pack when renewing
async function renewWithDifferentPack(
  propertyId: string,
  newPackId: string,
  paymentFrequency: 'annual' | 'monthly'
) {
  // Same as renewal process, but with new pack selection
  // No pro-rata calculations needed (subscription already expired)
}
```

---

## Summary of Key Constraints

### ✅ MUST Follow

1. **Per-Property Pricing**: Each property = separate membership fee
2. **No Shared Packs**: Cannot share one pack across multiple properties
3. **Free Signup**: Owners register without payment
4. **Draft Creation**: Can create unlimited properties before paying
5. **Multi-Property Checkout**: Can pay for multiple properties at once
6. **Admin Approval Required**: Payment ≠ Publishing, admin must approve
7. **12-Month Minimum**: All monthly subscriptions require 12-month commitment
8. **VAT on Top**: All prices + 20% VAT
9. **Exact Pricing**: Follow bronze/silver/gold pricing exactly
10. **Feature Tiers**: Features strictly based on pack level

### ❌ DO NOT

1. Allow one pack to cover multiple properties
2. Auto-publish properties after payment
3. Require payment at signup
4. Allow editing prices or creating custom packs
5. Skip admin approval step
6. Allow mid-subscription downgrades
7. Mix features across tiers

---

## Next Steps for Implementation

### Phase 1: Core Setup (Week 1-2)
- [ ] Set up database schema
- [ ] Create user authentication (owner/admin)
- [ ] Build membership packs configuration
- [ ] Implement property CRUD (owner dashboard)

### Phase 2: Payment Integration (Week 3-4)
- [ ] Stripe integration (checkout sessions)
- [ ] Multi-property cart functionality
- [ ] Payment success webhooks
- [ ] Invoice generation

### Phase 3: Admin System (Week 5-6)
- [ ] Admin dashboard
- [ ] Property approval queue
- [ ] Owner management view
- [ ] Admin activity logging

### Phase 4: Property Lifecycle (Week 7-8)
- [ ] State machine implementation
- [ ] Email notifications (all states)
- [ ] Expiry/renewal cron jobs
- [ ] Upgrade/downgrade flows

### Phase 5: Features & Publishing (Week 9-10)
- [ ] Public property listings
- [ ] Search and filters
- [ ] Enquiry system
- [ ] Pack feature enforcement
- [ ] Homepage featuring (Gold)
- [ ] Analytics dashboard (owner)

### Phase 6: Testing & Launch (Week 11-12)
- [ ] End-to-end testing
- [ ] Payment testing (Stripe test mode)
- [ ] Admin workflow testing
- [ ] Go live!

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-25  
**Author**: Senior Full-Stack Engineer & System Architect
