-- Migration: Add saved properties table
-- Date: 2026-02-01
-- Description: Create saved_properties table for users to save properties they're interested in

-- Create saved_properties table
CREATE TABLE IF NOT EXISTS saved_properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  property_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE(user_id, property_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);
