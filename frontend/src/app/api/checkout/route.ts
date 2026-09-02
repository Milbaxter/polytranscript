import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const PRICE_MAP: Record<string, string> = {
  starter: 'price_1UB8uhCr8oInGVYkVVsC27db',
  pro: 'price_1UB8ujCr8oInGVYk64rfLsJk',
  scale: 'price_1UB8ukCr8oInGVYk7rgDj98D',
  sponsor: 'price_1UB8umCr8oInGVYkHqQcO6Ig',
};

const LINK_MAP: Record<string, string> = {
  starter: 'https://buy.stripe.com/3cI00i47Ad0K7qP5re2880k',
  pro: 'https://buy.stripe.com/9B6cN48nQaSC9yXaLy2880l',
  scale: 'https://buy.stripe.com/dRm14m1Zsf8S5iH1aY2880m',
  sponsor: 'https://buy.stripe.com/5kQbJ0eMeaSC8uTcTG2880n',
};

export async function POST(req: NextRequest) {
  let tier = 'pro';
  try {
    const body = await req.json();
    tier = body.tier || 'pro';
    const priceId = PRICE_MAP[tier];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ url: LINK_MAP[tier] });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `https://polytranscript.com/api-keys?tier=${tier}&paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://polytranscript.com/pricing`,
    });

    return NextResponse.json({ url: session.url || LINK_MAP[tier] });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ url: LINK_MAP[tier] || 'https://polytranscript.com/pricing' });
  }
}
