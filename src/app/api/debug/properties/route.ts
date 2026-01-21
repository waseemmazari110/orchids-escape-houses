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

    const allProperties = await db.select().from(properties);
    
    return NextResponse.json({
      currentUserId: session?.user?.id,
      currentUserEmail: session?.user?.email,
      total: allProperties.length,
      properties: allProperties.map(p => ({
        id: p.id,
        title: p.title,
        ownerId: p.ownerId,
        ownerIdMatches: p.ownerId === session?.user?.id,
        isPublished: p.isPublished,
        status: p.status,
        slug: p.slug
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
