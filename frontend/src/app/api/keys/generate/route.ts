import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = (searchParams.get('tier') || 'free').toLowerCase();

  if (tier !== 'free') {
    return NextResponse.json(
      {
        detail: 'Paid API keys are issued only after a verified Stripe checkout webhook. Generate a free key or complete payment on /pricing.',
      },
      { status: 403 }
    );
  }

  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return NextResponse.json(
      { detail: 'BACKEND_URL is not configured. Free keys must be minted by the FastAPI key store.' },
      { status: 503 }
    );
  }

  try {
    const resp = await fetch(`${backend.replace(/\/$/, '')}/api/v1/keys/generate?tier=free`, { method: 'POST' });
    const data = await resp.json().catch(() => ({ detail: 'Backend key mint failed' }));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ detail: `Key service unreachable: ${e.message}` }, { status: 503 });
  }
}
