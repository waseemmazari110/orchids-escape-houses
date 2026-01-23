/**
 * API Route: Owner Transactions (Subscription/Plan Payments)
 * GET /api/admin/transactions/owners
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, subscriptions, user } from "../../../../../../drizzle/schema";
import { eq, desc, isNull, isNotNull, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Fetch owner subscription payments (payments with subscriptionId)
    const ownerTransactions = await db
      .select({
        id: payments.id,
        userId: payments.userId,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.paymentStatus,
        paymentMethod: payments.paymentMethod,
        paymentMethodBrand: payments.paymentMethodBrand,
        paymentMethodLast4: payments.paymentMethodLast4,
        description: payments.description,
        billingReason: payments.billingReason,
        createdAt: payments.createdAt,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        stripeSubscriptionId: payments.stripeSubscriptionId,
        receiptUrl: payments.receiptUrl,
        // Subscription details
        subscriptionId: subscriptions.id,
        planName: subscriptions.planName,
        planType: subscriptions.planType,
        subscriptionStatus: subscriptions.status,
        subscriptionInterval: subscriptions.interval,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(payments)
      .leftJoin(user, eq(payments.userId, user.id))
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .where(
        and(
          isNotNull(payments.subscriptionId), // Only subscription payments
          isNull(payments.bookingId) // Exclude booking payments
        )
      )
      .orderBy(desc(payments.createdAt));

    console.log("📊 Owner Transactions API Response:", {
      count: ownerTransactions.length,
      sample: ownerTransactions[0],
    });

    // Calculate statistics
    const stats = {
      totalTransactions: ownerTransactions.length,
      totalRevenue: ownerTransactions
        .filter((t) => t.status === "succeeded")
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      activeSubscriptions: new Set(
        ownerTransactions
          .filter((t) => t.subscriptionStatus === "active")
          .map((t) => t.subscriptionId)
      ).size,
      failedPayments: ownerTransactions.filter((t) => t.status === "failed" || t.status === "requires_payment_method").length,
    };

    return NextResponse.json({
      success: true,
      transactions: ownerTransactions,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Owner Transactions API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch owner transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
