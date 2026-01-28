import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { properties } from '../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this is a property plan payment
        if (session.metadata?.type === 'property_plan') {
          const propertyId = session.metadata.propertyId ? parseInt(session.metadata.propertyId) : null;
          const planId = session.metadata.planId;
          const userId = session.metadata.userId;
          const paymentIntentId = session.payment_intent as string;

          // Calculate expiry date (1 year from now)
          const purchasedAt = new Date().toISOString();
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          if (propertyId) {
            // Update existing property with plan details
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
            // Payment made before property creation
            // Store payment info to be associated with property later
            // For now, we'll retrieve this from session client-side
            console.log(`✅ Payment completed for user ${userId}, plan ${planId}. Payment intent: ${paymentIntentId}`);
            console.log(`   Plan valid until ${expiresAt.toISOString()}. Property will be created next.`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
