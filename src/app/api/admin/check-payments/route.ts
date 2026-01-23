import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments as paymentsTable, user as userTable } from '../../../../../drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all payments from database
    const payments = await db.select().from(paymentsTable);
    
    // Get all users
    const users = await db.select().from(userTable);

    return NextResponse.json({
      success: true,
      totalPayments: payments.length,
      totalUsers: users.length,
      payments: payments.map(p => ({
        id: p.id,
        userId: p.userId,
        amount: p.amount,
        status: p.paymentStatus,
        stripePaymentIntentId: p.stripePaymentIntentId,
        createdAt: p.createdAt,
      })),
      message: 'Database check successful',
    });
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
