import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { planPurchases } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log('[Unused Plan API] Session user:', session?.user?.id);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find unused plan purchases for this user (most recent first)
    const unusedPurchases = await db
      .select()
      .from(planPurchases)
      .where(
        and(
          eq(planPurchases.userId, session.user.id),
          eq(planPurchases.used, 0)
        )
      )
      .orderBy(desc(planPurchases.purchasedAt))
      .limit(1);

    console.log('[Unused Plan API] Query results:', unusedPurchases);

    if (unusedPurchases.length === 0) {
      console.log('[Unused Plan API] No unused plans found');
      return NextResponse.json({ hasUnusedPlan: false, purchase: null });
    }

    const purchase = unusedPurchases[0];
    console.log('[Unused Plan API] Found purchase:', purchase);

    // Check if the plan has expired
    const now = new Date();
    const expiresAt = new Date(purchase.expiresAt);

    console.log('[Unused Plan API] Checking expiry - Now:', now, 'ExpiresAt:', expiresAt);

    if (expiresAt < now) {
      console.log('[Unused Plan API] Plan expired');
      return NextResponse.json({ hasUnusedPlan: false, purchase: null, expired: true });
    }

    const response = {
      hasUnusedPlan: true,
      purchase: {
        id: purchase.id,
        planId: purchase.planId,
        purchasedAt: purchase.purchasedAt,
        expiresAt: purchase.expiresAt,
        amount: purchase.amount,
      },
    };
    
    console.log('[Unused Plan API] Returning response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Unused Plan API] Error checking unused plans:', error);
    return NextResponse.json(
      { error: 'Failed to check unused plans' },
      { status: 500 }
    );
  }
}
