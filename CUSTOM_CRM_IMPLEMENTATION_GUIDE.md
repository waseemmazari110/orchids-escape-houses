# Custom CRM System Implementation Guide

**Status:** Implementation Plan  
**Created:** February 2, 2026  
**Objective:** Build custom CRM to replace paid TreadSoft integration  
**Scope:** Owner profiles, properties, enquiries, memberships, activity tracking  
**Estimated Timeline:** 3-5 days

---

## Overview

Instead of integrating with TreadSoft (paid CRM), we'll build our own **custom CRM system** within the project. This CRM will:

✅ Store all customer/owner data  
✅ Track all properties and listings  
✅ Log all enquiries and interactions  
✅ Monitor membership and payment status  
✅ Provide admin dashboard for business intelligence  
✅ Generate reports and analytics  
✅ Store communication history  

---

## Architecture

### System Components

```
Custom CRM System
├── Database Layer (New tables)
├── API Layer (CRUD endpoints)
├── Admin Dashboard (CRM views)
├── Sync Engine (Auto-sync data)
└── Reports & Analytics
```

### Data Flow

```
Owner Signs Up → Auto-sync to CRM
                     ↓
Creates Property → Auto-sync to CRM
                     ↓
Gets Enquiry → Auto-sync to CRM
                     ↓
Makes Payment → Auto-sync to CRM
                     ↓
Admin Dashboard → View all data in CRM
```

---

## Phase 1: Database Schema (Custom CRM Tables)

### New Tables to Create

#### 1. **crm_contacts** (Owner/Guest Contact Records)
```sql
CREATE TABLE crm_contacts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'owner' | 'guest'
  firstName TEXT,
  lastName TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT,
  
  -- Owner specific fields
  businessName TEXT,
  taxId TEXT,
  bankDetails TEXT, -- JSON
  
  -- Guest specific fields
  companyName TEXT,
  eventType TEXT, -- 'birthday', 'wedding', 'corporate', etc
  
  -- Common fields
  status TEXT DEFAULT 'active', -- 'active' | 'inactive' | 'blocked'
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lastContactedAt TEXT,
  
  -- Foreign key
  userId TEXT UNIQUE REFERENCES user(id)
);

-- Indexes
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_type ON crm_contacts(type);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_userId ON crm_contacts(userId);
```

#### 2. **crm_properties** (Property Record in CRM)
```sql
CREATE TABLE crm_properties (
  id TEXT PRIMARY KEY,
  ownerId TEXT NOT NULL REFERENCES crm_contacts(id),
  propertyId TEXT NOT NULL REFERENCES properties(id),
  
  -- Property Info (denormalized for quick access)
  title TEXT NOT NULL,
  location TEXT,
  bedrooms INT,
  bathrooms INT,
  maxGuests INT,
  pricePerNight DECIMAL(10, 2),
  
  -- Status
  listingStatus TEXT, -- 'draft' | 'pending_approval' | 'live' | 'paused' | 'rejected'
  membershipTier TEXT, -- 'bronze' | 'silver' | 'gold'
  
  -- Analytics
  viewCount INT DEFAULT 0,
  enquiryCount INT DEFAULT 0,
  bookingCount INT DEFAULT 0,
  totalRevenue DECIMAL(12, 2) DEFAULT 0,
  
  -- Timeline
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  publishedAt TEXT,
  expiresAt TEXT,
  
  -- Notes
  internalNotes TEXT,
  rejectionReason TEXT
);

CREATE INDEX idx_crm_properties_ownerId ON crm_properties(ownerId);
CREATE INDEX idx_crm_properties_status ON crm_properties(listingStatus);
CREATE INDEX idx_crm_properties_tier ON crm_properties(membershipTier);
```

#### 3. **crm_enquiries** (All Enquiries/Interactions)
```sql
CREATE TABLE crm_enquiries (
  id TEXT PRIMARY KEY,
  contactId TEXT NOT NULL REFERENCES crm_contacts(id),
  ownerId TEXT NOT NULL REFERENCES crm_contacts(id),
  propertyId TEXT NOT NULL REFERENCES crm_properties(id),
  
  -- Enquiry Details
  status TEXT DEFAULT 'new', -- 'new' | 'contacted' | 'negotiating' | 'booked' | 'lost' | 'spam'
  eventType TEXT,
  eventDate TEXT,
  estimatedGuests INT,
  estimatedBudget DECIMAL(12, 2),
  
  -- Communication
  message TEXT,
  guestEmail TEXT,
  guestPhone TEXT,
  guestName TEXT,
  
  -- Timeline
  createdAt TEXT NOT NULL,
  firstResponseAt TEXT,
  lastUpdatedAt TEXT,
  closedAt TEXT,
  
  -- Conversion tracking
  convertedToBooking BOOLEAN DEFAULT FALSE,
  bookingValue DECIMAL(12, 2),
  
  -- Internal tracking
  assignedToAdminId TEXT REFERENCES admin(id),
  internalNotes TEXT,
  priority TEXT, -- 'low' | 'medium' | 'high'
  source TEXT -- 'form' | 'email' | 'phone' | 'website'
);

CREATE INDEX idx_crm_enquiries_contactId ON crm_enquiries(contactId);
CREATE INDEX idx_crm_enquiries_ownerId ON crm_enquiries(ownerId);
CREATE INDEX idx_crm_enquiries_status ON crm_enquiries(status);
CREATE INDEX idx_crm_enquiries_createdAt ON crm_enquiries(createdAt);
```

