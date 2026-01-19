import { db } from "@/db";
import { user as users } from "@/../drizzle/schema";

async function checkUserStatus() {
  try {
    const allUsers = await db.select().from(users).limit(5);
    console.log("\n=== User Payment Status ===\n");
    allUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Payment Status: ${user.paymentStatus}`);
      console.log(`Plan ID: ${user.planId}`);
      console.log("---");
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

checkUserStatus();
