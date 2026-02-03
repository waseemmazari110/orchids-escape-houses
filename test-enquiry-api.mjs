#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

// Use a simple curl-based test instead
console.log('Testing enquiry submission via API...\n');

const payload = {
  name: 'Integration Test Guest',
  email: 'integration-test@example.com',
  phone: '9876543210',
  message: 'This is an integration test enquiry for CRM sync verification',
  propertyTitle: 'Test Property',
  propertySlug: 'test-property',
  timestamp: Date.now(),
  checkin: '2024-02-01',
  checkout: '2024-02-05',
  groupSize: 5,
  occasion: 'Corporate Retreat',
  budget: 5000
};

console.log('📤 Payload to send:');
console.log(JSON.stringify(payload, null, 2));

// Write to a temp file for curl to use
fs.writeFileSync('/tmp/enquiry-payload.json', JSON.stringify(payload));

console.log('\n💡 To test enquiry sync, run:');
console.log('curl -X POST http://localhost:3000/api/enquiry \\');
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -d '${JSON.stringify(payload)}'`);
