import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { crmContacts } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET all contacts with filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'owner' | 'guest'
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    let query = db.select().from(crmContacts);
    
    const contacts = await query;
    
    // Filter by type
    let filteredContacts = contacts;
    if (type) {
      filteredContacts = filteredContacts.filter(c => c.type === type);
    }
    
    // Filter by status
    if (status) {
      filteredContacts = filteredContacts.filter(c => c.status === status);
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = filteredContacts.filter(c => 
        c.email?.toLowerCase().includes(searchLower) || 
        c.firstName?.toLowerCase().includes(searchLower) ||
        c.lastName?.toLowerCase().includes(searchLower) ||
        c.businessName?.toLowerCase().includes(searchLower)
      );
    }
    
    return NextResponse.json(filteredContacts);
  } catch (error) {
    console.error('Failed to fetch CRM contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST create new contact (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const contactId = crypto.randomUUID();
    const contact = {
      id: contactId,
      type: body.type, // 'owner' | 'guest'
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      email: body.email,
      phone: body.phone || '',
      address: body.address || null,
      city: body.city || null,
      postcode: body.postcode || null,
      country: body.country || null,
      businessName: body.businessName || null,
      taxId: body.taxId || null,
      bankDetails: body.bankDetails || null,
      companyName: body.companyName || null,
      eventType: body.eventType || null,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: body.userId || null,
      notes: body.notes || null,
      lastContactedAt: null,
    };
    
    await db.insert(crmContacts).values(contact);
    
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Failed to create CRM contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
