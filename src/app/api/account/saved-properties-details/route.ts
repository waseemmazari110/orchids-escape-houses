import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { savedProperties, properties, propertyFeatures } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(`🔍 [API] GET Saved Properties Details: Fetching for user ${session.user.id}`);
    
    const saved = await db.query.savedProperties.findMany({
      where: eq(savedProperties.userId, session.user.id),
      columns: {
        propertyId: true,
      },
    });

    if (saved.length === 0) {
      console.log(`ℹ️ [API] No saved properties found`);
      return NextResponse.json({ properties: [] });
    }

    const savedIds = saved.map(s => s.propertyId);
    console.log(`✅ [API] Found ${savedIds.length} saved property IDs:`, savedIds);

    // Fetch properties separately - select specific columns to avoid corrupt JSON parsing
    const propertyDetails = await db
      .select({
        id: properties.id,
        title: properties.title,
        location: properties.location,
        slug: properties.slug,
        sleepsMax: properties.sleepsMax,
        bedrooms: properties.bedrooms,
        priceFromMidweek: properties.priceFromMidweek,
        heroImage: properties.heroImage,
      })
      .from(properties)
      .where(inArray(properties.id, savedIds));

    console.log(`✅ [API] Fetched ${propertyDetails.length} property details`);

    // Fetch features separately
    const allFeatures = await db
      .select()
      .from(propertyFeatures)
      .where(inArray(propertyFeatures.propertyId, savedIds));

    const featuresByProperty = new Map<number, string[]>();
    allFeatures.forEach(f => {
      if (!featuresByProperty.has(f.propertyId)) {
        featuresByProperty.set(f.propertyId, []);
      }
      featuresByProperty.get(f.propertyId)?.push(f.featureName);
    });

    // Format for PropertyCard - filter out properties with missing data
    const formattedProperties = propertyDetails
      .filter(p => {
        // Skip properties without required fields
        if (!p.heroImage || !p.title || !p.location) {
          console.warn(`⚠️ [API] Skipping property ${p.id}: missing required fields (image, title, or location)`);
          return false;
        }
        return true;
      })
      .map(p => ({
        id: p.id.toString(),
        title: p.title,
        location: p.location,
        sleeps: p.sleepsMax,
        bedrooms: p.bedrooms,
        priceFrom: Math.round(p.priceFromMidweek / 3), // Estimate per night
        image: p.heroImage,
        features: featuresByProperty.get(p.id)?.slice(0, 2) || [],
        slug: p.slug,
      }));

    console.log(`✅ [API] Returning ${formattedProperties.length} formatted properties`);
    return NextResponse.json({ properties: formattedProperties });
  } catch (error) {
    console.error("❌ Get saved properties details error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
