import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return NextResponse.json({ error: 'BACKEND_URL is not configured.' }, { status: 503 });
  }
  const signature = req.headers.get('stripe-signature') || '';
  const raw = await req.text();
  try {
    const resp = await fetch(`${backend.replace(/\/$/, '')}/api/v1/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json',
      },
      body: raw,
    });
    const data = await resp.json().catch(() => ({ received: false }));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Webhook proxy failed' }, { status: 503 });
  }
}
