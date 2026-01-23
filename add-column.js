const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

try {
  console.log('Adding rejection_reason column to properties table...');
  
  // Check if column exists
  const tableInfo = db.pragma('table_info(properties)');
  const hasColumn = tableInfo.some(col => col.name === 'rejection_reason');
  
  if (hasColumn) {
    console.log('✅ Column already exists!');
  } else {
    db.exec('ALTER TABLE properties ADD COLUMN rejection_reason TEXT');
    console.log('✅ Column added successfully!');
  }
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}
