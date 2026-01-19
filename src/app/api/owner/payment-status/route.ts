import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";

/**
 * Check the actual payment status from Stripe for the user's subscription
 * This bypasses the webhook and directly checks Stripe's records
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user profile
    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId));

    if (!user.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = user[0];
    let stripePaymentStatus = userData.paymentStatus || 'pending';
    let subscription = null;

    // If user has a planId, try to find their Stripe subscription
    if (userData.planId) {
      try {
        // Get the Stripe customer ID from the user's properties or search by email
        let customers = await stripe.customers.list({
          email: userData.email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            limit: 10,
          });

          if (subscriptions.data.length > 0) {
            subscription = subscriptions.data[0];
            const status = subscription.status;
            
            console.log(`[Payment Status Check] User ${userId} Stripe subscription status: ${status}`);
            
            // Map Stripe subscription status to our payment status
            if (status === 'active' || status === 'trialing') {
              stripePaymentStatus = 'active';
            } else if (status === 'past_due') {
              stripePaymentStatus = 'past_due';
            } else if (status === 'canceled' || status === 'incomplete_expired') {
              stripePaymentStatus = 'cancelled';
            } else if (status === 'incomplete') {
              stripePaymentStatus = 'pending';
            }

            // If Stripe shows active but DB shows pending, update the database
            if (stripePaymentStatus === 'active' && userData.paymentStatus !== 'active') {
              console.log(`[Payment Status Check] Updating user ${userId} payment status to active (from Stripe)`);
              await db
                .update(userTable)
                .set({
                  paymentStatus: 'active',
                  updatedAt: Math.floor(Date.now() / 1000),
                })
                .where(eq(userTable.id, userId));
            }
          }
        }
      } catch (error) {
        console.error(`[Payment Status Check] Error checking Stripe for user ${userId}:`, error);
        // Continue with current status - don't fail
      }
    }

    console.log(`[Payment Status Check] User ${userId}:`, {
      email: userData.email,
      planId: userData.planId,
      dbPaymentStatus: userData.paymentStatus,
      stripePaymentStatus,
      subscriptionStatus: subscription?.status,
    });

    return NextResponse.json({
      ...userData,
      paymentStatus: stripePaymentStatus,
      stripePaymentStatus,
      subscriptionStatus: subscription?.status,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
