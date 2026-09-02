import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
const APP_URL = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://polytranscript.com').replace(/\/$/, '');

type Cycle = 'monthly' | 'yearly';

function priceIdFor(tier: string, cycle: Cycle): string | undefined {
  const envKey = `STRIPE_PRICE_${tier.toUpperCase()}_${cycle.toUpperCase()}`;
  const fromEnv = process.env[envKey];
  if (fromEnv) return fromEnv;
  if (cycle === 'monthly') {
    const legacy: Record<string, string> = {
      starter: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_1UB8uhCr8oInGVYkVVsC27db',
      pro: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1UB8ujCr8oInGVYk64rfLsJk',
      scale: process.env.STRIPE_PRICE_SCALE_MONTHLY || 'price_1UB8ukCr8oInGVYk7rgDj98D',
      sponsor: process.env.STRIPE_PRICE_SPONSOR || 'price_1UB8umCr8oInGVYkHqQcO6Ig',
    };
    return legacy[tier];
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tier = (body.tier || 'pro') as string;
    const billingCycle: Cycle = body.billingCycle === 'yearly' ? 'yearly' : 'monthly';

    if (!['starter', 'pro', 'scale', 'sponsor'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const priceId = priceIdFor(tier, billingCycle);
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Missing Stripe Price ID for ${tier} ${billingCycle}. Set STRIPE_PRICE_${tier.toUpperCase()}_${billingCycle.toUpperCase()} in the environment. Yearly checkout cannot reuse monthly Price IDs.`,
        },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is not configured. Cannot start checkout.' },
        { status: 503 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { tier, billing_cycle: billingCycle },
      success_url: `${APP_URL}/api-keys?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 502 });
  }
}
