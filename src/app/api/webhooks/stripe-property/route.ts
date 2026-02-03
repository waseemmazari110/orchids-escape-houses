import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { properties } from '../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { syncMembershipToCRM } from '@/lib/crm-sync';

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
      case 'checkout.session.completed':
      case 'invoice.paid': {
        // Handle both checkout session and subscription invoice
        const isInvoice = event.type === 'invoice.paid';
        let metadata: Record<string, string | undefined> = {};
        let userId: string | undefined;
        let planId: string | undefined;
        let propertyId: number | null = null;
        let paymentIntentId: string | null = null;
        let customerId: string | null = null;
        let subscriptionId: string | null = null;
        let amount = 0;
        
        if (isInvoice) {
          const invoice = event.data.object as Stripe.Invoice;
          // For invoice.paid events, we need to fetch subscription metadata
          // For now, log and skip - checkout.session.completed is the main event
          console.log('📋 Invoice paid event - ID:', invoice.id);
          console.log('   For subscription renewals, metadata needs to be fetched from subscription object');
          // Skip invoice events for now - focus on checkout.session.completed
          break;
        } else {
          const session = event.data.object as Stripe.Checkout.Session;
          metadata = (session.metadata || {}) as Record<string, string>;
          userId = metadata.userId;
          planId = metadata.planId;
          propertyId = metadata.propertyId ? parseInt(metadata.propertyId) : null;
          paymentIntentId = session.payment_intent as string;
          customerId = session.customer as string;
          subscriptionId = session.subscription as string;
          amount = (session.amount_total || 0) / 100;
          
          console.log('🔔 Checkout session completed:');
          console.log('   User:', userId);
          console.log('   Plan:', planId);
          console.log('   Property:', propertyId || 'N/A');
          console.log('   Amount:', `£${amount}`);
          console.log('   Type:', metadata.type);
        }
        
        // Check if this is a property plan payment
        if (metadata?.type === 'property_plan' || (userId && planId)) {

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

          // Sync membership to CRM (non-blocking)
          if (userId && planId) {
            // Map plan ID to tier name
            const planTierMap: Record<string, string> = {
              '1': 'bronze',
              '2': 'silver',
              '3': 'gold',
            };
            
            const tierName = planTierMap[planId] || 'bronze';
            
            syncMembershipToCRM(userId, {
              planId,
              planTier: tierName,
              planPrice: amount,
              amount,
              billingCycle: 'annual',
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            }).catch(err => {
              console.log('⚠️ CRM membership sync failed (non-critical):', err);
            });
            
            console.log(`✅ CRM sync triggered for user ${userId}, plan ${tierName}, amount £${amount}`);
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
