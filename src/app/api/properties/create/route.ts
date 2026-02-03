/**
 * POST /api/properties/create
 * 
 * Create a new property (draft state, no payment required)
 * Owners can create properties freely and select membership pack
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { properties } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { syncPropertyToCRM } from '@/lib/crm-sync';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is owner or admin
    if (session.user.role !== 'owner' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only property owners can create listings' },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const now = new Date().toISOString();

    const newProperty = await db.insert(properties).values({
      ownerId: session.user.id,
      title: body.title,
      slug: `${slug}-${Date.now()}`, // Ensure uniqueness
      propertyType: body.propertyType || null,
      location: body.location || '',
      addressLine1: body.addressLine1 || null,
      addressLine2: body.addressLine2 || null,
      city: body.city || null,
      county: body.county || null,
      postcode: body.postcode || null,
      country: body.country || 'United Kingdom',
      region: body.region || '',
      sleepsMin: body.sleepsMin || 1,
      sleepsMax: body.sleepsMax || 1,
      bedrooms: body.bedrooms || 1,
      bathrooms: body.bathrooms || 1,
      priceFromMidweek: body.priceFromMidweek || 0,
      priceFromWeekend: body.priceFromWeekend || 0,
      minimumStayNights: body.minimumStayNights || 1,
      description: body.description || '',
      houseRules: body.houseRules || null,
      checkInOut: body.checkInOut || null,
      heroImage: body.heroImage || '',
      heroVideo: body.heroVideo || null,
      floorplanURL: body.floorplanURL || null,
      images: body.images ? JSON.stringify(body.images) : null,
      amenities: body.amenities ? JSON.stringify(body.amenities) : null,
      mapLat: body.mapLat || null,
      mapLng: body.mapLng || null,
      
      // Membership pack selection (optional at creation)
      membershipPackId: body.membershipPackId || null,
      paymentFrequency: body.paymentFrequency || null,
      
      // Status fields
      status: 'draft',
      paymentStatus: 'unpaid',
      isPublished: false,
      
      // Timestamps
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Sync property to CRM (non-blocking)
    if (newProperty[0]) {
      syncPropertyToCRM(newProperty[0], session.user.id).catch(err => {
        console.log('⚠️ CRM property sync failed (non-critical):', err);
      });
    }

    return NextResponse.json({
      success: true,
      property: newProperty[0],
      message: 'Property created successfully. Complete payment to submit for approval.',
    });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
