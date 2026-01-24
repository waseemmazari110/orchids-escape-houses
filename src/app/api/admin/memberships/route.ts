import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, user } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user || (session.user as any).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch subscriptions with user data
    const membershipData = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        planName: subscriptions.planName,
        status: subscriptions.status,
        amount: subscriptions.amount,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        userName: user.name,
        userEmail: user.email,
      })
      .from(subscriptions)
      .leftJoin(user, eq(subscriptions.userId, user.id));

    // Get counts
    const totalCount = await db.select({ count: count() }).from(subscriptions);
    const activeCount = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    // Calculate total revenue from active subscriptions
    const revenueResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${subscriptions.amount}), 0)` 
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    // Transform to component format
    const memberships = membershipData.map(m => ({
      id: m.id,
      name: m.userName || "Unknown",
      email: m.userEmail || "N/A",
      plan: m.planName || "Standard Plan",
      status: m.status || "inactive",
      amount: m.amount ? `GBP ${m.amount.toFixed(2)}` : "GBP 0.00",
      signupDate: m.currentPeriodStart || new Date().toISOString(),
      nextBillingDate: m.currentPeriodEnd || new Date().toISOString(),
    }));

    return Response.json({
      memberships,
      totalMembers: totalCount[0]?.count || 0,
      activeMembers: activeCount[0]?.count || 0,
      totalRevenue: revenueResult[0]?.total || 0,
      newThisMonth: memberships.filter(m => {
        const created = new Date(m.signupDate);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,
      totalActive: activeCount[0]?.count || 0,
      totalExpired: (totalCount[0]?.count || 0) - (activeCount[0]?.count || 0),
    });
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return Response.json(
      { error: "Failed to fetch memberships" },
      { status: 500 }
    );
  }
}
