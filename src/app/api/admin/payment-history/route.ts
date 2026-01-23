import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getPaymentHistory } from '@/lib/payment-history';

/**
 * Get Payment History / Audit Trail
 * GET /api/admin/payment-history?paymentId=123
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      );
    }

    const history = await getPaymentHistory(parseInt(paymentId));

    return NextResponse.json({
      success: true,
      paymentId: parseInt(paymentId),
      history: history.map(h => ({
        id: h.id,
        eventType: h.eventType,
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        amount: h.amount,
        triggeredBy: h.triggeredBy,
        stripeEventId: h.stripeEventId,
        metadata: h.metadata ? JSON.parse(h.metadata) : null,
        notes: h.notes,
        createdAt: h.createdAt,
      })),
      total: history.length,
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
