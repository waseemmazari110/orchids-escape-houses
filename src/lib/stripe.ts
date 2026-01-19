import Stripe from 'stripe';

// Use TEST key by default, only use LIVE in production deployment
// Check VERCEL_ENV or NODE_ENV to determine if we're in production
const isProduction = process.env.VERCEL_ENV === 'production' || process.env.DEPLOYMENT_ENV === 'production';
const stripeKey = isProduction
  ? process.env.STRIPE_LIVE_KEY 
  : (process.env.STRIPE_TEST_KEY || process.env.STRIPE_TESTMODE_KEY);

if (!stripeKey) {
  throw new Error('Stripe API Key is missing');
}

console.log(`[Stripe] Using ${isProduction ? 'LIVE' : 'TEST'} mode`);

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-10-29.clover',
});