#### 4. **crm_memberships** (Membership/Subscription Tracking)
```sql
CREATE TABLE crm_memberships (
  id TEXT PRIMARY KEY,
  contactId TEXT NOT NULL REFERENCES crm_contacts(id),
  
  -- Plan Details
  planTier TEXT NOT NULL, -- 'bronze' | 'silver' | 'gold'
  planPrice DECIMAL(10, 2),
  billingCycle TEXT, -- 'annual' | 'monthly'
  
  -- Dates
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  renewalDate TEXT,
  cancelledDate TEXT,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active' | 'expiring_soon' | 'expired' | 'cancelled' | 'suspended'
  
  -- Payment Info
  stripeCustomerId TEXT,
  stripeSubscriptionId TEXT,
  lastPaymentDate TEXT,
  lastPaymentAmount DECIMAL(10, 2),
  nextPaymentDate TEXT,
  
  -- Auto-renewal
  autoRenew BOOLEAN DEFAULT TRUE,
  paymentFailureCount INT DEFAULT 0,
  
  -- Tracking
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  
  -- Notes
  notes TEXT
);

CREATE INDEX idx_crm_memberships_contactId ON crm_memberships(contactId);
CREATE INDEX idx_crm_memberships_status ON crm_memberships(status);
CREATE INDEX idx_crm_memberships_endDate ON crm_memberships(endDate);
```

#### 5. **crm_interactions** (Communication/Activity Log)
```sql
CREATE TABLE crm_interactions (
  id TEXT PRIMARY KEY,
  contactId TEXT NOT NULL REFERENCES crm_contacts(id),
  relatedPropertyId TEXT REFERENCES crm_properties(id),
  relatedEnquiryId TEXT REFERENCES crm_enquiries(id),
  
  -- Interaction Type
  type TEXT NOT NULL, -- 'email' | 'phone' | 'message' | 'note' | 'status_change'
  subject TEXT,
  content TEXT,
  
  -- Direction
  direction TEXT, -- 'inbound' | 'outbound' | 'internal'
  initiatedBy TEXT, -- 'contact' | 'owner' | 'admin' | 'system'
  
  -- Timeline
  createdAt TEXT NOT NULL,
  readAt TEXT,
  
  -- Metadata
  metadata TEXT -- JSON for flexible data storage
);

CREATE INDEX idx_crm_interactions_contactId ON crm_interactions(contactId);
CREATE INDEX idx_crm_interactions_type ON crm_interactions(type);
CREATE INDEX idx_crm_interactions_createdAt ON crm_interactions(createdAt);
```

#### 6. **crm_activity_log** (Admin Actions & System Events)
```sql
CREATE TABLE crm_activity_log (
  id TEXT PRIMARY KEY,
  entityType TEXT NOT NULL, -- 'contact' | 'property' | 'enquiry' | 'membership'
  entityId TEXT NOT NULL,
  
  -- Action
  action TEXT NOT NULL, -- 'created' | 'updated' | 'deleted' | 'status_changed'
  changedFields TEXT, -- JSON with before/after values
  
  -- Who did it
  performedBy TEXT NOT NULL, -- 'system' | 'admin_id' | 'owner_id'
  ipAddress TEXT,
  
  -- When
  timestamp TEXT NOT NULL,
  
  -- Context
  reason TEXT,
  metadata TEXT -- JSON
);

CREATE INDEX idx_crm_activity_log_entityId ON crm_activity_log(entityId);
CREATE INDEX idx_crm_activity_log_timestamp ON crm_activity_log(timestamp);
CREATE INDEX idx_crm_activity_log_action ON crm_activity_log(action);
```

#### 7. **crm_segments** (Owner Segmentation for Marketing)
```sql
CREATE TABLE crm_segments (
  id TEXT PRIMARY KEY,
  contactId TEXT NOT NULL REFERENCES crm_contacts(id),
  
  -- Segment Tags
  segment TEXT NOT NULL, -- 'high_value' | 'churning' | 'at_risk' | 'premium' | 'inactive'
  
  -- Scoring
  lifetimeValue DECIMAL(12, 2),
  engagementScore INT, -- 0-100
  
  -- Dates
  addedAt TEXT NOT NULL,
  removedAt TEXT
);

CREATE INDEX idx_crm_segments_contactId ON crm_segments(contactId);
CREATE INDEX idx_crm_segments_segment ON crm_segments(segment);
```

---

## Phase 2: Migration SQL

Create file: `drizzle/0006_custom_crm_system.sql`

