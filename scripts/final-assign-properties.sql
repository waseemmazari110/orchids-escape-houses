-- Get ali's user ID
SELECT id as ali_id FROM user WHERE email = 'ali@example.com';

-- Get first 5 published properties
SELECT id, title FROM properties WHERE is_published = 1 LIMIT 5;

-- Assign them to ali
UPDATE properties 
SET owner_id = (SELECT id FROM user WHERE email = 'ali@example.com' LIMIT 1)
WHERE id IN (
  SELECT id FROM (
    SELECT id FROM properties WHERE is_published = 1 LIMIT 5
  )
);

-- Verify
SELECT COUNT(*) as assigned_count FROM properties WHERE owner_id = (SELECT id FROM user WHERE email = 'ali@example.com' LIMIT 1);
