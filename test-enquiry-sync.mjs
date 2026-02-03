import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('.data/db.sqlite');

// First, verify the crm_enquiries table structure
console.log('📋 crm_enquiries table structure:');
const info = db.pragma('table_info(crm_enquiries)', { simple: true });
console.log(info);

// Get the first owner from crm_contacts
const owner = db.prepare('SELECT id FROM crm_contacts WHERE type = ? LIMIT 1').get('owner');
console.log('\n👤 Sample owner ID:', owner?.id);

// Get first property ID to use
const property = db.prepare('SELECT id, property_id FROM crm_properties LIMIT 1').get();
console.log('🏠 Sample property ID:', property?.property_id);

// Insert a test enquiry
try {
  const ownerId = owner?.id;
  const propertyId = property?.property_id;
  
  const insertStmt = db.prepare(`
    INSERT INTO crm_enquiries (
      owner_id,
      property_id,
      guest_name,
      guest_email,
      guest_phone,
      subject,
      message,
      enquiry_type,
      status,
      priority,
      source,
      check_in_date,
      check_out_date,
      number_of_guests,
      budget,
      notes,
      assigned_to,
      follow_up_date,
      created_at,
      updated_at,
      closed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    ownerId,
    propertyId,
    'Test Guest',
    'testguest@example.com',
    '1234567890',
    'Test Enquiry Subject',
    'This is a test enquiry message',
    'Family Gathering',
    'new',
    'medium',
    'form',
    '2024-01-15',
    '2024-01-20',
    4,
    1000,
    null,
    null,
    null,
    new Date().toISOString(),
    new Date().toISOString(),
    null
  );

  console.log('\n✅ Test enquiry inserted successfully!');
  console.log('Last inserted row ID:', result.lastInsertRowid);

  // Verify it was inserted
  const newEnquiry = db.prepare('SELECT * FROM crm_enquiries WHERE id = ?').get(result.lastInsertRowid);
  console.log('\n📝 Inserted enquiry data:');
  console.log(JSON.stringify(newEnquiry, null, 2));
} catch (error) {
  console.error('\n❌ Error inserting enquiry:', error.message);
  console.error('Stack:', error.stack);
}

db.close();
