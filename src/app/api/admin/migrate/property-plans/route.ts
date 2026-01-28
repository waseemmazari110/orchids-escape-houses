import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * Admin endpoint to run property plan migration
 * POST /api/admin/migrate/property-plans
 * 
 * Only accessible by admin users
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const results = [];
    const errors = [];

    // Try to add each column, catching errors if they already exist
    const columns = [
      { name: 'plan_id', sql: sql`ALTER TABLE properties ADD COLUMN plan_id TEXT` },
      { name: 'payment_status', sql: sql`ALTER TABLE properties ADD COLUMN payment_status TEXT DEFAULT 'pending'` },
      { name: 'stripe_payment_intent_id', sql: sql`ALTER TABLE properties ADD COLUMN stripe_payment_intent_id TEXT` },
      { name: 'plan_purchased_at', sql: sql`ALTER TABLE properties ADD COLUMN plan_purchased_at TEXT` },
      { name: 'plan_expires_at', sql: sql`ALTER TABLE properties ADD COLUMN plan_expires_at TEXT` },
    ];

    for (const column of columns) {
      try {
        await db.run(column.sql);
        results.push(`✅ Added column: ${column.name}`);
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate column')) {
          results.push(`ℹ️  Column already exists: ${column.name}`);
        } else {
          errors.push(`❌ Failed to add ${column.name}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length === 0 
        ? 'Migration completed successfully!' 
        : 'Migration completed with some errors',
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}
