#!/bin/bash
# Test Data Setup Script for iCal Calendar Feature

echo "🧪 Setting up test data for iCal Calendar Feature..."
echo ""

# Create test bookings for Brighton Seafront Villa
echo "📅 Adding test bookings for Brighton Seafront Villa..."

# Booking 1: Feb 1-5, 2026
sqlite3 /path/to/database.db <<EOF
INSERT INTO bookings (
  property_name,
  guest_name,
  guest_email,
  guest_phone,
  check_in_date,
  check_out_date,
  number_of_guests,
  booking_status,
  created_at,
  updated_at
) VALUES (
  'Brighton Seafront Villa',
  'John Smith',
  'john@example.com',
  '01273 569301',
  '2026-02-01',
  '2026-02-05',
  4,
  'confirmed',
  datetime('now'),
  datetime('now')
);
EOF

# Booking 2: Feb 10-15, 2026
sqlite3 /path/to/database.db <<EOF
INSERT INTO bookings (
  property_name,
  guest_name,
  guest_email,
  guest_phone,
  check_in_date,
  check_out_date,
  number_of_guests,
  booking_status,
  created_at,
  updated_at
) VALUES (
  'Brighton Seafront Villa',
  'Jane Doe',
  'jane@example.com',
  '01273 569302',
  '2026-02-10',
  '2026-02-15',
  6,
  'confirmed',
  datetime('now'),
  datetime('now')
);
EOF

echo "✅ Test bookings added!"
echo ""
echo "📍 Now when you open the booking modal for Brighton Seafront Villa:"
echo "   - Feb 1-5 should be grayed out"
echo "   - Feb 10-15 should be grayed out"
echo "   - All other dates should be available (white)"
echo ""
echo "🔄 Don't forget to refresh your browser (Ctrl+Shift+R)!"
