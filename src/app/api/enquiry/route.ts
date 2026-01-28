import { NextRequest, NextResponse } from "next/server";
import { checkForSpam, type SpamCheckData } from "@/lib/spam-protection";
import { sendEnquiryEmail } from "@/lib/email";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { enquiries, properties } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      checkin,
      checkout,
      groupSize,
      occasion,
      addons,
      message,
      propertyTitle,
      propertySlug,
      type = "property",
      recipientEmail: manualRecipient,
      honeypot,
      timestamp,
      challenge,
      userInteraction
    } = body;

    // Validate required fields
    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      );
    }

    // Get session
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    // Rate limiting by email - temporarily disabled due to schema mismatch
    // TODO: Re-enable once database schema is updated
    /*
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentEnquiries = await db
      .select()
      .from(enquiries)
      .where(and(
        eq(enquiries.guestEmail, email),
        gt(enquiries.createdAt, oneHourAgo)
      ));

    if (recentEnquiries.length >= 5) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    */

    // Run comprehensive spam check
    const spamCheckData: SpamCheckData = {
      email,
      honeypot,
      timestamp,
      challenge,
      userInteraction
    };

    const spamCheck = await checkForSpam(request, spamCheckData);

    if (spamCheck.isSpam) {
      console.log(`🚫 Enquiry form spam blocked: ${spamCheck.reason}`);
      return NextResponse.json(
        { error: spamCheck.reason || 'Submission rejected' },
        { status: 429 }
      );
    }

    // Determine recipient email
    let recipientEmail = manualRecipient || "info@groupescapehouses.co.uk";
    let propertyId = null;

    if (type === "property" && propertySlug) {
      const propertyResults = await db
        .select({
          id: properties.id,
          status: properties.status,
          ownerContact: properties.ownerContact,
        })
        .from(properties)
        .where(eq(properties.slug, propertySlug))
        .limit(1);
      
      if (propertyResults.length > 0) {
        const property = propertyResults[0];
        // Block enquiries for unpaid/inactive listings
        if (property.status !== 'Active' && property.status !== 'live') {
          return NextResponse.json(
            { error: 'This listing is currently inactive and cannot receive enquiries.' },
            { status: 403 }
          );
        }
        
        propertyId = property.id;
        if (property.ownerContact) {
          recipientEmail = property.ownerContact;
        }
      }
    }

    // Store enquiry record
    const [firstName, ...lastNameParts] = (name || 'Guest').split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    await db.insert(enquiries).values({
      firstName,
      lastName,
      email,
      phone: phone || null,
      propertyId,
      subject: propertyTitle ? `Enquiry for ${propertyTitle}` : `General Enquiry: ${type}`,
      message: `${message}\n\nDates: ${checkin} to ${checkout}\nGroup Size: ${groupSize}\nOccasion: ${occasion}\nAdd-ons: ${addons?.join(', ')}`,
      enquiryType: type === 'property' ? 'property' : 'general',
      checkInDate: checkin || null,
      checkOutDate: checkout || null,
      numberOfGuests: groupSize || null,
      occasion: occasion || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'new',
    });

    // Send email notification
    try {
      await sendEnquiryEmail({
        name,
        email,
        phone,
        checkin,
        checkout,
        groupSize,
        occasion,
        addons,
        message,
        propertyTitle,
        propertySlug,
        recipientEmail
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    return NextResponse.json(
      { 
        message: 'Enquiry sent successfully! Our team will get back to you within 24 hours.',
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Enquiry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
