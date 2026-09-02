import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return NextResponse.json({ detail: 'BACKEND_URL is not configured.' }, { status: 503 });
  }
  try {
    const body = await req.json();
    const resp = await fetch(`${backend.replace(/\/$/, '')}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({ detail: 'Chat failed' }));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || 'Backend unreachable' }, { status: 503 });
  }
}
