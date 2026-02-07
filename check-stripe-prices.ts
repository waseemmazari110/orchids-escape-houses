import "dotenv/config";
import { stripe } from "./src/lib/stripe";
import { getPlanPriceId } from "./src/lib/plans";

async function checkStripePrices() {
  try {
    console.log("Checking Stripe Price Configuration\n");
    console.log("=".repeat(60));

    const plans = [
      { id: "bronze", name: "Essential Listing", expectedYearly: 450 },
      { id: "silver", name: "Professional Listing", expectedYearly: 650 },
      { id: "gold", name: "Premium Listing", expectedYearly: 850 },
    ];

    for (const plan of plans) {
      console.log(`\n${plan.name.toUpperCase()} (${plan.id})`);
      console.log("-".repeat(60));

      // Get yearly price ID
      const yearlyPriceId = getPlanPriceId(plan.id as any, "yearly");
      console.log(`Yearly Price ID: ${yearlyPriceId}`);

      try {
        const yearlyPrice = await stripe.prices.retrieve(yearlyPriceId);
        const amount = yearlyPrice.unit_amount ? yearlyPrice.unit_amount / 100 : 0;
        console.log(`Actual Amount: £${amount}`);
        console.log(`Expected Amount: £${plan.expectedYearly}`);
        
        if (amount === plan.expectedYearly) {
          console.log("✅ CORRECT");
        } else {
          console.log(`❌ WRONG! Should be £${plan.expectedYearly} but is £${amount}`);
        }

        console.log(`Currency: ${yearlyPrice.currency?.toUpperCase()}`);
        console.log(`Interval: ${yearlyPrice.recurring?.interval}`);
        console.log(`Product: ${yearlyPrice.product}`);
      } catch (error: any) {
        console.log(`❌ ERROR retrieving price: ${error.message}`);
      }

      // Get monthly price ID
      const monthlyPriceId = getPlanPriceId(plan.id as any, "monthly");
      console.log(`\nMonthly Price ID: ${monthlyPriceId}`);

      try {
        const monthlyPrice = await stripe.prices.retrieve(monthlyPriceId);
        const amount = monthlyPrice.unit_amount ? monthlyPrice.unit_amount / 100 : 0;
        console.log(`Actual Amount: £${amount}`);
        console.log(`Expected Amount: £${plan.expectedYearly / 10}`);
        
        if (amount === plan.expectedYearly / 10) {
          console.log("✅ CORRECT");
        } else {
          console.log(`❌ WRONG! Should be £${plan.expectedYearly / 10} but is £${amount}`);
        }
      } catch (error: any) {
        console.log(`❌ ERROR retrieving price: ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\nRECOMMENDATION:");
    console.log(
      "If any prices are wrong, you need to create new prices in Stripe Dashboard:"
    );
    console.log("1. Go to: https://dashboard.stripe.com/test/products");
    console.log("2. Create/edit products with correct prices");
    console.log("3. Update the price IDs in your .env file\n");
  } catch (error) {
    console.error("Error:", error);
  }
}

checkStripePrices();
