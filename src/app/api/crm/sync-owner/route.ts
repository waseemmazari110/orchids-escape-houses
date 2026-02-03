import { NextRequest, NextResponse } from 'next/server';
import { syncOwnerToCRM } from '@/lib/crm-sync';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sync the logged-in user to CRM
    const userData = {
      email: session.user.email,
      name: session.user.name || '',
      firstName: (session.user as any).firstName || session.user.name?.split(' ')[0] || '',
      lastName: (session.user as any).lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
      phone: (session.user as any).phone || '',
      phoneNumber: (session.user as any).phoneNumber || '',
      companyName: (session.user as any).companyName || '',
      businessName: (session.user as any).businessName || '',
    };
    
    const contactId = await syncOwnerToCRM(session.user.id, userData);

    if (contactId) {
      return NextResponse.json({ 
        success: true, 
        contactId: typeof contactId === 'string' ? contactId : contactId.id,
        message: 'Owner synced to CRM successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to sync owner to CRM' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ CRM sync API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
