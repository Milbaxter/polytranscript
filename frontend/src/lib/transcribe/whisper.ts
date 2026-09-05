import type { TranscriptSegment } from '../types';
import { decorateSegments } from './segments';
import { TranscribeError } from './types';

const MAX_BYTES = 24 * 1024 * 1024;

export function hasWhisperCredentials(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
}

export async function transcribeAudioBuffer(
  audio: ArrayBuffer,
  filename: string,
  language: string
): Promise<{ text: string; segments: TranscriptSegment[]; source_type: string }> {
  if (audio.byteLength === 0) {
    throw new TranscribeError('Downloaded audio was empty.');
  }
  if (audio.byteLength > MAX_BYTES) {
    throw new TranscribeError(
      `Audio is too large for serverless transcription (${Math.round(audio.byteLength / 1024 / 1024)}MB). Use a shorter clip or the FastAPI backend.`
    );
  }

  const groq = process.env.GROQ_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  if (!groq && !openai) {
    throw new TranscribeError(
      'This source needs speech-to-text. Set GROQ_API_KEY or OPENAI_API_KEY on the server (Vercel env), then retry.'
    );
  }

  if (groq) {
    try {
      return {
        ...(await callWhisperApi(
          'https://api.groq.com/openai/v1/audio/transcriptions',
          groq,
          'whisper-large-v3',
          audio,
          filename,
          language
        )),
        source_type: 'groq_whisper',
      };
    } catch (err) {
      if (!openai) throw err;
    }
  }

  return {
    ...(await callWhisperApi(
      'https://api.openai.com/v1/audio/transcriptions',
      openai as string,
      'whisper-1',
      audio,
      filename,
      language
    )),
    source_type: 'openai_whisper',
  };
}

export async function downloadMedia(url: string, headers: Record<string, string> = {}): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const resp = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      ...headers,
    },
    redirect: 'follow',
  });
  if (!resp.ok) {
    throw new TranscribeError(`Failed to download media (${resp.status}).`, 502);
  }
  const buffer = await resp.arrayBuffer();
  const pathname = new URL(resp.url || url).pathname;
  const filename = pathname.split('/').filter(Boolean).pop() || 'audio.mp3';
  return { buffer, filename };
}

async function callWhisperApi(
  endpoint: string,
  apiKey: string,
  model: string,
  audio: ArrayBuffer,
  filename: string,
  language: string
): Promise<{ text: string; segments: TranscriptSegment[] }> {
  const form = new FormData();
  const blob = new Blob([audio]);
  form.append('file', blob, filename);
  form.append('model', model);
  form.append('response_format', 'verbose_json');
  if (language && language !== 'auto') {
    form.append('language', language);
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new TranscribeError(`Whisper API failed (${resp.status}): ${detail.slice(0, 240)}`, 502);
  }

  const data = await resp.json();
  const text = String(data.text || '').trim();
  const segments: TranscriptSegment[] = decorateSegments(
    (data.segments || []).map((s: any) => ({
      start: Number(s.start || 0),
      end: Number(s.end || 0),
      text: String(s.text || '').trim(),
    })).filter((s: TranscriptSegment) => s.text)
  );

  if (!text && segments.length === 0) {
    throw new TranscribeError('Whisper returned an empty transcript.');
  }

  return { text, segments };
}
