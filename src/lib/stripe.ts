import Stripe from 'stripe';

// Determine Stripe mode based on explicit environment variable or Vercel environment
// Only use LIVE key if explicitly enabled via USE_STRIPE_LIVE=true (set in Vercel production env vars)
// or if VERCEL_ENV is production AND USE_STRIPE_LIVE is not explicitly set to false
const useStripeLive = process.env.USE_STRIPE_LIVE === 'true';
const isProduction = process.env.VERCEL_ENV === 'production';
const shouldUseLive = useStripeLive || (isProduction && process.env.USE_STRIPE_LIVE !== 'false');

const stripeKey = shouldUseLive
  ? process.env.STRIPE_LIVE_KEY 
  : (process.env.STRIPE_TEST_KEY || process.env.STRIPE_TESTMODE_KEY);

if (!stripeKey) {
  throw new Error('Stripe API Key is missing');
}

console.log(`[Stripe] Using ${shouldUseLive ? 'LIVE' : 'TEST'} mode`);

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-10-29.clover',
});
