import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { properties, user } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    console.log("[Admin Properties] Session:", session?.user);
    console.log("[Admin Properties] Role:", (session?.user as any)?.role);
    
    if (!session?.user || (session.user as any).role !== "admin") {
      return Response.json({ 
        error: "Unauthorized - Admin access required",
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          role: (session?.user as any)?.role
        }
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    // Get property status counts
    const pendingCount = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.status, "pending"));

    const approvedCount = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.status, "approved"));

    const rejectedCount = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.status, "rejected"));

    const allCount = await db.select({ count: count() }).from(properties);

    const statusCounts = {
      pending: pendingCount[0]?.count || 0,
      approved: approvedCount[0]?.count || 0,
      rejected: rejectedCount[0]?.count || 0,
      all: allCount[0]?.count || 0,
    };

    // Fetch properties based on status filter
    let propertiesQuery = db
      .select({
        id: properties.id,
        title: properties.title,
        slug: properties.slug,
        location: properties.location,
        region: properties.region,
        status: properties.status,
        ownerId: properties.ownerId,
        featured: properties.featured,
        isPublished: properties.isPublished,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
        heroImage: properties.heroImage,
        sleepsMin: properties.sleepsMin,
        sleepsMax: properties.sleepsMax,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        priceFromMidweek: properties.priceFromMidweek,
        priceFromWeekend: properties.priceFromWeekend,
        ownerName: user.name,
        ownerEmail: user.email,
      })
      .from(properties)
      .leftJoin(user, eq(properties.ownerId, user.id))
      .orderBy(desc(properties.createdAt))
      .limit(limit);

    // Apply status filter
    if (statusParam && statusParam !== "all") {
      propertiesQuery = propertiesQuery.where(eq(properties.status, statusParam as any));
    }

    const propertiesData = await propertiesQuery;

    return Response.json({ 
      properties: propertiesData,
      statusCounts 
    });
  } catch (error) {
    console.error("Error fetching property status:", error);
    return Response.json(
      { error: "Failed to fetch property status" },
      { status: 500 }
    );
  }
}
