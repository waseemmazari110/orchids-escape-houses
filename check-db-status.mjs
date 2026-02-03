import * as fs from 'fs';
import * as path from 'path';

// Check database structure
console.log('📊 Database Inspection\n');
console.log('Available SQLite files:');
const dbPath = path.join(process.cwd(), '.data');
if (fs.existsSync(dbPath)) {
  const files = fs.readdirSync(dbPath);
  files.forEach(f => console.log('  -', f));
} else {
  console.log('  .data directory not found');
}

console.log('\nTo verify enquiry sync is working, we can:');
console.log('1. Check the server console for "✅ Enquiry synced to CRM" message');
console.log('2. Query the database with: SELECT COUNT(*) FROM crm_enquiries;');
console.log('3. Test with curl using the integration-test@example.com email');
