/**
 * POST /api/admin/properties/approve
 * 
 * Approve a property for publication
 * Only admin users can approve properties
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { properties, adminActivityLog } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { canApprove } from '@/lib/membership-utils';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { propertyId } = body as { propertyId: number };

    // Fetch property using raw SQL to avoid JSON parsing errors
    const propertyResult = await db.run(sql`
      SELECT id, title, slug, status, payment_status as paymentStatus, plan_id as planId FROM properties WHERE id = ${propertyId} LIMIT 1
    `);

    if (!propertyResult.rows || propertyResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const prop = propertyResult.rows[0] as any;

    // Validate can approve
    const validation = canApprove(
      prop.status as any,
      prop.paymentStatus as any
    );

    if (!validation.canApprove) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Approve and publish property
    await db
      .update(properties)
      .set({
        status: 'live',
        isPublished: true as any,
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(properties.id, propertyId));

    // Log admin activity - TODO: Create admin_activity_log table
    /*
    await db.insert(adminActivityLog).values({
      adminId: session.user.id,
      action: 'approve_property',
      entityType: 'property',
      entityId: propertyId.toString(),
      details: JSON.stringify({
        propertyTitle: prop.title || 'Unknown',
        propertySlug: prop.slug || 'unknown',
        planId: prop.planId || 'none',
      }),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      createdAt: now,
    });
    */

    // TODO: Send email notification to owner
    // "Your property has been approved and is now live!"

    return NextResponse.json({
      success: true,
      message: 'Property approved and published successfully',
      property: {
        id: propertyId,
        status: 'live',
        approvedAt: now,
      },
    });
  } catch (error) {
    console.error('Error approving property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve property' },
      { status: 500 }
    );
  }
}
