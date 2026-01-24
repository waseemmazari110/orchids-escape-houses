/**
 * API Route: Owner Transactions (Subscription/Plan Payments)
 * GET /api/admin/transactions/owners
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, subscriptions, user } from "@/db/schema";
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
        paymentStatus: payments.paymentStatus,
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

    // Filter out incomplete records (where core payment data is missing)
    const validTransactions = ownerTransactions
      .filter((t) => t && t.id && t.userId && t.amount !== null && t.paymentStatus)
      .map((t) => {
        // Build a clean, serializable object
        const obj: Record<string, any> = {};
        if (t.id) obj.id = t.id;
        if (t.userId) obj.userId = t.userId;
        if (t.userName) obj.userName = t.userName;
        if (t.userEmail) obj.userEmail = t.userEmail;
        if (t.userRole) obj.userRole = t.userRole;
        if (t.amount !== null && t.amount !== undefined) obj.amount = t.amount;
        if (t.currency) obj.currency = t.currency;
        if (t.paymentStatus) obj.paymentStatus = t.paymentStatus;
        if (t.paymentMethod) obj.paymentMethod = t.paymentMethod;
        if (t.paymentMethodBrand) obj.paymentMethodBrand = t.paymentMethodBrand;
        if (t.paymentMethodLast4) obj.paymentMethodLast4 = t.paymentMethodLast4;
        if (t.description) obj.description = t.description;
        if (t.billingReason) obj.billingReason = t.billingReason;
        if (t.createdAt) obj.createdAt = t.createdAt;
        if (t.stripePaymentIntentId) obj.stripePaymentIntentId = t.stripePaymentIntentId;
        if (t.stripeSubscriptionId) obj.stripeSubscriptionId = t.stripeSubscriptionId;
        if (t.receiptUrl) obj.receiptUrl = t.receiptUrl;
        if (t.subscriptionId) obj.subscriptionId = t.subscriptionId;
        if (t.planName) obj.planName = t.planName;
        if (t.planType) obj.planType = t.planType;
        if (t.subscriptionStatus) obj.subscriptionStatus = t.subscriptionStatus;
        if (t.subscriptionInterval) obj.subscriptionInterval = t.subscriptionInterval;
        if (t.currentPeriodEnd) obj.currentPeriodEnd = t.currentPeriodEnd;
        return obj;
      });

    console.log("📊 Owner Transactions API Response:", {
      count: validTransactions.length,
      sample: validTransactions[0],
    });

    // Calculate statistics
    const stats = {
      totalTransactions: validTransactions.length,
      totalRevenue: validTransactions
        .filter((t) => t.paymentStatus === "succeeded")
        .reduce((sum, t) => sum + ((t.amount as number) || 0), 0),
      activeSubscriptions: new Set(
        validTransactions
          .filter((t) => t.subscriptionStatus === "active")
          .map((t) => t.subscriptionId)
          .filter(Boolean)
      ).size,
      failedPayments: validTransactions.filter((t) => t.paymentStatus === "failed" || t.paymentStatus === "requires_payment_method").length,
    };

    return NextResponse.json({
      success: true,
      transactions: validTransactions,
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
