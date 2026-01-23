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

    const body = await request.json();
    const rejectionReason = body.rejectionReason || "Not meeting our quality standards";

    // Update property status to rejected
    await db
      .update(properties)
      .set({
        status: "rejected",
        rejectionReason: rejectionReason,
        isPublished: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(properties.id, propertyId));

    console.log(`[ADMIN] Property ${propertyId} rejected by ${session.user.email}: ${rejectionReason}`);

    return Response.json({ 
      success: true,
      message: "Property rejected successfully" 
    });
  } catch (error) {
    console.error("Error rejecting property:", error);
    return Response.json(
      { error: "Failed to reject property" },
      { status: 500 }
    );
  }
}
