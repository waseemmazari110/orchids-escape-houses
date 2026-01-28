/**
 * POST /api/properties/checkout
 * 
 * Create Stripe checkout session for one or multiple properties
 * Supports both annual and monthly payment frequencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { properties, membershipPacks } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, inArray, or } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-10-29.clover',
  });
  
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

    const body = await req.json();
    const { propertyIds } = body as { propertyIds: number[] };

    if (!propertyIds || propertyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No properties selected' },
        { status: 400 }
      );
    }

    // Fetch properties with membership packs
    const userProperties = await db
      .select({
        property: properties,
        pack: membershipPacks,
      })
      .from(properties)
      .leftJoin(membershipPacks, eq(properties.membershipPackId, membershipPacks.id))
      .where(
        and(
          inArray(properties.id, propertyIds),
          eq(properties.ownerId, session.user.id),
          or(
            eq(properties.status, 'draft'),
            eq(properties.status, 'expired')
          )
        )
      );

    if (userProperties.length !== propertyIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some properties are invalid or already paid' },
        { status: 400 }
      );
    }

    // Validate all properties have membership pack selected
    for (const { property, pack } of userProperties) {
      if (!pack) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Property "${property.title}" does not have a membership pack selected` 
          },
          { status: 400 }
        );
      }
    }

    // Create line items for Stripe checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const metadata: Record<string, string> = {
      owner_id: session.user.id,
      property_ids: JSON.stringify(propertyIds),
      type: 'property_membership',
    };

    for (const { property, pack } of userProperties) {
      if (!pack) continue;

      const isAnnual = property.paymentFrequency === 'annual';
      const basePrice = isAnnual ? pack.annualPrice : pack.monthlyPrice;
      const vatAmount = basePrice * ((pack.vatRate || 20) / 100);
      const totalPrice = basePrice + vatAmount;

      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${pack.name} Membership - ${property.title}`,
            description: `${isAnnual ? 'Annual' : 'Monthly (12 months)'} membership for ${property.title}`,
            metadata: {
              property_id: property.id.toString(),
              pack_id: pack.id,
              payment_frequency: property.paymentFrequency || 'annual',
            },
          },
          unit_amount: Math.round(totalPrice * 100), // Convert to pence
          ...(property.paymentFrequency === 'monthly' && {
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          }),
        },
        quantity: 1,
      });
    }

    // Determine checkout mode
    const hasMonthly = userProperties.some(
      ({ property }) => property.paymentFrequency === 'monthly'
    );
    const mode: Stripe.Checkout.SessionCreateParams.Mode = hasMonthly
      ? 'subscription'
      : 'payment';

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      mode,
      line_items: lineItems,
      metadata,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/properties`,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: {
            property_ids: JSON.stringify(propertyIds),
            owner_id: session.user.id,
          },
        },
      }),
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create checkout session' 
      },
      { status: 500 }
    );
  }
}
