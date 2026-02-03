// Quick check-crm-enquiries.mjs - Verify enquiry table structure and sample data
import Database from 'better-sqlite3';

const db = new Database('./.data/db.sqlite');

try {
  console.log('📋 CRM Enquiries Table Verification\n');
  
  // Check table structure
  console.log('Table structure:');
  const schema = db.prepare(`PRAGMA table_info(crm_enquiries)`).all();
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });
  
  // Check record count
  console.log('\nRecord count:');
  const count = db.prepare(`SELECT COUNT(*) as cnt FROM crm_enquiries`).get();
  console.log(`  Total enquiries: ${count.cnt}`);
  
  // Show recent enquiries
  console.log('\nRecent enquiries:');
  const recent = db.prepare(`
    SELECT id, guest_name, guest_email, guest_phone, subject, status, created_at
    FROM crm_enquiries 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();
  
  if (recent.length === 0) {
    console.log('  (No enquiries yet)');
  } else {
    recent.forEach(e => {
      console.log(`  ID: ${e.id}, Guest: ${e.guest_name}, Email: ${e.guest_email}, Status: ${e.status}`);
    });
  }
  
  console.log('\n✅ Table is accessible and properly structured');
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}