```sql
-- Custom CRM System Tables
-- Part 1: Core Contact Management

CREATE TABLE IF NOT EXISTS crm_contacts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('owner', 'guest')),
  firstName TEXT,
  lastName TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT,
  businessName TEXT,
  taxId TEXT,
  bankDetails TEXT,
  companyName TEXT,
  eventType TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'blocked')),
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lastContactedAt TEXT,
  userId TEXT UNIQUE REFERENCES user(id)
);

CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_type ON crm_contacts(type);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_userId ON crm_contacts(userId);

-- Part 2: Property Management in CRM

CREATE TABLE IF NOT EXISTS crm_properties (
  id TEXT PRIMARY KEY,
  ownerId TEXT NOT NULL REFERENCES crm_contacts(id),
  propertyId TEXT NOT NULL REFERENCES properties(id),
  title TEXT NOT NULL,
  location TEXT,
  bedrooms INT,
  bathrooms INT,
  maxGuests INT,
  pricePerNight DECIMAL(10, 2),
  listingStatus TEXT CHECK(listingStatus IN ('draft', 'pending_approval', 'live', 'paused', 'rejected')),
  membershipTier TEXT CHECK(membershipTier IN ('bronze', 'silver', 'gold')),
  viewCount INT DEFAULT 0,
  enquiryCount INT DEFAULT 0,
  bookingCount INT DEFAULT 0,
  totalRevenue DECIMAL(12, 2) DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  publishedAt TEXT,
  expiresAt TEXT,
  internalNotes TEXT,
  rejectionReason TEXT
);

CREATE INDEX idx_crm_properties_ownerId ON crm_properties(ownerId);
CREATE INDEX idx_crm_properties_status ON crm_properties(listingStatus);
CREATE INDEX idx_crm_properties_tier ON crm_properties(membershipTier);

-- Part 3: Enquiry Tracking

CREATE TABLE IF NOT EXISTS crm_enquiries (
  id TEXT PRIMARY KEY,
  contactId TEXT NOT NULL REFERENCES crm_contacts(id),
  ownerId TEXT NOT NULL REFERENCES crm_contacts(id),
  propertyId TEXT NOT NULL REFERENCES crm_properties(id),
  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'negotiating', 'booked', 'lost', 'spam')),
  eventType TEXT,
  eventDate TEXT,
  estimatedGuests INT,
  estimatedBudget DECIMAL(12, 2),
  message TEXT,
  guestEmail TEXT,
  guestPhone TEXT,
  guestName TEXT,
  createdAt TEXT NOT NULL,
  firstResponseAt TEXT,
  lastUpdatedAt TEXT,
  closedAt TEXT,
  convertedToBooking BOOLEAN DEFAULT FALSE,
  bookingValue DECIMAL(12, 2),
  assignedToAdminId TEXT,
  internalNotes TEXT,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
  source TEXT CHECK(source IN ('form', 'email', 'phone', 'website'))
);

CREATE INDEX idx_crm_enquiries_contactId ON crm_enquiries(contactId);
CREATE INDEX idx_crm_enquiries_ownerId ON crm_enquiries(ownerId);
CREATE INDEX idx_crm_enquiries_status ON crm_enquiries(status);
CREATE INDEX idx_crm_enquiries_createdAt ON crm_enquiries(createdAt);

-- Part 4: Membership Tracking

CREATE TABLE IF NOT EXISTS crm_memberships (
  id TEXT PRIMARY KEY,
  contactId TEXT NOT NULL REFERENCES crm_contacts(id),
  planTier TEXT NOT NULL CHECK(planTier IN ('bronze', 'silver', 'gold')),
  planPrice DECIMAL(10, 2),
  billingCycle TEXT CHECK(billingCycle IN ('annual', 'monthly')),
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  renewalDate TEXT,
  cancelledDate TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expiring_soon', 'expired', 'cancelled', 'suspended')),
  stripeCustomerId TEXT,
  stripeSubscriptionId TEXT,
  lastPaymentDate TEXT,
  lastPaymentAmount DECIMAL(10, 2),
  nextPaymentDate TEXT,
  autoRenew BOOLEAN DEFAULT TRUE,
  paymentFailureCount INT DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  notes TEXT
);

CREATE INDEX idx_crm_memberships_contactId ON crm_memberships(contactId);
CREATE INDEX idx_crm_memberships_status ON crm_memberships(status);
CREATE INDEX idx_crm_memberships_endDate ON crm_memberships(endDate);

-- Part 5: Interaction History

CREATE TABLE IF NOT EXISTS crm_interactions (
  id TEXT PRIMARY KEY,
  contactId TEXT NOT NULL REFERENCES crm_contacts(id),
  relatedPropertyId TEXT REFERENCES crm_properties(id),
  relatedEnquiryId TEXT REFERENCES crm_enquiries(id),
  type TEXT NOT NULL CHECK(type IN ('email', 'phone', 'message', 'note', 'status_change')),
  subject TEXT,
  content TEXT,
  direction TEXT CHECK(direction IN ('inbound', 'outbound', 'internal')),
  initiatedBy TEXT CHECK(initiatedBy IN ('contact', 'owner', 'admin', 'system')),
  createdAt TEXT NOT NULL,
  readAt TEXT,
  metadata TEXT
);

CREATE INDEX idx_crm_interactions_contactId ON crm_interactions(contactId);
CREATE INDEX idx_crm_interactions_type ON crm_interactions(type);
CREATE INDEX idx_crm_interactions_createdAt ON crm_interactions(createdAt);

-- Part 6: Activity Audit Log

CREATE TABLE IF NOT EXISTS crm_activity_log (
  id TEXT PRIMARY KEY,
  entityType TEXT NOT NULL CHECK(entityType IN ('contact', 'property', 'enquiry', 'membership')),
  entityId TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('created', 'updated', 'deleted', 'status_changed')),
  changedFields TEXT,
  performedBy TEXT NOT NULL,
  ipAddress TEXT,
  timestamp TEXT NOT NULL,
  reason TEXT,
  metadata TEXT
);

CREATE INDEX idx_crm_activity_log_entityId ON crm_activity_log(entityId);
CREATE INDEX idx_crm_activity_log_timestamp ON crm_activity_log(timestamp);

-- Part 7: Customer Segmentation

CREATE TABLE IF NOT EXISTS crm_segments (
  id TEXT PRIMARY KEY,
  contactId TEXT NOT NULL REFERENCES crm_contacts(id),
  segment TEXT NOT NULL CHECK(segment IN ('high_value', 'churning', 'at_risk', 'premium', 'inactive')),
  lifetimeValue DECIMAL(12, 2),
  engagementScore INT CHECK(engagementScore >= 0 AND engagementScore <= 100),
  addedAt TEXT NOT NULL,
  removedAt TEXT
);

CREATE INDEX idx_crm_segments_contactId ON crm_segments(contactId);
CREATE INDEX idx_crm_segments_segment ON crm_segments(segment);
```

