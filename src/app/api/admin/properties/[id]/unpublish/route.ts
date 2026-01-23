import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user || (session.user as any).role !== "admin") {
      return Response.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { id } = await params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      return Response.json({ error: "Invalid property ID" }, { status: 400 });
    }

    // Unpublish the property (set isPublished to false)
    await db
      .update(properties)
      .set({
        isPublished: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(properties.id, propertyId));

    console.log(`[ADMIN] Property ${propertyId} unpublished by ${session.user.email}`);

    return Response.json({ 
      success: true,
      message: "Property unpublished successfully" 
    });
  } catch (error) {
    console.error("Error unpublishing property:", error);
    return Response.json(
      { error: "Failed to unpublish property" },
      { status: 500 }
    );
  }
}
