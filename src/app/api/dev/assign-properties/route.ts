import { db } from "@/db";
import { properties, user as userTable } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get all users
    const allUsers = await db.select().from(userTable);

    // Get all published properties
    const allProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.isPublished, 1));

    // Filter to owners
    const owners = allUsers.filter((u) => (u as any).role === "owner");

    if (owners.length === 0) {
      return NextResponse.json(
        { message: "No owners found", properties: 0, owners: 0 },
        { status: 200 }
      );
    }

    // Distribute properties evenly among owners
    const propertiesPerOwner = Math.floor(allProperties.length / owners.length);
    const assignedCount: { [key: string]: number } = {};

    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      const start = i * propertiesPerOwner;
      const end =
        i === owners.length - 1
          ? allProperties.length
          : (i + 1) * propertiesPerOwner;
      const ownerProperties = allProperties.slice(start, end);

      assignedCount[owner.email] = ownerProperties.length;

      for (const prop of ownerProperties) {
        await db
          .update(properties)
          .set({ ownerId: owner.id })
          .where(eq(properties.id, prop.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Properties assigned to owners",
      owners: owners.map((o) => ({
        name: o.name,
        email: o.email,
        properties: assignedCount[o.email] || 0,
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
