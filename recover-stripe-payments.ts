import "dotenv/config";
import { stripe } from "./src/lib/stripe";
import { db } from "./src/db";
import { planPurchases } from "./src/db/schema";
import { eq, or } from "drizzle-orm";

async function recoverPayments() {
  try {
    console.log("Recovering previous Stripe payments...\n");

    // The two session IDs from your logs
    const sessionIds = [
      "cs_test_a1jExD8PcZvVTB8vqp0chu51iwR9jCD693sd1jxz8yKtMgSqiOxK8nQ0HQ",
      "cs_test_a1Iy1o6h68vmAsOBXvC80L9yrdAPW8a6sx1csUSehpLMHcuKTsl3jgca2U",
    ];

    for (const sessionId of sessionIds) {
      try {
        console.log(`\nRetrieving session: ${sessionId}`);

        // Retrieve the checkout session from Stripe
        const checkoutSession = await stripe.checkout.sessions.retrieve(
          sessionId,
          {
            expand: ["subscription", "customer"],
          }
        );

        console.log("  Status:", checkoutSession.payment_status);
        console.log("  Amount:", checkoutSession.amount_total);
        console.log("  Metadata:", checkoutSession.metadata);

        if (checkoutSession.payment_status !== "paid") {
          console.log("  ⚠️  Payment not completed, skipping");
          continue;
        }

        const userId = checkoutSession.metadata?.userId;
        const planId = checkoutSession.metadata?.planId;
        const propertyId = checkoutSession.metadata?.propertyId
          ? parseInt(checkoutSession.metadata.propertyId)
          : null;

        if (!userId || !planId) {
          console.log("  ⚠️  Missing metadata, skipping");
          continue;
        }

        const paymentIntentId =
          typeof checkoutSession.payment_intent === "string"
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent?.id || null;
        const customerId =
          typeof checkoutSession.customer === "string"
            ? checkoutSession.customer
            : checkoutSession.customer?.id || null;
        const subscriptionId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription?.id || null;
        const amount = checkoutSession.amount_total || 0;

        console.log("  Payment Intent ID:", paymentIntentId);
        console.log("  Subscription ID:", subscriptionId);
        console.log("  Property ID:", propertyId);

        // Check if already saved (check both payment intent and subscription ID)
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

        console.log("  Existing purchases found:", existing.length);
        if (existing.length > 0) {
          console.log("  Existing purchase:", existing[0]);
          console.log("  ✅ Already saved, skipping");
          continue;
        }

        if (propertyId) {
          console.log(
            `  ℹ️  This was for property ${propertyId}, not saving as unused plan`
          );
          continue;
        }

        // Save the purchase
        const now = new Date();
        const purchasedAt = now.toISOString();
        const expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await db.insert(planPurchases).values({
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
        });

        console.log(`  ✅ Recovered! Plan ${planId} for user ${userId}`);
        console.log(`     Valid until: ${expiresAt.toLocaleString()}`);
      } catch (error: any) {
        console.error(`  ❌ Error recovering session: ${error.message}`);
      }
    }

    console.log("\n\n=== Summary ===");
    const allPurchases = await db.select().from(planPurchases);
    console.log(`Total plan purchases in database: ${allPurchases.length}`);

    if (allPurchases.length > 0) {
      console.log("\nAll purchases:");
      console.table(
        allPurchases.map((p) => ({
          id: p.id,
          userId: p.userId?.substring(0, 15) + "...",
          planId: p.planId,
          amount: "$" + (p.amount / 100).toFixed(2),
          used: p.used === 1 ? "Yes" : "No",
          propertyId: p.propertyId || "-",
        }))
      );
    }

    console.log("\n✅ Recovery complete!");
  } catch (error) {
    console.error("Error:", error);
  }
}

recoverPayments();
