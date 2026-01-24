import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { bookings, properties, user, payments } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user || (session.user as any).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get statistics from real data
    const bookingCount = await db.select({ count: count() }).from(bookings);
    const propertyCount = await db.select({ count: count() }).from(properties);
    const userCount = await db.select({ count: count() }).from(user);
    
    // Get owners (users with role = 'owner')
    const ownerCount = await db.select({ count: count() }).from(user).where(eq(user.role, 'owner'));
    
    // Get guests (users with role = 'guest')
    const guestCount = await db.select({ count: count() }).from(user).where(eq(user.role, 'guest'));
    
    // Get total revenue from successful payments
    const revenueResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` 
      })
      .from(payments)
      .where(eq(payments.paymentStatus, 'succeeded'));

    return Response.json({
      totalBookings: bookingCount[0]?.count || 0,
      totalUsers: userCount[0]?.count || 0,
      totalOwners: ownerCount[0]?.count || 0,
      totalGuests: guestCount[0]?.count || 0,
      totalProperties: propertyCount[0]?.count || 0,
      totalRevenue: revenueResult[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return Response.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
