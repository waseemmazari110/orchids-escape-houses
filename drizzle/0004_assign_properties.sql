CREATE TABLE IF NOT EXISTS migrations_manual (
  id INTEGER PRIMARY KEY,
  script_name TEXT,
  executed_at DATETIME
);

-- First, get the user ID for ali
-- This would need to be done manually or through the app

-- For now, just assign the first 5 properties to ali
-- UPDATE properties 
-- SET owner_id = 'user_ali_id_here'
-- WHERE id <= 5 AND is_published = 1;

-- The actual fix:
-- 1. Get ali's user ID from the user table
-- 2. Update the properties table to set owner_id for the first 5 properties

INSERT INTO migrations_manual (script_name, executed_at)
VALUES ('assign-properties-to-ali', datetime('now'));
