import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { payments, user, bookings } from '@/db/schema';
import { desc, isNotNull } from 'drizzle-orm';

/**
 * Database Health Check for Payment System
 * GET /api/admin/db-check
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check payments table
    const allPayments = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(10);

    // Check users table
    const allUsers = await db
      .select({
        id: user.id,
        email: user.email,
        role: user.role,
      })
      .from(user)
      .limit(5);

    // Check bookings table
    const allBookings = await db
      .select({
        id: bookings.id,
        propertyName: bookings.propertyName,
        guestEmail: bookings.guestEmail,
        bookingStatus: bookings.bookingStatus,
        depositPaid: bookings.depositPaid,
        balancePaid: bookings.balancePaid,
      })
      .from(bookings)
      .limit(5);

    // Check for payment-booking relationships
    const paymentsWithBookings = await db
      .select({
        paymentId: payments.id,
        paymentStatus: payments.paymentStatus,
        amount: payments.amount,
        bookingId: payments.bookingId,
      })
      .from(payments)
      .where(isNotNull(payments.bookingId))
      .limit(5);

    const summary = {
      database: {
        connected: true,
        tables: {
          payments: {
            total: allPayments.length,
            hasData: allPayments.length > 0,
            sample: allPayments.slice(0, 3).map(p => ({
              id: p.id,
              amount: p.amount,
              paymentStatus: p.paymentStatus,
              bookingId: p.bookingId,
              createdAt: p.createdAt,
            })),
          },
          users: {
            total: allUsers.length,
            hasData: allUsers.length > 0,
            sample: allUsers.slice(0, 3).map(u => ({
              id: u.id,
              email: u.email,
              role: u.role,
            })),
          },
          bookings: {
            total: allBookings.length,
            hasData: allBookings.length > 0,
            sample: allBookings.slice(0, 3),
          },
        },
        relationships: {
          paymentsWithBookings: paymentsWithBookings.length,
          hasLinkedData: paymentsWithBookings.length > 0,
        },
      },
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Analyze issues
    if (allPayments.length === 0) {
      summary.issues.push('⚠️ No payments in database');
      summary.recommendations.push('Create a test payment or complete a booking to see transactions');
    }

    if (allBookings.length === 0) {
      summary.issues.push('⚠️ No bookings in database');
      summary.recommendations.push('No bookings exist - payment system needs bookings to process payments');
    }

    if (allUsers.length === 0) {
      summary.issues.push('❌ No users in database - this is critical!');
    }

    if (paymentsWithBookings.length === 0 && allPayments.length > 0) {
      summary.issues.push('⚠️ Payments exist but none are linked to bookings');
      summary.recommendations.push('Check if payments are subscription payments or orphaned records');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      rawData: {
        payments: allPayments,
        users: allUsers,
        bookings: allBookings,
        paymentsWithBookings,
      },
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database check failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Create Test Data
 * POST /api/admin/db-check
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'create-test-payment') {
      // Create a test payment
      const [testPayment] = await db.insert(payments).values({
        userId: session.user.id,
        stripePaymentIntentId: `test_pi_${Date.now()}`,
        stripeChargeId: `test_ch_${Date.now()}`,
        amount: 100.00,
        currency: 'GBP',
        paymentStatus: 'succeeded',
        method: 'card',
        paymentMethodBrand: 'visa',
        paymentMethodLast4: '4242',
        description: 'Test payment - DB health check',
        receiptEmail: session.user.email || 'admin@test.com',
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();

      return NextResponse.json({
        success: true,
        message: 'Test payment created',
        payment: testPayment,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Test data creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create test data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
