import { NextRequest, NextResponse } from 'next/server';

interface Segment {
  start: number;
  end: number;
  text: string;
  formatted_start?: string;
}

function formatStart(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hours = Math.floor(mins / 60);
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function failClosed(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

/** Production never returns canned/demo transcript copy. */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const url = (body.url || '').trim();
    const language = body.language || 'en';

    if (!url) {
      return failClosed('URL is required.', 400);
    }

    const backend = process.env.BACKEND_URL;
    const apiKey = req.headers.get('x-api-key');

    if (backend) {
      try {
        const resp = await fetch(`${backend.replace(/\/$/, '')}/api/v1/transcribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-API-Key': apiKey } : {}),
          },
          body: JSON.stringify(body),
        });
        const data = await resp.json().catch(() => ({ detail: 'Backend returned a non-JSON error.' }));
        if (resp.status === 202) {
          return NextResponse.json(data, { status: 202 });
        }
        if (!resp.ok) {
          const detail = data.detail || data.error || 'Transcription backend failed.';
          const status = resp.status >= 500 ? 503 : resp.status === 401 || resp.status === 403 || resp.status === 429 ? resp.status : 502;
          return failClosed(typeof detail === 'string' ? detail : JSON.stringify(detail), status);
        }
        return NextResponse.json(data);
      } catch (e: any) {
        return failClosed(
          `Transcription backend unreachable (${backend}). Set BACKEND_URL to a running FastAPI instance. ${e?.message || ''}`.trim(),
          503
        );
      }
    }

    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (ytMatch) {
      const result = await handleYouTubeCaptions(ytMatch[1], url, language);
      if (!result) {
        return failClosed(
          'YouTube captions are unavailable and BACKEND_URL is not set. Whisper fallback requires the FastAPI backend.',
          503
        );
      }
      result.processing_time_ms = Date.now() - startTime;
      return NextResponse.json(result);
    }

    return failClosed(
      'BACKEND_URL is not configured. TikTok, podcast, and Whisper paths require the FastAPI backend. Set BACKEND_URL (docker-compose NEXT_PUBLIC_API_URL is unused by this route).',
      503
    );
  } catch (err: any) {
    return failClosed(err.message || 'Failed to process media', 500);
  }
}

async function handleYouTubeCaptions(videoId: string, _originalUrl: string, language: string) {
  let title = `YouTube Video (${videoId})`;
  let author = 'YouTube Creator';
  let thumbnail_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      title = oembed.title || title;
      author = oembed.author_name || author;
      thumbnail_url = oembed.thumbnail_url || thumbnail_url;
    }
  } catch {}

  const segments: Segment[] = [];
  try {
    const timedTextUrls = [
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${language}&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3`,
    ];

    for (const ttUrl of timedTextUrls) {
      const ttRes = await fetch(ttUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } });
      if (!ttRes.ok) continue;
      const data = await ttRes.json().catch(() => null);
      if (!data?.events || !Array.isArray(data.events)) continue;
      for (const ev of data.events) {
        if (!ev.segs) continue;
        const text = ev.segs.map((s: any) => s.utf8 || '').join('').replace(/\n/g, ' ').trim();
        if (text && text !== '\n') {
          const startSec = (ev.tStartMs || 0) / 1000;
          const durSec = (ev.dDurationMs || 2000) / 1000;
          segments.push({
            start: Math.round(startSec * 100) / 100,
            end: Math.round((startSec + durSec) * 100) / 100,
            text,
            formatted_start: formatStart(startSec),
          });
        }
      }
      if (segments.length > 0) break;
    }
  } catch (e) {
    console.warn('TimedText fetch failed:', e);
  }

  if (segments.length === 0) {
    return null;
  }

  const fullText = segments.map((s) => s.text).join(' ');
  return {
    metadata: {
      title,
      author,
      thumbnail_url,
      platform: 'youtube' as const,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    },
    language,
    full_text: fullText,
    segments,
    chapters: [],
    summary: null,
    source_type: 'youtube_timedtext',
    word_count: fullText.split(/\s+/).filter(Boolean).length,
    processing_time_ms: 0,
    created_at: new Date().toISOString(),
  };
}
