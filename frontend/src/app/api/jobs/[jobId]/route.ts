import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ jobId: string }> | { jobId: string } }) {
  const params = await Promise.resolve(ctx.params);
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return NextResponse.json({ detail: 'BACKEND_URL is not configured.' }, { status: 503 });
  }
  try {
    const resp = await fetch(`${backend.replace(/\/$/, '')}/api/v1/jobs/${encodeURIComponent(params.jobId)}`);
    const data = await resp.json().catch(() => ({ detail: 'Job lookup failed' }));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || 'Backend unreachable' }, { status: 503 });
  }
}
