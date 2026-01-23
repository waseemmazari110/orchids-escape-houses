/**
 * API Route: Guest Transactions (Booking Payments)
 * GET /api/admin/transactions/guests
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, bookings, user } from "../../../../../../drizzle/schema";
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

    // Fetch guest booking payments (payments with bookingId)
    const guestTransactions = await db
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
        receiptUrl: payments.receiptUrl,
        // Booking details
        bookingId: bookings.id,
        propertyName: bookings.propertyName,
        propertyLocation: bookings.propertyLocation,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail,
        guestPhone: bookings.guestPhone,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        numberOfGuests: bookings.numberOfGuests,
        bookingStatus: bookings.bookingStatus,
        totalPrice: bookings.totalPrice,
        depositAmount: bookings.depositAmount,
        balanceAmount: bookings.balanceAmount,
        depositPaid: bookings.depositPaid,
        balancePaid: bookings.balancePaid,
      })
      .from(payments)
      .leftJoin(user, eq(payments.userId, user.id))
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(
        and(
          isNotNull(payments.bookingId), // Only booking payments
          isNull(payments.subscriptionId) // Exclude subscription payments
        )
      )
      .orderBy(desc(payments.createdAt));

    console.log("📊 Guest Transactions API Response:", {
      count: guestTransactions.length,
      sample: guestTransactions[0],
    });

    // Calculate statistics
    const stats = {
      totalTransactions: guestTransactions.length,
      totalRevenue: guestTransactions
        .filter((t) => t.status === "succeeded")
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      totalBookings: new Set(guestTransactions.map((t) => t.bookingId)).size,
      depositPayments: guestTransactions.filter((t) => t.billingReason === "booking_deposit").length,
      balancePayments: guestTransactions.filter((t) => t.billingReason === "booking_balance").length,
      failedPayments: guestTransactions.filter((t) => t.status === "failed" || t.status === "requires_payment_method").length,
    };

    return NextResponse.json({
      success: true,
      transactions: guestTransactions,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Guest Transactions API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch guest transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