**Run migration:**
```bash
npx drizzle-kit push:sqlite
```

---

## Phase 3: API Endpoints (CRM Routes)

### Create File: `src/app/api/crm/contacts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { crmContacts } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET all contacts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'owner' | 'guest'
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    let query = db.select().from(crmContacts);
    
    if (type) query = query.where(eq(crmContacts.type, type));
    if (status) query = query.where(eq(crmContacts.status, status));
    
    const contacts = await query;
    
    if (search) {
      return NextResponse.json(
        contacts.filter(c => 
          c.email.includes(search) || 
          c.firstName?.includes(search) ||
          c.lastName?.includes(search)
        )
      );
    }
    
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST create new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const contact = {
      id: crypto.randomUUID(),
      type: body.type, // 'owner' | 'guest'
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      postcode: body.postcode,
      country: body.country,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: body.userId,
      notes: body.notes,
    };
    
    await db.insert(crmContacts).values(contact);
    
    // Log activity
    await logCRMActivity('contact', contact.id, 'created', body);
    
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
```

### Create File: `src/app/api/crm/properties/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { crmProperties } from '@/db/schema';

// GET properties with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const status = searchParams.get('status');
    
    let query = db.select().from(crmProperties);
    
    if (ownerId) {
      query = query.where(eq(crmProperties.ownerId, ownerId));
    }
    if (status) {
      query = query.where(eq(crmProperties.listingStatus, status));
    }
    
    const properties = await query;
    return NextResponse.json(properties);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

// POST create property in CRM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const property = {
      id: crypto.randomUUID(),
      ownerId: body.ownerId,
      propertyId: body.propertyId,
      title: body.title,
      location: body.location,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      maxGuests: body.maxGuests,
      pricePerNight: body.pricePerNight,
      listingStatus: 'draft',
      membershipTier: body.membershipTier,
      viewCount: 0,
      enquiryCount: 0,
      bookingCount: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(crmProperties).values(property);
    await logCRMActivity('property', property.id, 'created', body);
    
    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
```

### Create File: `src/app/api/crm/enquiries/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { crmEnquiries } from '@/db/schema';

// GET enquiries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    
    let query = db.select().from(crmEnquiries);
    
    if (status) query = query.where(eq(crmEnquiries.status, status));
    if (ownerId) query = query.where(eq(crmEnquiries.ownerId, ownerId));
    
    const enquiries = await query.orderBy(desc(crmEnquiries.createdAt));
    return NextResponse.json(enquiries);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 });
  }
}

