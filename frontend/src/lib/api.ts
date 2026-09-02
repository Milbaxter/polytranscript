import { TranscriptResponse, SponsorInfo, APIKeyInfo } from './types';

export async function transcribeMedia(
  url: string,
  options: {
    language?: string;
    apiKey?: string;
  } = {}
): Promise<TranscriptResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.apiKey) {
    headers['X-API-Key'] = options.apiKey;
  }

  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url,
      language: options.language || 'en',
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
    const res = await fetch('/api/sponsor');
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
  const res = await fetch(`/api/keys/generate?tier=${tier}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate API key');
  return res.json();
}
