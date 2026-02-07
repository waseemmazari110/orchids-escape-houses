import "dotenv/config";
import { stripe } from "./src/lib/stripe";
import { db } from "./src/db";
import { planPurchases } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function recoverRecentPayments() {
  try {
    console.log("Searching for recent Stripe checkout sessions...\n");

    // Get recent checkout sessions (last 10)
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
      expand: ['data.subscription', 'data.customer'],
    });

    console.log(`Found ${sessions.data.length} recent sessions\n`);

    for (const session of sessions.data) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Session ID: ${session.id}`);
      console.log(`Status: ${session.payment_status}`);
      console.log(`Amount: ${session.amount_total ? '$' + (session.amount_total / 100).toFixed(2) : 'N/A'}`);
      console.log(`Created: ${new Date(session.created * 1000).toLocaleString()}`);
      console.log(`Metadata:`, session.metadata);

      if (session.payment_status !== 'paid') {
        console.log('❌ Not paid, skipping');
        continue;
      }

      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      const propertyId = session.metadata?.propertyId ? parseInt(session.metadata.propertyId) : null;

      if (!userId || !planId) {
        console.log('⚠️  Missing userId or planId in metadata, skipping');
        continue;
      }

      console.log(`\nUser ID: ${userId}`);
      console.log(`Plan ID: ${planId.toUpperCase()}`);
      console.log(`Property ID: ${propertyId || 'None (unused plan)'}`);

      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id || null;

      // Check if already saved
      let existing: any[] = [];
      if (paymentIntentId) {
        existing = await db
          .select()
          .from(planPurchases)
          .where(eq(planPurchases.stripePaymentIntentId, paymentIntentId))
          .limit(1);
      }

      if (existing.length === 0 && subscriptionId) {
        existing = await db
          .select()
          .from(planPurchases)
          .where(eq(planPurchases.stripeSubscriptionId, subscriptionId))
          .limit(1);
      }

      if (existing.length > 0) {
        console.log(`✅ Already saved (Purchase ID: ${existing[0].id})`);
        continue;
      }

      if (propertyId) {
        console.log('ℹ️  This was for a specific property, not saving as unused plan');
        continue;
      }

      // Save the purchase
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id || null;
      const amount = session.amount_total || 0;
      const now = new Date();
      const purchasedAt = new Date(session.created * 1000).toISOString();
      const expiresAt = new Date(session.created * 1000);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const newPurchase = await db.insert(planPurchases).values({
        userId,
        planId,
        stripePaymentIntentId: paymentIntentId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        amount,
        purchasedAt,
        expiresAt: expiresAt.toISOString(),
        used: 0,
        createdAt: now.toISOString(),
      }).returning();

      console.log(`\n✅ RECOVERED! Plan ${planId.toUpperCase()} for user ${userId}`);
      console.log(`   Purchase ID: ${newPurchase[0].id}`);
      console.log(`   Amount: $${(amount / 100).toFixed(2)}`);
      console.log(`   Valid until: ${expiresAt.toLocaleString()}`);
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const allPurchases = await db.select().from(planPurchases);
    console.log(`\nTotal plan purchases in database: ${allPurchases.length}`);

    const unusedPlans = allPurchases.filter(p => p.used === 0);
    console.log(`Unused plans: ${unusedPlans.length}\n`);

    if (unusedPlans.length > 0) {
      console.log('Unused  plans by user:');
      const byUser: Record<string, any[]> = {};
      unusedPlans.forEach(p => {
        if (!byUser[p.userId]) byUser[p.userId] = [];
        byUser[p.userId].push(p);
      });

      Object.entries(byUser).forEach(([userId, plans]) => {
        console.log(`\n👤 User: ${userId.substring(0, 20)}...`);
        plans.forEach(p => {
          console.log(`   - ${p.planId.toUpperCase()}: $${(p.amount / 100).toFixed(2)} (ID: ${p.id})`);
        });
      });
    }

    console.log('\n✅ Recovery complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

recoverRecentPayments();
