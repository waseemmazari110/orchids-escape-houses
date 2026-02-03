import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { crmEnquiries, crmContacts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET enquiries with filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    
    let enquiries = await db.select().from(crmEnquiries);
    
    // Filter by status
    if (status) {
      enquiries = enquiries.filter(e => e.status === status);
    }
    
    // Filter by owner (for owner dashboard)
    if (ownerId) {
      enquiries = enquiries.filter(e => e.ownerId === ownerId);
    }
    
    // Sort by created date (newest first)
    enquiries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Limit results
    enquiries = enquiries.slice(0, limit);
    
    return NextResponse.json(enquiries);
  } catch (error) {
    console.error('Failed to fetch CRM enquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 });
  }
}

// PUT update enquiry status
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enquiryId, status, notes } = body;

    if (!enquiryId || !status) {
      return NextResponse.json({ error: 'Enquiry ID and status required' }, { status: 400 });
    }

    const updateData: any = {
      status,
      lastUpdatedAt: new Date().toISOString(),
    };

    if (status === 'booked') {
      updateData.convertedToBooking = true;
      updateData.closedAt = new Date().toISOString();
    }

    if (notes) {
      updateData.internalNotes = notes;
    }

    await db
      .update(crmEnquiries)
      .set(updateData)
      .where(eq(crmEnquiries.id, enquiryId));

    return NextResponse.json({ success: true, message: 'Enquiry updated' });
  } catch (error) {
    console.error('Failed to update CRM enquiry:', error);
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 });
  }
}
