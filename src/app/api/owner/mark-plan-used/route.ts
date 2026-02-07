import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { planPurchases } from '@/db/schema';
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
    const { purchaseId, propertyId } = body;

    if (!purchaseId || !propertyId) {
      return NextResponse.json(
        { error: 'Purchase ID and Property ID are required' },
        { status: 400 }
      );
    }

    // Mark the plan purchase as used
    const now = new Date().toISOString();
    await db
      .update(planPurchases)
      .set({
        used: 1,
        propertyId,
        usedAt: now,
      })
      .where(
        and(
          eq(planPurchases.id, purchaseId),
          eq(planPurchases.userId, session.user.id),
          eq(planPurchases.used, 0)
        )
      );

    console.log(`✅ Plan purchase ${purchaseId} marked as used for property ${propertyId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking plan as used:', error);
    return NextResponse.json(
      { error: 'Failed to mark plan as used' },
      { status: 500 }
    );
  }
}
