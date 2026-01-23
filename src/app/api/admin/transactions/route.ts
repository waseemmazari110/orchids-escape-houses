import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { payments, user, bookings } from "../../../../../drizzle/schema";
import { eq, and, or, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user || (session.user as any).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    // Build query for real transaction data
    let whereConditions = [];
    
    if (status !== "all") {
      whereConditions.push(eq(payments.paymentStatus, status));
    }

    // Fetch payments with user info and booking info
    const allPayments = await db
      .select({
        id: payments.id,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        stripeChargeId: payments.stripeChargeId,
        userId: payments.userId,
        bookingId: payments.bookingId,
        amount: payments.amount,
        currency: payments.currency,
        paymentStatus: payments.paymentStatus,
        paymentMethod: payments.paymentMethod,
        paymentMethodBrand: payments.paymentMethodBrand,
        paymentMethodLast4: payments.paymentMethodLast4,
        description: payments.description,
        receiptEmail: payments.receiptEmail,
        failureMessage: payments.failureMessage,
        processedAt: payments.processedAt,
        createdAt: payments.createdAt,
        userName: user.name,
        userEmail: user.email,
        bookingPropertyName: bookings.propertyName,
        bookingGuestName: bookings.guestName,
        bookingGuestEmail: bookings.guestEmail,
      })
      .from(payments)
      .leftJoin(user, eq(payments.userId, user.id))
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(payments.createdAt));

    // Filter by search
    let filtered = allPayments;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t =>
        (t.userName?.toLowerCase().includes(searchLower)) ||
        (t.userEmail?.toLowerCase().includes(searchLower)) ||
        (t.bookingGuestName?.toLowerCase().includes(searchLower)) ||
        (t.bookingGuestEmail?.toLowerCase().includes(searchLower)) ||
        (t.bookingPropertyName?.toLowerCase().includes(searchLower)) ||
        (t.description?.toLowerCase().includes(searchLower)) ||
        (t.stripePaymentIntentId?.toLowerCase().includes(searchLower))
      );
    }

    // Transform to component format
    const transactions = filtered.slice(0, limit).map(t => ({
      id: t.id?.toString(),
      customer: {
        name: t.bookingGuestName || t.userName || "Unknown",
        email: t.bookingGuestEmail || t.userEmail || t.receiptEmail || "N/A",
      },
      amount: t.amount,
      currency: t.currency || "GBP",
      status: t.paymentStatus,
      date: t.processedAt || t.createdAt,
      stripeId: t.stripePaymentIntentId || t.stripeChargeId || "N/A",
      description: t.description || "Payment",
      propertyName: t.bookingPropertyName || "N/A",
      paymentMethodBrand: t.paymentMethodBrand || "unknown",
      paymentMethodLast4: t.paymentMethodLast4 || "0000",
      failureMessage: t.failureMessage || null,
      isBookingPayment: !!t.bookingId,
      receiptUrl: null, // Will be added when available from Stripe
    }));

    // Calculate stats from real data
    const stats = {
      totalRevenue: allPayments
        .filter(t => t.paymentStatus === "succeeded")
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      successful: allPayments.filter(t => t.paymentStatus === "succeeded").length,
      pending: allPayments.filter(t => t.paymentStatus === "pending").length,
      failed: allPayments.filter(t => t.paymentStatus === "failed").length,
      refunded: allPayments.filter(t => t.paymentStatus === "refunded").length,
      cancelled: allPayments.filter(t => t.paymentStatus === "cancelled" || t.paymentStatus === "canceled").length,
    };

    // Add booking-specific stats
    const bookingPayments = allPayments.filter(t => t.bookingId);
    const subscriptionPayments = allPayments.filter(t => !t.bookingId);

    console.log('📊 Transactions API Response:', {
      totalPayments: allPayments.length,
      filteredTransactions: transactions.length,
      bookingPayments: bookingPayments.length,
      subscriptionPayments: subscriptionPayments.length,
      stats
    });

    return Response.json({
      transactions,
      stats: {
        ...stats,
        bookingPayments: bookingPayments.length,
        subscriptionPayments: subscriptionPayments.length,
      },
      total: filtered.length,
      limit,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return Response.json(
      { 
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
