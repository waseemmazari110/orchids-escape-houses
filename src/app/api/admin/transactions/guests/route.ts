/**
 * API Route: Guest Transactions (Booking Payments)
 * GET /api/admin/transactions/guests
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, bookings, user } from "@/db/schema";
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
        paymentStatus: payments.paymentStatus,
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

    // Filter out incomplete records (where core payment data is missing)
    const validTransactions = guestTransactions
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
        if (t.receiptUrl) obj.receiptUrl = t.receiptUrl;
        if (t.bookingId) obj.bookingId = t.bookingId;
        if (t.propertyName) obj.propertyName = t.propertyName;
        if (t.propertyLocation) obj.propertyLocation = t.propertyLocation;
        if (t.guestName) obj.guestName = t.guestName;
        if (t.guestEmail) obj.guestEmail = t.guestEmail;
        if (t.guestPhone) obj.guestPhone = t.guestPhone;
        if (t.checkInDate) obj.checkInDate = t.checkInDate;
        if (t.checkOutDate) obj.checkOutDate = t.checkOutDate;
        if (t.numberOfGuests) obj.numberOfGuests = t.numberOfGuests;
        if (t.bookingStatus) obj.bookingStatus = t.bookingStatus;
        if (t.totalPrice !== null && t.totalPrice !== undefined) obj.totalPrice = t.totalPrice;
        if (t.depositAmount !== null && t.depositAmount !== undefined) obj.depositAmount = t.depositAmount;
        if (t.balanceAmount !== null && t.balanceAmount !== undefined) obj.balanceAmount = t.balanceAmount;
        if (t.depositPaid !== null && t.depositPaid !== undefined) obj.depositPaid = t.depositPaid;
        if (t.balancePaid !== null && t.balancePaid !== undefined) obj.balancePaid = t.balancePaid;
        return obj;
      });

    console.log("📊 Guest Transactions API Response:", {
      count: validTransactions.length,
      sample: validTransactions[0],
    });

    // Calculate statistics
    const stats = {
      totalTransactions: validTransactions.length,
      totalRevenue: validTransactions
        .filter((t) => t.paymentStatus === "succeeded")
        .reduce((sum, t) => sum + ((t.amount as number) || 0), 0),
      totalBookings: new Set(validTransactions.map((t) => t.bookingId).filter(Boolean)).size,
      depositPayments: validTransactions.filter((t) => t.billingReason === "booking_deposit").length,
      balancePayments: validTransactions.filter((t) => t.billingReason === "booking_balance").length,
      failedPayments: validTransactions.filter((t) => t.paymentStatus === "failed" || t.paymentStatus === "requires_payment_method").length,
    };

    return NextResponse.json({
      success: true,
      transactions: validTransactions,
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
