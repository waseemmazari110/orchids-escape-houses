import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { properties } from '../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Check if property belongs to user and has paid plan
    const property = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.id, parseInt(propertyId)),
          eq(properties.ownerId, session.user.id)
        )
      )
      .limit(1);

    if (!property.length) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const prop = property[0];

    // Check if plan is paid
    if (prop.paymentStatus !== 'paid') {
      return NextResponse.json(
        { error: 'Please purchase a plan for this property first' },
        { status: 400 }
      );
    }

    // Update property status to pending_approval
    await db
      .update(properties)
      .set({
        status: 'pending_approval',
        isPublished: true as any,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(properties.id, parseInt(propertyId)));

    return NextResponse.json({
      success: true,
      message: 'Property submitted for approval',
    });
  } catch (error) {
    console.error('Submit property error:', error);
    return NextResponse.json(
      { error: 'Failed to submit property' },
      { status: 500 }
    );
  }
}
