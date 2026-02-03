-- Safe CRM Migration - Only creates missing tables
-- Keeps existing crm_enquiries, crm_activity_log, crm_owner_profiles, etc.

-- ==================================================================
-- NEW: CRM CONTACTS (Main contact table for owners and guests)
-- ==================================================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('owner', 'guest')),
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT,
  business_name TEXT,
  tax_id TEXT,
  bank_details TEXT,
  company_name TEXT,
  event_type TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'blocked')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_contacted_at TEXT,
  user_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON crm_contacts(type);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_userId ON crm_contacts(user_id);

-- ==================================================================
-- NEW: CRM PROPERTIES (Property tracking linked to contacts)
-- ==================================================================
CREATE TABLE IF NOT EXISTS crm_properties (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  property_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  max_guests INTEGER,
  price_per_night REAL,
  listing_status TEXT CHECK(listing_status IN ('draft', 'pending_approval', 'live', 'paused', 'rejected')),
  membership_tier TEXT CHECK(membership_tier IN ('bronze', 'silver', 'gold')),
  view_count INTEGER NOT NULL DEFAULT 0,
  enquiry_count INTEGER NOT NULL DEFAULT 0,
  booking_count INTEGER NOT NULL DEFAULT 0,
  total_revenue REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  expires_at TEXT,
  internal_notes TEXT,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_properties_ownerId ON crm_properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_properties_propertyId ON crm_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_crm_properties_status ON crm_properties(listing_status);
CREATE INDEX IF NOT EXISTS idx_crm_properties_tier ON crm_properties(membership_tier);

-- ==================================================================
-- NEW: CRM MEMBERSHIPS (Subscription tracking)
-- ==================================================================
CREATE TABLE IF NOT EXISTS crm_memberships (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  plan_tier TEXT NOT NULL,
  plan_price REAL,
  billing_cycle TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  renewal_date TEXT,
  cancelled_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expiring_soon', 'expired', 'cancelled', 'suspended')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  last_payment_date TEXT,
  last_payment_amount REAL,
  next_payment_date TEXT,
  auto_renew INTEGER NOT NULL DEFAULT 1,
  payment_failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_memberships_contactId ON crm_memberships(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_memberships_status ON crm_memberships(status);
CREATE INDEX IF NOT EXISTS idx_crm_memberships_endDate ON crm_memberships(end_date);

-- ==================================================================
-- NEW: CRM INTERACTIONS (Communication log)
-- ==================================================================
CREATE TABLE IF NOT EXISTS crm_interactions (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  related_property_id TEXT,
  related_enquiry_id TEXT,
  type TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  direction TEXT,
  initiated_by TEXT,
  created_at TEXT NOT NULL,
  read_at TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_interactions_contactId ON crm_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_type ON crm_interactions(type);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_createdAt ON crm_interactions(created_at);

-- ==================================================================
-- NEW: CRM SEGMENTS (Customer segmentation)
-- ==================================================================
CREATE TABLE IF NOT EXISTS crm_segments (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  segment TEXT NOT NULL,
  lifetime_value REAL,
  engagement_score INTEGER,
  added_at TEXT NOT NULL,
  removed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_segments_contactId ON crm_segments(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_segments_segment ON crm_segments(segment);

-- NOTE: We are keeping the existing tables:
-- - crm_enquiries (23 activity logs)
-- - crm_activity_log (with existing data)
-- - crm_owner_profiles (1 owner profile)
-- - crm_property_links (empty)
-- - crm_notes (empty)
--
-- These tables have different structures but contain your existing data.
-- The new CRM sync will write to crm_contacts, crm_properties, crm_memberships,
-- crm_interactions, and crm_segments.
