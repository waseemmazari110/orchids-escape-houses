import Database from 'better-sqlite3';

const db = new Database('./database.db');

// Check properties table
console.log('=== PROPERTIES ===');
const properties = db.prepare('SELECT id, title, ownerId, isPublished, status FROM properties').all();
console.table(properties);

// Check all columns in properties
console.log('\n=== DATABASE SCHEMA ===');
const schema = db.prepare("PRAGMA table_info(properties)").all();
console.table(schema);

db.close();
