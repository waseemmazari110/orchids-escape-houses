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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    // Get owner's properties
    let conditions: any[] = [eq(properties.ownerId, userId)];

    if (status && status !== "all") {
      conditions.push(eq(properties.status, status));
    }

    const ownerProperties = await db
      .select()
      .from(properties)
      .where(and(...conditions));

    return NextResponse.json({ properties: ownerProperties });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
