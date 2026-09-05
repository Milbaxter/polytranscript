import { NextRequest, NextResponse } from 'next/server';
import { TranscribeError, transcribeUrl } from '../../../lib/transcribe';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = String(body.url || '').trim();
    const language = String(body.language || 'en');

    if (!url) {
      return NextResponse.json({ detail: 'URL is required.' }, { status: 400 });
    }

    const backend = process.env.BACKEND_URL;
    if (backend) {
      try {
        const resp = await fetch(`${backend.replace(/\/$/, '')}/api/v1/transcribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(req.headers.get('x-api-key') ? { 'X-API-Key': req.headers.get('x-api-key') as string } : {}),
          },
          body: JSON.stringify(body),
        });
        if (resp.ok) {
          return NextResponse.json(await resp.json());
        }
      } catch {
        // Fall through to the serverless pipeline
      }
    }

    const result = await transcribeUrl(url, language);
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof TranscribeError ? err.status : 500;
    return NextResponse.json(
      { detail: err?.message || 'Failed to process media' },
      { status }
    );
  }
}
