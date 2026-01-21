import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties } from "../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      console.log("[DEBUG] No session user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[DEBUG] Fetching properties for user:", userId);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    // Get owner's properties - ONLY filter by this user's ID
    const conditions: any[] = [eq(properties.ownerId, userId)];

    if (status && status !== "all") {
      conditions.push(eq(properties.status, status));
    }

    const ownerProperties = await db
      .select()
      .from(properties)
      .where(and(...conditions));

    console.log("[DEBUG] Found", ownerProperties.length, "properties for user", userId);
    ownerProperties.forEach(p => {
      console.log(`[DEBUG] Property: ${p.title} - ownerId: ${p.ownerId}`);
    });
    // Convert snake_case to camelCase and ensure proper boolean conversion for isPublished
    const formattedProperties = ownerProperties.map(p => ({
      ...p,
      isPublished: Boolean(p.isPublished),
      ownerId: p.ownerId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      heroImage: p.heroImage,
      heroVideo: p.heroVideo,
      floorplanUrl: p.floorplanUrl,
      mapLat: p.mapLat,
      mapLng: p.mapLng,
      ownerContact: p.ownerContact,
      houseRules: p.houseRules,
      checkInOut: p.checkInOut,
      icalUrl: p.icalUrl,
      priceFromMidweek: p.priceFromMidweek,
      priceFromWeekend: p.priceFromWeekend,
      sleepsMin: p.sleepsMin,
      sleepsMax: p.sleepsMax,
    }));

    return NextResponse.json({ properties: formattedProperties });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
