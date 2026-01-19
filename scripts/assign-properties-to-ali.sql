-- Assign first 3 properties to ali (the property owner user)
UPDATE properties
SET owner_id = (SELECT id FROM user WHERE email = 'ali@example.com' LIMIT 1)
WHERE id IN (1, 2, 3);

-- Verify the update
SELECT id, title, owner_id FROM properties WHERE id IN (1, 2, 3);
