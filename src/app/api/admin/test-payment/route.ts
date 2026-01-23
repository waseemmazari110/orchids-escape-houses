import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments as paymentsTable, user as userTable } from '../../../../../drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, amount = 99.99 } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Check if user exists
    const userExists = await db
      .select()
      .from(userTable)
      .limit(1);

    console.log('User exists check:', userExists.length > 0);

    // Create a test payment record
    const [testPayment] = await db.insert(paymentsTable).values({
      userId: userExists[0]?.id || userId,
      stripePaymentIntentId: `test_pi_${Date.now()}`,
      stripeChargeId: `test_ch_${Date.now()}`,
      amount: amount,
      currency: 'GBP',
      paymentStatus: 'succeeded',
      paymentMethod: 'card',
      paymentMethodBrand: 'visa',
      paymentMethodLast4: '4242',
      description: 'Test payment from admin',
      receiptEmail: 'test@example.com',
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    console.log('✅ Test payment inserted:', testPayment);

    // Verify it was saved by reading it back
    const allPayments = await db.select().from(paymentsTable).limit(10);
    console.log('📊 Total payments in DB:', allPayments.length);

    return NextResponse.json({
      success: true,
      message: 'Test payment created successfully',
      testPayment,
      totalPayments: allPayments.length,
    });
  } catch (error) {
    console.error('Test payment error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
