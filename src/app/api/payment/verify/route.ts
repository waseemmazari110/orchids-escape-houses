import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { planPurchases, properties } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('[Payment Verify] Retrieving session:', sessionId);

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    console.log('[Payment Verify] Session data:', {
      paymentStatus: checkoutSession.payment_status,
      metadata: checkoutSession.metadata,
      customerId: checkoutSession.customer,
      subscriptionId: checkoutSession.subscription,
    });

    // Verify the session belongs to this user
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if payment was successful
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', status: checkoutSession.payment_status },
        { status: 400 }
      );
    }

    const planId = checkoutSession.metadata?.planId;
    const propertyId = checkoutSession.metadata?.propertyId ? parseInt(checkoutSession.metadata.propertyId) : null;
    const paymentIntentId = typeof checkoutSession.payment_intent === 'string' 
      ? checkoutSession.payment_intent 
      : checkoutSession.payment_intent?.id || null;
    const customerId = typeof checkoutSession.customer === 'string'
      ? checkoutSession.customer
      : checkoutSession.customer?.id || null;
    const subscriptionId = typeof checkoutSession.subscription === 'string'
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id || null;
    const amount = checkoutSession.amount_total || 0;

    // Check if this purchase was already saved (avoid duplicates)
    // Check by both payment intent and subscription ID
    let existing: any[] = [];
    if (paymentIntentId) {
      existing = await db
        .select()
        .from(planPurchases)
        .where(
          and(
            eq(planPurchases.userId, session.user.id),
            eq(planPurchases.stripePaymentIntentId, paymentIntentId)
          )
        )
        .limit(1);
    }
    
    if (existing.length === 0 && subscriptionId) {
      existing = await db
        .select()
        .from(planPurchases)
        .where(
          and(
            eq(planPurchases.userId, session.user.id),
            eq(planPurchases.stripeSubscriptionId, subscriptionId)
          )
        )
        .limit(1);
    }

    if (existing.length > 0) {
      console.log('[Payment Verify] Purchase already exists:', existing[0].id);
      return NextResponse.json({
        success: true,
        planId,
        paymentIntentId,
        amountPaid: amount,
        currency: checkoutSession.currency,
        purchaseId: existing[0].id,
        alreadyExists: true,
      });
    }

    // Calculate expiry date (1 year from now for yearly plans)
    const now = new Date();
    const purchasedAt = now.toISOString();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    if (propertyId) {
      // Payment for existing property - update the property
      console.log('[Payment Verify] Updating property:', propertyId);
      await db
        .update(properties)
        .set({
          planId,
          paymentStatus: 'paid',
          stripePaymentIntentId: paymentIntentId,
          planPurchasedAt: purchasedAt,
          planExpiresAt: expiresAt.toISOString(),
        })
        .where(eq(properties.id, propertyId));

      console.log(`✅ Property ${propertyId} plan ${planId} activated until ${expiresAt.toISOString()}`);
    } else {
      // Payment made before property creation - save for later use
      console.log('[Payment Verify] Saving unused plan purchase for user:', session.user.id);
      
      const newPurchase = await db.insert(planPurchases).values({
        userId: session.user.id,
        planId: planId!,
        stripePaymentIntentId: paymentIntentId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        amount,
        purchasedAt,
        expiresAt: expiresAt.toISOString(),
        used: 0,
        createdAt: now.toISOString(),
      }).returning();

      console.log(`✅ Plan purchase saved for user ${session.user.id}, plan ${planId}. Payment intent: ${paymentIntentId}`);
      console.log(`   Plan valid until ${expiresAt.toISOString()}. Property will be created next.`);
      
      return NextResponse.json({
        success: true,
        planId,
        paymentIntentId,
        amountPaid: amount,
        currency: checkoutSession.currency,
        purchaseId: newPurchase[0]?.id,
        saved: true,
      });
    }

    // Return payment details
    return NextResponse.json({
      success: true,
      planId,
      paymentIntentId,
      amountPaid: amount,
      currency: checkoutSession.currency,
    });
  } catch (error) {
    console.error('[Payment Verify] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
