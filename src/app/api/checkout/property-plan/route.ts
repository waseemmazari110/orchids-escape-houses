import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { getPlanPriceId, PLANS, PlanId } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, propertyId, propertyTitle } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const plan = PLANS[planId as PlanId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get the origin from request headers
    const headersList = await headers();
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Get the Stripe price ID for this plan (yearly by default)
    const priceId = getPlanPriceId(planId as PlanId, 'yearly');

    // Create Stripe checkout session for property-specific plan
    const metadata: Record<string, string> = {
      userId: session.user.id,
      planId,
      type: 'property_plan',
    };

    // If propertyId exists, add it to metadata (for existing property plan purchase)
    if (propertyId) {
      metadata.propertyId = propertyId.toString();
    }

    const propertyDisplay = propertyTitle || (propertyId ? `Property #${propertyId}` : 'New Property');

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: session.user.email,
      metadata,
      success_url: propertyId 
        ? `${origin}/owner-dashboard?payment=success&propertyId=${propertyId}`
        : `${origin}/owner/properties/new?payment=success&planId=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: propertyId
        ? `${origin}/choose-plan?propertyId=${propertyId}&canceled=true`
        : `${origin}/choose-plan?canceled=true`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('Property plan checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
