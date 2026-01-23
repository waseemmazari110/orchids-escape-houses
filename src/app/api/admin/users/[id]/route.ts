import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user as userTable } from '../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists before deleting
    const userExists = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id))
      .limit(1);

    if (!userExists || userExists.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the user from database
    await db.delete(userTable).where(eq(userTable.id, id));

    console.log(`User ${id} deleted successfully from database`);

    return NextResponse.json(
      { success: true, message: 'User deleted successfully from database' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
