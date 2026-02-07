import "dotenv/config";
import { db } from "./src/db";
import { planPurchases } from "./src/db/schema";

async function createTestPurchase() {
  try {
    // Get your user ID from the logs above
    const userId = "j4jUCRUBD7BzHBAWOGHCfDK59tRCZP6z"; // From your logs
    const planId = "bronze"; // or "silver" or "gold"
    
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

    const testPurchase = {
      userId: userId,
      planId: planId,
      stripePaymentIntentId: "pi_test_" + Date.now(),
      stripeCustomerId: "cus_test_123",
      stripeSubscriptionId: "sub_test_123",
      amount: 20000, // $200 in cents
      purchasedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: 0,
      propertyId: null,
      usedAt: null,
      createdAt: now.toISOString(),
    };

    console.log("Creating test plan purchase...");
    console.log(testPurchase);

    await db.insert(planPurchases).values(testPurchase);

    console.log("\n✅ Test plan purchase created successfully!");
    console.log(`Plan ID: ${planId}`);
    console.log(`User ID: ${userId}`);
    console.log(`Expires: ${expiresAt.toLocaleString()}`);
    console.log("\nNow go to /choose-plan and you should see 'Use Your Purchased Plan' button!");
  } catch (error) {
    console.error("Error creating test purchase:", error);
  }
}

createTestPurchase();
