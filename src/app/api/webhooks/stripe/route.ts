import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { user as userTable, properties as propertiesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncMembershipToCRM, updateMembershipInCRM } from '@/lib/crm-sync';

const processedEvents = new Set<string>();

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  if (processedEvents.has(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true });
  }
  processedEvents.add(event.id);
  if (processedEvents.size > 1000) processedEvents.clear();

  console.log(`Processing Stripe webhook: ${event.type} (${event.id})`);

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid' || event.type === 'customer.subscription.updated') {
      const sessionOrInvoiceOrSub = event.data.object as any;
      
      let subscriptionId = sessionOrInvoiceOrSub.subscription;
      if (event.type === 'customer.subscription.updated') {
        subscriptionId = sessionOrInvoiceOrSub.id;
      }

      const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;
      
      const metadata = sessionOrInvoiceOrSub.metadata?.userId ? sessionOrInvoiceOrSub.metadata : 
                      (subscription?.metadata?.userId ? subscription.metadata : null);

      if (!metadata) {
        console.warn('No metadata found in event:', event.type);
        console.warn('Session/Invoice/Sub metadata:', sessionOrInvoiceOrSub.metadata);
        console.warn('Subscription metadata:', subscription?.metadata);
        return NextResponse.json({ received: true });
      }

      const { userId, planId, propertyId } = metadata;

      if (!userId || !planId) {
        console.error('Missing userId or planId in metadata', { userId, planId });
        return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 });
      }

      console.log(`Webhook: Updating user ${userId} with plan ${planId} and paymentStatus=active`);
      
      const updateResult = await db
        .update(userTable)
        .set({
          paymentStatus: 'active',
          planId: planId,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, userId));

      console.log(`Webhook: Update result for user ${userId}:`, updateResult);
      
      // Sync membership to CRM
      try {
        const membershipData = {
          planTier: planId.toLowerCase(),
          planPrice: subscription?.items.data[0].price.unit_amount ? 
            subscription.items.data[0].price.unit_amount / 100 : 0,
          billingCycle: subscription?.items.data[0].price.recurring?.interval || 'annual',
          stripeCustomerId: subscription?.customer,
          stripeSubscriptionId: subscription?.id,
        };
        await syncMembershipToCRM(userId, membershipData);
      } catch (crmError) {
        console.error('Failed to sync membership to CRM (non-blocking):', crmError);
      }
      
      // Verify the update was successful
      const verifyUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, userId));
      
      if (verifyUser.length) {
        console.log(`Webhook: Verified user ${userId} now has:`, {
          planId: verifyUser[0].planId,
          paymentStatus: verifyUser[0].paymentStatus,
        });
      }

      if (propertyId) {
        const updateData: any = {
          status: 'Active',
          plan: planId.charAt(0).toUpperCase() + planId.slice(1),
          isPublished: true,
          updatedAt: new Date().toISOString(),
        };

        if (subscription) {
          const sub = subscription as any;
          updateData.stripeCustomerId = sub.customer as string;
          updateData.stripeSubscriptionId = sub.id;
          updateData.stripePriceId = sub.items.data[0].price.id;
          updateData.nextPaymentDate = new Date(sub.current_period_end * 1000).toISOString();
          updateData.stripeInvoiceId = typeof sub.latest_invoice === 'string' ? sub.latest_invoice : sub.latest_invoice?.id;
        }

        await db
          .update(propertiesTable)
          .set(updateData)
          .where(eq(propertiesTable.id, parseInt(propertyId)));
        
        console.log(`Updated property ${propertyId} to Active with plan ${planId}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const metadata = subscription.metadata;
      
      if (metadata?.userId) {
        await db
          .update(userTable)
          .set({
            paymentStatus: 'cancelled',
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, metadata.userId));
        console.log(`User ${metadata.userId} subscription cancelled`);
        
        // Update membership in CRM
        try {
          await updateMembershipInCRM(metadata.userId, {
            status: 'cancelled',
          });
        } catch (crmError) {
          console.error('Failed to update membership in CRM (non-blocking):', crmError);
        }
      }

      if (metadata?.propertyId) {
        await db
          .update(propertiesTable)
          .set({
            status: 'Inactive',
            isPublished: false,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(propertiesTable.id, parseInt(metadata.propertyId)));
        console.log(`Property ${metadata.propertyId} deactivated due to subscription cancellation`);
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const metadata = subscription.metadata;
        
        if (metadata?.userId) {
          await db
            .update(userTable)
            .set({
              paymentStatus: 'past_due',
              updatedAt: new Date(),
            })
            .where(eq(userTable.id, metadata.userId));
          console.log(`User ${metadata.userId} payment failed, status set to past_due`);
          
          // Update membership in CRM with payment failure
          try {
            await updateMembershipInCRM(metadata.userId, {
              status: 'past_due',
              paymentFailed: true,
            });
          } catch (crmError) {
            console.error('Failed to update membership in CRM (non-blocking):', crmError);
          }
        }
      }
    }
  } catch (dbError) {
    console.error('Database update error:', dbError);
    return NextResponse.json(
      { error: 'Failed to update database records' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
