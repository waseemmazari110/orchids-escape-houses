import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, user as userTable } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Check if user is admin/owner setup user
    if (!session?.user || session.user.email !== "ali@example.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ali user ID
    const aliUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, "ali@example.com"));

    if (!aliUsers.length) {
      return NextResponse.json(
        { error: "User ali@example.com not found" },
        { status: 404 }
      );
    }

    const aliId = aliUsers[0].id;

    // Get all published properties
    const allProperties = await db.select().from(properties);

    // Assign first 5 published properties to ali
    const propertiesToAssign = allProperties
      .filter((p) => p.isPublished === 1)
      .slice(0, 5);

    for (const prop of propertiesToAssign) {
      await db
        .update(properties)
        .set({ ownerId: aliId })
        .where(eq(properties.id, prop.id));
    }

    // Get updated properties
    const assignedProps = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, aliId));

    return NextResponse.json({
      success: true,
      message: `Assigned ${propertiesToAssign.length} properties to ali`,
      totalAssigned: assignedProps.length,
      properties: assignedProps.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
      })),
    });
  } catch (error) {
    console.error("Error assigning properties:", error);
    return NextResponse.json(
      { error: "Failed to assign properties" },
      { status: 500 }
    );
  }
}
