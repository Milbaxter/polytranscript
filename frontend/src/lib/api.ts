import { TranscriptResponse, SearchResponse, SponsorInfo, APIKeyInfo } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function transcribeMedia(
  url: string,
  options: {
    language?: string;
    include_chapters?: boolean;
    include_summary?: boolean;
    apiKey?: string;
  } = {}
): Promise<TranscriptResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.apiKey) {
    headers['X-API-Key'] = options.apiKey;
  }

  const res = await fetch(`${API_BASE}/api/v1/transcribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url,
      language: options.language || 'en',
      include_chapters: options.include_chapters ?? true,
      include_summary: options.include_summary ?? true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Transcription failed' }));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function getSponsorInfo(): Promise<SponsorInfo> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/sponsor`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return {
      enabled: true,
      text: '🚀 Sponsor this slot — Reach 100K+ AI builders & developers monthly',
      link: '/pricing#sponsor',
      badge: 'Featured Sponsor',
    };
  }
}

export async function generateApiKey(tier: string = 'starter'): Promise<APIKeyInfo> {
  const res = await fetch(`${API_BASE}/api/v1/keys/generate?tier=${tier}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate API key');
  return res.json();
}

export async function askMediaQuestion(
  url: string,
  question: string,
  transcriptText?: string
): Promise<{ answer: string; relevant_timestamps: Array<{ start: number; end: number; formatted_start: string; text: string }> }> {
  const res = await fetch(`${API_BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, question, transcript_text: transcriptText }),
  });
  if (!res.ok) throw new Error('Chat failed');
  return res.json();
}
