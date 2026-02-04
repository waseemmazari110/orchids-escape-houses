-- Drop and recreate crm_enquiries table with correct schema
DROP TABLE IF EXISTS crm_enquiries;

CREATE TABLE IF NOT EXISTS crm_enquiries (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  property_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  message TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  guest_name TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES crm_contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES crm_properties(id) ON DELETE CASCADE
);
