import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { crmContacts, crmProperties, crmEnquiries, crmMemberships } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET CRM dashboard stats
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data in parallel
    const [contacts, properties, enquiries, memberships] = await Promise.all([
      db.select().from(crmContacts),
      db.select().from(crmProperties),
      db.select().from(crmEnquiries),
      db.select().from(crmMemberships),
    ]);

    // Calculate stats
    const stats = {
      contacts: {
        total: contacts.length,
        owners: contacts.filter(c => c.type === 'owner').length,
        guests: contacts.filter(c => c.type === 'guest').length,
        active: contacts.filter(c => c.status === 'active').length,
      },
      properties: {
        total: properties.length,
        live: properties.filter(p => p.listingStatus === 'live').length,
        pending: properties.filter(p => p.listingStatus === 'pending_approval').length,
        draft: properties.filter(p => p.listingStatus === 'draft').length,
        totalViews: properties.reduce((sum, p) => sum + (p.viewCount || 0), 0),
        totalEnquiries: properties.reduce((sum, p) => sum + (p.enquiryCount || 0), 0),
      },
      enquiries: {
        total: enquiries.length,
        new: enquiries.filter(e => e.status === 'new').length,
        contacted: enquiries.filter(e => e.status === 'contacted').length,
        booked: enquiries.filter(e => e.status === 'booked').length,
        lost: enquiries.filter(e => e.status === 'lost').length,
        conversionRate: enquiries.length > 0 
          ? ((enquiries.filter(e => e.status === 'booked').length / enquiries.length) * 100).toFixed(2) 
          : '0.00',
      },
      memberships: {
        total: memberships.length,
        active: memberships.filter(m => m.status === 'active').length,
        expiringSoon: memberships.filter(m => m.status === 'expiring_soon').length,
        expired: memberships.filter(m => m.status === 'expired').length,
        bronze: memberships.filter(m => m.planTier === 'bronze').length,
        silver: memberships.filter(m => m.planTier === 'silver').length,
        gold: memberships.filter(m => m.planTier === 'gold').length,
      },
      recentActivity: {
        recentEnquiries: enquiries
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10),
        recentContacts: contacts
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10),
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch CRM stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
