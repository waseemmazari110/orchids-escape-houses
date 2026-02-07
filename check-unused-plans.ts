import "dotenv/config";
import { db } from "./src/db";
import { planPurchases } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function checkUnusedPlans() {
  try {
    console.log("Checking all plan purchases...\n");

    // Get all plan purchases
    const allPurchases = await db.select().from(planPurchases).all();

    console.log(`Total plan purchases: ${allPurchases.length}\n`);

    if (allPurchases.length === 0) {
      console.log("No plan purchases found in the database.");
      return;
    }

    // Show all purchases
    console.log("All purchases:");
    console.table(
      allPurchases.map((p) => ({
        id: p.id,
        userId: p.userId,
        planId: p.planId,
        amount: p.amount,
        used: p.used,
        purchasedAt: p.purchasedAt,
        expiresAt: p.expiresAt,
        propertyId: p.propertyId,
      }))
    );

    // Filter unused plans
    const unusedPlans = allPurchases.filter((p) => p.used === 0);

    console.log(`\nUnused plans: ${unusedPlans.length}`);

    if (unusedPlans.length > 0) {
      console.log("\nUnused plan details:");
      unusedPlans.forEach((p) => {
        console.log(`\nPurchase ID: ${p.id}`);
        console.log(`  User ID: ${p.userId}`);
        console.log(`  Plan ID: ${p.planId}`);
        console.log(`  Amount: $${p.amount / 100}`);
        console.log(`  Purchased At: ${p.purchasedAt}`);
        console.log(`  Expires At: ${p.expiresAt}`);
        console.log(`  Used: ${p.used === 1 ? "Yes" : "No"}`);
        console.log(`  Property ID: ${p.propertyId || "None"}`);

        // Check if expired
        const now = new Date();
        const expiresAt = new Date(p.expiresAt);
        const isExpired = expiresAt < now;
        console.log(
          `  Status: ${isExpired ? "EXPIRED" : "VALID"} (Expires: ${expiresAt.toLocaleString()})`
        );
      });
    }

    // Show used plans
    const usedPlans = allPurchases.filter((p) => p.used === 1);
    console.log(`\n\nUsed plans: ${usedPlans.length}`);

    if (usedPlans.length > 0) {
      console.log("\nUsed plan details:");
      usedPlans.forEach((p) => {
        console.log(`\nPurchase ID: ${p.id}`);
        console.log(`  User ID: ${p.userId}`);
        console.log(`  Plan ID: ${p.planId}`);
        console.log(`  Property ID: ${p.propertyId}`);
        console.log(`  Used At: ${p.usedAt}`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkUnusedPlans();
