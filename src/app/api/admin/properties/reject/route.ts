/**
 * POST /api/admin/properties/reject
 * 
 * Reject a property with reason
 * Only admin users can reject properties
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { properties, adminActivityLog } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, sql } from 'drizzle-orm';

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
    const { propertyId, reason } = body as { propertyId: number; reason: string };

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Fetch property using raw SQL to avoid JSON parsing errors
    const propertyResult = await db.run(sql`
      SELECT id, status FROM properties WHERE id = ${propertyId} LIMIT 1
    `);

    if (!propertyResult.rows || propertyResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const prop = propertyResult.rows[0] as any;

    if (prop.status !== 'pending_approval') {
      return NextResponse.json(
        { success: false, error: 'Can only reject properties that are pending approval' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Reject property
    await db
      .update(properties)
      .set({
        status: 'rejected',
        isPublished: false,
        rejectionReason: reason,
        updatedAt: now,
      })
      .where(eq(properties.id, propertyId));

    // Log admin activity
    await db.insert(adminActivityLog).values({
      adminId: session.user.id,
      action: 'reject_property',
      entityType: 'property',
      entityId: propertyId.toString(),
      details: JSON.stringify({
        propertyTitle: prop.title,
        propertySlug: prop.slug,
        rejectionReason: reason,
      }),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      createdAt: now,
    });

    // TODO: Send email notification to owner
    // "Your property was rejected: [reason]"

    return NextResponse.json({
      success: true,
      message: 'Property rejected',
      property: {
        id: propertyId,
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: now,
      },
    });
  } catch (error) {
    console.error('Error rejecting property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject property' },
      { status: 500 }
    );
  }
}
