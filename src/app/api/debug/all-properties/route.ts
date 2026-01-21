import { NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allProperties = await db.select().from(properties);
    
    return NextResponse.json({
      currentUserId: session?.user?.id,
      currentUserEmail: session?.user?.email,
      total: allProperties.length,
      properties: allProperties
        .filter(p => p.ownerId === session?.user?.id)
        .map(p => ({
          id: p.id,
          title: p.title,
          ownerId: p.ownerId,
          status: p.status,
          statusLowercase: p.status?.toLowerCase(),
          isPublished: p.isPublished,
          isActive: p.status === 'Active' || p.status === 'active'
        })),
      statsCalculation: {
        activeCount: allProperties
          .filter(p => p.ownerId === session?.user?.id)
          .filter(p => p.status === 'Active' || p.status === 'active').length,
        allUserProperties: allProperties
          .filter(p => p.ownerId === session?.user?.id)
          .length
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
