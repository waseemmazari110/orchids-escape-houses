-- Custom CRM System Tables Migration
-- Run with: npx drizzle-kit push:sqlite

-- ============================================
-- Part 1: CRM Contacts (Owner/Guest Records)
-- ============================================

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
  user_id TEXT UNIQUE REFERENCES user(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON crm_contacts(type);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_userId ON crm_contacts(user_id);

-- ============================================
-- Part 2: CRM Properties (Property Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS crm_properties (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
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

-- ============================================
-- Part 3: CRM Enquiries (Enquiry Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS crm_enquiries (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES crm_properties(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'negotiating', 'booked', 'lost', 'spam')),
  event_type TEXT,
  event_date TEXT,
  estimated_guests INTEGER,
  estimated_budget REAL,
  message TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_name TEXT,
  created_at TEXT NOT NULL,
  first_response_at TEXT,
  last_updated_at TEXT,
  closed_at TEXT,
  converted_to_booking INTEGER NOT NULL DEFAULT 0,
  booking_value REAL,
  assigned_to_admin_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  internal_notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  source TEXT NOT NULL DEFAULT 'form' CHECK(source IN ('form', 'email', 'phone', 'website'))
);

CREATE INDEX IF NOT EXISTS idx_crm_enquiries_contactId ON crm_enquiries(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_enquiries_ownerId ON crm_enquiries(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_enquiries_propertyId ON crm_enquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_crm_enquiries_status ON crm_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_crm_enquiries_createdAt ON crm_enquiries(created_at);

-- ============================================
-- Part 4: CRM Memberships (Subscription Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS crm_memberships (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK(plan_tier IN ('bronze', 'silver', 'gold')),
  plan_price REAL,
  billing_cycle TEXT CHECK(billing_cycle IN ('annual', 'monthly')),
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

-- ============================================
-- Part 5: CRM Interactions (Activity History)
-- ============================================

CREATE TABLE IF NOT EXISTS crm_interactions (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  related_property_id TEXT REFERENCES crm_properties(id) ON DELETE SET NULL,
  related_enquiry_id TEXT REFERENCES crm_enquiries(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK(type IN ('email', 'phone', 'message', 'note', 'status_change')),
  subject TEXT,
  content TEXT,
  direction TEXT CHECK(direction IN ('inbound', 'outbound', 'internal')),
  initiated_by TEXT CHECK(initiated_by IN ('contact', 'owner', 'admin', 'system')),
  created_at TEXT NOT NULL,
  read_at TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_interactions_contactId ON crm_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_type ON crm_interactions(type);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_createdAt ON crm_interactions(created_at);

-- ============================================
-- Part 6: CRM Activity Log (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS crm_activity_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('contact', 'property', 'enquiry', 'membership')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('created', 'updated', 'deleted', 'status_changed')),
  changed_fields TEXT,
  performed_by TEXT NOT NULL,
  ip_address TEXT,
  timestamp TEXT NOT NULL,
  reason TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_activity_log_entityId ON crm_activity_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_log_entityType ON crm_activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activity_log_timestamp ON crm_activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_crm_activity_log_action ON crm_activity_log(action);

-- ============================================
-- Part 7: CRM Segments (Customer Segmentation)
-- ============================================

CREATE TABLE IF NOT EXISTS crm_segments (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  segment TEXT NOT NULL CHECK(segment IN ('high_value', 'churning', 'at_risk', 'premium', 'inactive')),
  lifetime_value REAL,
  engagement_score INTEGER CHECK(engagement_score >= 0 AND engagement_score <= 100),
  added_at TEXT NOT NULL,
  removed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_segments_contactId ON crm_segments(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_segments_segment ON crm_segments(segment);
