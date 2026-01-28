/**
 * GET /api/membership-packs
 * 
 * Get all active membership packs with pricing and features
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { membershipPacks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const packs = await db
      .select()
      .from(membershipPacks)
      .where(eq(membershipPacks.isActive, true))
      .orderBy(membershipPacks.displayOrder);

    // Parse JSON features for each pack
    const packsWithFeatures = packs.map(pack => ({
      ...pack,
      features: typeof pack.features === 'string' 
        ? JSON.parse(pack.features) 
        : pack.features,
      // Calculate totals including VAT
      annualTotalWithVat: pack.annualPrice * (1 + pack.vatRate! / 100),
      monthlyTotalWithVat: pack.monthlyPrice * (1 + pack.vatRate! / 100),
      // Calculate savings
      savingsByAnnual: (pack.monthlyPrice * 12) - pack.annualPrice,
    }));

    return NextResponse.json({
      success: true,
      packs: packsWithFeatures,
    });
  } catch (error) {
    console.error('Error fetching membership packs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch membership packs' },
      { status: 500 }
    );
  }
}
