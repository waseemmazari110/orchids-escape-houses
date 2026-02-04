import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { crmEnquiries, crmContacts, crmProperties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    // Get authenticated user session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the owner's CRM contact record using their user ID
    const ownerContact = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.userId, session.user.id))
      .limit(1);

    if (!ownerContact || ownerContact.length === 0) {
      return Response.json({ enquiries: [] });
    }

    const ownerId = ownerContact[0].id;

    // Fetch all enquiries for this owner
    const enquiries = await db
      .select({
        id: crmEnquiries.id,
        propertyId: crmEnquiries.propertyId,
        guestName: crmEnquiries.guestName,
        guestEmail: crmEnquiries.guestEmail,
        guestPhone: crmEnquiries.guestPhone,
        message: crmEnquiries.message,
        status: crmEnquiries.status,
        createdAt: crmEnquiries.createdAt,
        propertyName: crmProperties.title,
        propertyLocation: crmProperties.location,
      })
      .from(crmEnquiries)
      .innerJoin(crmProperties, eq(crmEnquiries.propertyId, crmProperties.id))
      .where(eq(crmEnquiries.ownerId, ownerId))
      .orderBy(desc(crmEnquiries.createdAt));

    return Response.json({ enquiries });
  } catch (error) {
    console.error("[Owner Enquiries API] Error:", error);
    return Response.json(
      { error: "Failed to fetch enquiries" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // Get authenticated user session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { enquiryId, status } = await request.json();

    if (!enquiryId || !status) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the owner's CRM contact record
    const ownerContact = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.userId, session.user.id))
      .limit(1);

    if (!ownerContact || ownerContact.length === 0) {
      return Response.json(
        { error: "Owner not found" },
        { status: 404 }
      );
    }

    const ownerId = ownerContact[0].id;

    // Verify the enquiry belongs to this owner
    const enquiry = await db
      .select()
      .from(crmEnquiries)
      .where(eq(crmEnquiries.id, enquiryId))
      .limit(1);

    if (!enquiry || enquiry.length === 0 || enquiry[0].ownerId !== ownerId) {
      return Response.json(
        { error: "Enquiry not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update enquiry status
    await db
      .update(crmEnquiries)
      .set({ status })
      .where(eq(crmEnquiries.id, enquiryId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Owner Enquiries Update API] Error:", error);
    return Response.json(
      { error: "Failed to update enquiry" },
      { status: 500 }
    );
  }
}
