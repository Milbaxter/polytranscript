import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ detail: 'session_id is required' }, { status: 400 });
  }
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return NextResponse.json({ detail: 'BACKEND_URL is not configured.' }, { status: 503 });
  }
  try {
    const resp = await fetch(`${backend.replace(/\/$/, '')}/api/v1/keys/by-session/${encodeURIComponent(sessionId)}`);
    const data = await resp.json().catch(() => ({ detail: 'Lookup failed' }));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ detail: `Key service unreachable: ${e.message}` }, { status: 503 });
  }
}
