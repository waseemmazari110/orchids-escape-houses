import Stripe from 'stripe';

// Only use LIVE key if explicitly enabled
// Default to TEST key for safety
// Set USE_STRIPE_LIVE=true in Vercel production environment variables to enable live mode
const useStripeLive = process.env.USE_STRIPE_LIVE === 'true';

// Prefer TEST key, fallback to LIVE only if explicitly enabled
const stripeKey = useStripeLive
  ? process.env.STRIPE_LIVE_KEY 
  : (process.env.STRIPE_TEST_KEY || process.env.STRIPE_LIVE_KEY);

if (!stripeKey) {
  throw new Error(`Stripe API Key is missing. Using ${useStripeLive ? 'LIVE' : 'TEST'} mode.`);
}

// Log which key is being used (without exposing the full key)
const keyPrefix = stripeKey.startsWith('sk_live') ? 'LIVE' : 'TEST';
console.log(`[Stripe] Using ${useStripeLive ? 'LIVE (explicit)' : 'TEST (default)'} mode - Key type: ${keyPrefix}`);

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-10-29.clover',
});
