import "dotenv/config";
import { getPlanPriceId } from "./src/lib/plans";

console.log("Testing getPlanPriceId function with current environment variables:\n");

console.log("Environment Variables:");
console.log("STRIPE_PRICE_BASIC_YEARLY:", process.env.STRIPE_PRICE_BASIC_YEARLY);
console.log("STRIPE_PRICE_PREMIUM_YEARLY:", process.env.STRIPE_PRICE_PREMIUM_YEARLY);
console.log("STRIPE_PRICE_ENTERPRISE_YEARLY:", process.env.STRIPE_PRICE_ENTERPRISE_YEARLY);

console.log("\n" + "=".repeat(60));
console.log("Testing price ID retrieval:\n");

const bronzePriceId = getPlanPriceId("bronze", "yearly");
console.log(`Bronze yearly: ${bronzePriceId}`);

const silverPriceId = getPlanPriceId("silver", "yearly");
console.log(`Silver yearly: ${silverPriceId}`);

const goldPriceId = getPlanPriceId("gold", "yearly");
console.log(`Gold yearly: ${goldPriceId}`);

console.log("\n" + "=".repeat(60));
console.log("Expected vs Actual:\n");

const expected = {
  bronze: "price_1Snc0fI0J9sqa21CNteKoo3q",
  silver: "price_1Snc12I0J9sqa21CHD1J6uVm",
  gold: "price_1Snc1MI0J9sqa21Cj9cBFR47",
};

console.log(
  `Bronze: ${bronzePriceId === expected.bronze ? "✅ CORRECT" : "❌ WRONG"}`
);
console.log(
  `Silver: ${silverPriceId === expected.silver ? "✅ CORRECT" : "❌ WRONG"}`
);
console.log(
  `Gold: ${goldPriceId === expected.gold ? "✅ CORRECT" : "❌ WRONG"}`
);

if (
  bronzePriceId !== expected.bronze ||
  silverPriceId !== expected.silver ||
  goldPriceId !== expected.gold
) {
  console.log("\n❌ PROBLEM FOUND!");
  console.log(
    "The function is returning incorrect price IDs. This could be because:"
  );
  console.log("1. The .env file isn't being loaded properly");
  console.log("2. The dev server needs to be restarted");
  console.log("3. The environment variables have the wrong values");
  console.log("\nRESTART YOUR DEV SERVER and try again!");
} else {
  console.log("\n✅ ALL CORRECT! The getPlanPriceId function is working properly.");
  console.log("The issue must be somewhere else in the flow.");
}