// POST create enquiry in CRM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const enquiry = {
      id: crypto.randomUUID(),
      contactId: body.contactId,
      ownerId: body.ownerId,
      propertyId: body.propertyId,
      status: 'new',
      eventType: body.eventType,
      eventDate: body.eventDate,
      estimatedGuests: body.estimatedGuests,
      estimatedBudget: body.estimatedBudget,
      message: body.message,
      guestEmail: body.guestEmail,
      guestPhone: body.guestPhone,
      guestName: body.guestName,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      priority: 'medium',
      source: body.source || 'form',
    };
    
    await db.insert(crmEnquiries).values(enquiry);
    
    // Log interaction
    await logInteraction({
      contactId: body.contactId,
      relatedEnquiryId: enquiry.id,
      type: 'note',
      content: `New enquiry created for property: ${body.propertyId}`,
      direction: 'inbound',
      initiatedBy: 'system',
    });
    
    await logCRMActivity('enquiry', enquiry.id, 'created', body);
    
    // Increment enquiry count on property
    await db
      .update(crmProperties)
      .set({ 
        enquiryCount: sql`enquiryCount + 1`,
        lastUpdatedAt: new Date().toISOString()
      })
      .where(eq(crmProperties.id, body.propertyId));
    
    return NextResponse.json(enquiry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create enquiry' }, { status: 500 });
  }
}
```

### Create File: `src/app/api/crm/memberships/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { crmMemberships } from '@/db/schema';

// GET memberships
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const status = searchParams.get('status');
    
    let query = db.select().from(crmMemberships);
    
    if (contactId) query = query.where(eq(crmMemberships.contactId, contactId));
    if (status) query = query.where(eq(crmMemberships.status, status));
    
    const memberships = await query;
    return NextResponse.json(memberships);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
  }
}

// POST create membership in CRM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const membership = {
      id: crypto.randomUUID(),
      contactId: body.contactId,
      planTier: body.planTier, // bronze | silver | gold
      planPrice: body.planPrice,
      billingCycle: body.billingCycle, // annual | monthly
      startDate: new Date().toISOString(),
      endDate: calculateEndDate(body.billingCycle), // 1 year later
      renewalDate: calculateEndDate(body.billingCycle),
      status: 'active',
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stripeCustomerId: body.stripeCustomerId,
      stripeSubscriptionId: body.stripeSubscriptionId,
      lastPaymentDate: new Date().toISOString(),
      lastPaymentAmount: body.planPrice,
      nextPaymentDate: calculateEndDate(body.billingCycle),
    };
    
    await db.insert(crmMemberships).values(membership);
    await logCRMActivity('membership', membership.id, 'created', body);
    
    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
  }
}
```

---

## Phase 4: Sync Engine (Auto-Sync Logic)

### Create File: `src/lib/crm-sync.ts`

```typescript
import { db } from '@/db/client';
import { 
  crmContacts, 
  crmProperties, 
  crmEnquiries, 
  crmMemberships,
  crmInteractions,
  crmActivityLog 
} from '@/db/schema';

/**
 * Sync owner data to CRM when user signs up
 */
export async function syncOwnerToCRM(userId: string, userData: any) {
  try {
    const contact = {
      id: crypto.randomUUID(),
      type: 'owner',
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      businessName: userData.businessName,
      taxId: userData.taxId,
      address: userData.address,
      city: userData.city,
      postcode: userData.postcode,
      country: userData.country,
      status: 'active',
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(crmContacts).values(contact);
    
    // Log activity
    await logActivity({
      entityType: 'contact',
      entityId: contact.id,
      action: 'created',
      performedBy: 'system',
      reason: 'Owner signup',
    });
    
    console.log(`✅ Owner synced to CRM: ${userData.email}`);
    return contact;
  } catch (error) {
    console.error(`❌ Failed to sync owner to CRM: ${error}`);
    throw error;
  }
}

/**
 * Sync property to CRM when owner creates property
 */
export async function syncPropertyToCRM(propertyData: any, ownerId: string) {
  try {
    const crmProperty = {
      id: crypto.randomUUID(),
      ownerId: ownerId,
      propertyId: propertyData.id,
      title: propertyData.title,
      location: propertyData.location,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      maxGuests: propertyData.maxGuests,
      pricePerNight: propertyData.pricePerNight,
      listingStatus: 'draft',
      membershipTier: propertyData.planTier,
      viewCount: 0,
      enquiryCount: 0,
      bookingCount: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(crmProperties).values(crmProperty);
    
    await logActivity({
      entityType: 'property',
      entityId: crmProperty.id,
      action: 'created',
      performedBy: 'system',
      reason: 'Property created',
    });
    
    console.log(`✅ Property synced to CRM: ${propertyData.title}`);
    return crmProperty;
  } catch (error) {
    console.error(`❌ Failed to sync property to CRM: ${error}`);
    throw error;
  }
}

/**
 * Sync enquiry to CRM when guest submits form
 */
export async function syncEnquiryToCRM(enquiryData: any) {
  try {
    // Get or create guest contact
    let guestContact = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.email, enquiryData.guestEmail))
      .limit(1);
    
    let contactId = guestContact?.[0]?.id;
    
    if (!contactId) {
      // Create new guest contact
      contactId = crypto.randomUUID();
      await db.insert(crmContacts).values({
        id: contactId,
        type: 'guest',
        firstName: enquiryData.guestName?.split(' ')[0],
        lastName: enquiryData.guestName?.split(' ')[1],
        email: enquiryData.guestEmail,
        phone: enquiryData.guestPhone,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Create enquiry record
    const enquiry = {
      id: crypto.randomUUID(),
      contactId: contactId,
      ownerId: enquiryData.ownerId,
      propertyId: enquiryData.propertyId,
      status: 'new',
      eventType: enquiryData.eventType,
      eventDate: enquiryData.eventDate,
      estimatedGuests: enquiryData.estimatedGuests,
      estimatedBudget: enquiryData.estimatedBudget,
      message: enquiryData.message,
      guestEmail: enquiryData.guestEmail,
      guestPhone: enquiryData.guestPhone,
      guestName: enquiryData.guestName,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      priority: 'medium',
      source: 'form',
    };
    
    await db.insert(crmEnquiries).values(enquiry);
    
    // Log interaction
    await logInteraction({
      contactId: contactId,
      relatedEnquiryId: enquiry.id,
      type: 'message',
      content: enquiryData.message,
      direction: 'inbound',
      initiatedBy: 'contact',
    });
    
    await logActivity({
      entityType: 'enquiry',
      entityId: enquiry.id,
      action: 'created',
      performedBy: 'system',
      reason: 'Enquiry form submission',
    });
    
    console.log(`✅ Enquiry synced to CRM: ${enquiry.id}`);
    return enquiry;
  } catch (error) {
    console.error(`❌ Failed to sync enquiry to CRM: ${error}`);
    throw error;
  }
}

/**
 * Sync membership to CRM when payment successful
 */
export async function syncMembershipToCRM(contactId: string, membershipData: any) {
  try {
    const membership = {
      id: crypto.randomUUID(),
      contactId: contactId,
      planTier: membershipData.planTier,
      planPrice: membershipData.planPrice,
      billingCycle: membershipData.billingCycle,
      startDate: new Date().toISOString(),
      endDate: addMonths(new Date(), 12).toISOString(),
      renewalDate: addMonths(new Date(), 12).toISOString(),
      status: 'active',
      autoRenew: true,
      stripeCustomerId: membershipData.stripeCustomerId,
      stripeSubscriptionId: membershipData.stripeSubscriptionId,
      lastPaymentDate: new Date().toISOString(),
      lastPaymentAmount: membershipData.planPrice,
      nextPaymentDate: addMonths(new Date(), 12).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(crmMemberships).values(membership);
    
    // Log interaction
    await logInteraction({
      contactId: contactId,
      type: 'status_change',
      content: `Membership activated: ${membershipData.planTier}`,
      direction: 'outbound',
      initiatedBy: 'system',
    });
    
    await logActivity({
      entityType: 'membership',
      entityId: membership.id,
      action: 'created',
      performedBy: 'system',
      reason: 'Membership purchase',
    });
    
    console.log(`✅ Membership synced to CRM: ${membership.id}`);
    return membership;
  } catch (error) {
    console.error(`❌ Failed to sync membership to CRM: ${error}`);
    throw error;
  }
}

/**
 * Update enquiry status in CRM
 */
export async function updateEnquiryStatusInCRM(enquiryId: string, newStatus: string, notes?: string) {
  try {
    await db
      .update(crmEnquiries)
      .set({
        status: newStatus,
        lastUpdatedAt: new Date().toISOString(),
        ...(newStatus === 'booked' && { convertedToBooking: true }),
        ...(notes && { internalNotes: notes }),
      })
      .where(eq(crmEnquiries.id, enquiryId));
    
    // Get enquiry to find contact
    const enquiry = await db.select().from(crmEnquiries).where(eq(crmEnquiries.id, enquiryId)).limit(1);
    
    if (enquiry?.[0]) {
      await logInteraction({
        contactId: enquiry[0].contactId,
        relatedEnquiryId: enquiryId,
        type: 'status_change',
        content: `Status changed to: ${newStatus}`,
        direction: 'outbound',
        initiatedBy: 'system',
      });
    }
    
    console.log(`✅ Enquiry status updated in CRM: ${enquiryId} → ${newStatus}`);
  } catch (error) {
    console.error(`❌ Failed to update enquiry status in CRM: ${error}`);
    throw error;
  }
}

/**
 * Log CRM activity
 */
async function logActivity(data: any) {
  try {
    await db.insert(crmActivityLog).values({
      id: crypto.randomUUID(),
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      performedBy: data.performedBy,
      timestamp: new Date().toISOString(),
      reason: data.reason,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

/**
 * Log interaction
 */
async function logInteraction(data: any) {
  try {
    await db.insert(crmInteractions).values({
      id: crypto.randomUUID(),
      contactId: data.contactId,
      relatedEnquiryId: data.relatedEnquiryId,
      type: data.type,
      content: data.content,
      direction: data.direction,
      initiatedBy: data.initiatedBy,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log interaction:', error);
  }
}

// Helper functions
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
```

---

## Phase 5: Integration Points (Hook into Existing Features)

### 1. Owner Signup Integration

**File:** `src/app/(auth)/owner-sign-up/page.tsx`

After successful signup, add:

```typescript
import { syncOwnerToCRM } from '@/lib/crm-sync';

// Inside signup handler:
export async function handleSignup(userData) {
  // ... existing signup code ...
  
  // Sync to CRM
  try {
    await syncOwnerToCRM(newUser.id, userData);
  } catch (error) {
    console.error('CRM sync failed (non-blocking):', error);
    // Don't fail signup if CRM fails
  }
  
  // ... rest of signup ...
}
```

### 2. Property Creation Integration

**File:** `src/app/owner-dashboard/page.tsx` or `src/components/OwnerPropertyForm.tsx`

After property creation, add:

```typescript
import { syncPropertyToCRM } from '@/lib/crm-sync';

// Inside property creation handler:
export async function handlePropertySubmit(propertyData) {
  // ... create property in main database ...
  
  // Get owner's CRM contact
  const ownerContact = await db
    .select()
    .from(crmContacts)
    .where(eq(crmContacts.userId, currentUserId))
    .limit(1);
  
  // Sync to CRM
  if (ownerContact?.[0]) {
    try {
      await syncPropertyToCRM(propertyData, ownerContact[0].id);
    } catch (error) {
      console.error('CRM sync failed:', error);
    }
  }
}
```

### 3. Enquiry Submission Integration

**File:** `src/app/api/enquiry/route.ts`

After enquiry creation, add:

```typescript
import { syncEnquiryToCRM } from '@/lib/crm-sync';

export async function POST(request: NextRequest) {
  // ... create enquiry in main database ...
  
  // Get CRM property and owner
  const crmProperty = await db
    .select()
    .from(crmProperties)
    .where(eq(crmProperties.propertyId, enquiry.propertyId))
    .limit(1);
  
  // Sync to CRM
  if (crmProperty?.[0]) {
    try {
      await syncEnquiryToCRM({
        ...enquiry,
        propertyId: crmProperty[0].id,
        ownerId: crmProperty[0].ownerId,
      });
    } catch (error) {
      console.error('CRM sync failed:', error);
    }
  }
  
  // ... rest of enquiry handling ...
}
```

### 4. Payment Success Integration

**File:** `src/app/api/webhooks/stripe.ts`

After payment success, add:

```typescript
import { syncMembershipToCRM } from '@/lib/crm-sync';

// Inside checkout.session.completed handler:
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  
  // ... existing payment handling ...
  
  // Get user's CRM contact
  const crmContact = await db
    .select()
    .from(crmContacts)
    .where(eq(crmContacts.userId, user.id))
    .limit(1);
  
  // Sync membership to CRM
  if (crmContact?.[0]) {
    try {
      await syncMembershipToCRM(crmContact[0].id, {
        planTier: session.metadata.planTier,
        planPrice: session.amount_total / 100,
        billingCycle: 'annual',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
      });
    } catch (error) {
      console.error('CRM sync failed:', error);
    }
  }
}
```

---

## Phase 6: Admin CRM Dashboard

### Create File: `src/app/admin/crm/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CRMDashboard() {
  const [contacts, setContacts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCRMData();
  }, []);

  async function fetchCRMData() {
    try {
      const [contactsRes, propertiesRes, enquiriesRes] = await Promise.all([
        fetch('/api/crm/contacts'),
        fetch('/api/crm/properties'),
        fetch('/api/crm/enquiries'),
      ]);

      setContacts(await contactsRes.json());
      setProperties(await propertiesRes.json());
      setEnquiries(await enquiriesRes.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">CRM Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{contacts.length}</div>
            <p className="text-sm text-gray-600">Total Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{properties.length}</div>
            <p className="text-sm text-gray-600">Properties</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{enquiries.length}</div>
            <p className="text-sm text-gray-600">Enquiries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">
              {enquiries.filter(e => e.status === 'booked').length}
            </div>
            <p className="text-sm text-gray-600">Conversions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <CRMContactsList contacts={contacts} />
        </TabsContent>

        <TabsContent value="properties">
          <CRMPropertiesList properties={properties} />
        </TabsContent>

        <TabsContent value="enquiries">
          <CRMEnquiriesList enquiries={enquiries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component implementations for each tab...
```

---

## Phase 7: Reports & Analytics

### Create File: `src/lib/crm-reports.ts`

```typescript
/**
 * Generate CRM Reports
 */

export async function generateOwnerInsights(ownerId: string) {
  const [contact, properties, enquiries, membership] = await Promise.all([
    getContact(ownerId),
    getProperties(ownerId),
    getEnquiries(ownerId),
    getMembership(ownerId),
  ]);

  return {
    owner: contact,
    propertyCount: properties.length,
    activeProperties: properties.filter(p => p.listingStatus === 'live').length,
    enquiriesTotal: enquiries.length,
    enquiriesNew: enquiries.filter(e => e.status === 'new').length,
    enquiriesConverted: enquiries.filter(e => e.status === 'booked').length,
    conversionRate: (enquiries.filter(e => e.status === 'booked').length / enquiries.length * 100).toFixed(2),
    totalRevenue: properties.reduce((sum, p) => sum + (p.totalRevenue || 0), 0),
    membership: membership,
  };
}

export async function generatePropertyAnalytics(propertyId: string) {
  // Returns views, enquiries, bookings, revenue for a property
}

export async function generateEnquiryMetrics() {
  // Returns enquiry funnel: new → contacted → negotiating → booked
}
```

---

## Phase 8: Scheduled Tasks (Cron Jobs)

### Create File: `src/lib/cron-jobs.ts`

```typescript
/**
 * Scheduled CRM maintenance tasks
 */

// Run daily at midnight
export async function dailyCRMJobs() {
  console.log('Running daily CRM jobs...');
  
  // Update membership statuses
  await updateExpiringMemberships();
  
  // Segment customers
  await updateCustomerSegments();
  
  // Send renewal reminders
  await sendRenewalReminders();
  
  console.log('✅ Daily CRM jobs completed');
}

async function updateExpiringMemberships() {
  // Find memberships expiring in 30 days and mark as 'expiring_soon'
}

async function updateCustomerSegments() {
  // Calculate engagement scores and segment owners
  // high_value, churning, at_risk, premium, inactive
}

async function sendRenewalReminders() {
  // Send email to owners with expiring memberships
}
```

---

## Implementation Checklist

### Phase 1: Database ✅
- [ ] Run migration: `npx drizzle-kit push:sqlite`
- [ ] Verify all 7 tables created in SQLite

### Phase 2: API Routes 🔲
- [ ] Create `/api/crm/contacts` routes
- [ ] Create `/api/crm/properties` routes
- [ ] Create `/api/crm/enquiries` routes
- [ ] Create `/api/crm/memberships` routes
- [ ] Test all endpoints with Postman

### Phase 3: Sync Engine 🔲
- [ ] Create `src/lib/crm-sync.ts` with all sync functions
- [ ] Hook owner signup to CRM
- [ ] Hook property creation to CRM
- [ ] Hook enquiry submission to CRM
- [ ] Hook payment success to CRM

### Phase 4: Admin Dashboard 🔲
- [ ] Create CRM dashboard at `/admin/crm`
- [ ] Add contacts list view
- [ ] Add properties list view
- [ ] Add enquiries list view
- [ ] Add analytics cards

### Phase 5: Reports 🔲
- [ ] Create report generation functions
- [ ] Add owner insights endpoint
- [ ] Add property analytics endpoint
- [ ] Add enquiry funnel metrics

### Phase 6: Testing 🔲
- [ ] Test owner signup → CRM sync
- [ ] Test property creation → CRM sync
- [ ] Test enquiry submission → CRM sync
- [ ] Test payment success → CRM sync
- [ ] Test all dashboard views

### Phase 7: Deployment 🔲
- [ ] Deploy to production
- [ ] Monitor sync performance
- [ ] Gather owner feedback
- [ ] Iterate based on feedback

---

## Testing Checklist

```bash
# Test 1: Owner Signup Sync
POST /api/owner-sign-up
Check: crm_contacts table has new entry

# Test 2: Property Creation Sync
POST /api/properties
Check: crm_properties table has new entry

# Test 3: Enquiry Submission Sync
POST /api/enquiry
Check: crm_enquiries and crm_contacts tables updated

# Test 4: Payment Success Sync
POST /api/webhooks/stripe
Check: crm_memberships table has new entry

# Test 5: Admin CRM Dashboard
GET /admin/crm
Check: All stats load correctly
```

---

## Benefits of Custom CRM

| Feature | Benefit |
|---------|---------|
| **No licensing costs** | Save £100s/month vs TreadSoft |
| **Full control** | Customize any feature without vendor limits |
| **Integrated data** | Single database, no sync delays |
| **Faster performance** | Direct queries, no API calls to external service |
| **Better privacy** | All data stays in your system |
| **Infinite scalability** | No vendor limits on records/contacts |
| **Custom reporting** | Build exactly what business needs |
| **Competitive advantage** | Build CRM that perfectly fits your platform |

---

## Post-Launch Enhancements

### Phase 2 Improvements (After Launch)
- [ ] Advanced search and filtering
- [ ] Bulk actions (export, assign, update status)
- [ ] Email templates and campaigns
- [ ] SMS notifications
- [ ] Webhook API for external integrations
- [ ] Mobile CRM app
- [ ] AI-powered lead scoring
- [ ] Predictive analytics

### Phase 3 Enhancements
- [ ] Multi-user collaboration
- [ ] Custom fields
- [ ] Workflow automation
- [ ] Custom reports builder
- [ ] Data import/export

---

## Conclusion

By building a custom CRM instead of using TreadSoft, you:
- **Save thousands** on licensing costs
- **Keep full control** of customer data
- **Deliver better UX** with integrated experience
- **Build competitive moat** with proprietary system
- **Scale infinitely** without vendor constraints

This custom CRM becomes a **valuable asset** that differentiates your platform from competitors.

---

**Status:** Ready for Implementation  
**Estimated Timeline:** 3-5 days  
**Priority:** High (Blocks Phase 3 completion)  
**Next Step:** Begin Phase 1 (Database migration)
