import type { TranscriptResponse } from '../types';
import { wordCount } from './segments';
import { extractYouTubeId, transcribeYouTube } from './youtube';
import { isTikTokUrl, transcribeTikTok } from './tiktok';
import { transcribeAudioOrPodcast } from './podcast';
import { TranscribeError, type ExtractedTranscript } from './types';

export { TranscribeError };

export async function transcribeUrl(url: string, language = 'en'): Promise<TranscriptResponse> {
  const started = Date.now();
  const extracted = await dispatch(url, language);
  const full_text = extracted.segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim();
  if (!full_text) {
    throw new TranscribeError('Transcription produced no text.');
  }

  return {
    metadata: extracted.metadata,
    language: extracted.language,
    full_text,
    segments: extracted.segments,
    source_type: extracted.source_type,
    word_count: wordCount(full_text),
    processing_time_ms: Date.now() - started,
    created_at: new Date().toISOString(),
  };
}

async function dispatch(url: string, language: string): Promise<ExtractedTranscript> {
  if (extractYouTubeId(url)) {
    try {
      return await transcribeYouTube(url, language);
    } catch (err) {
      const fallback = await tryYtdlpCaptions(url, language);
      if (fallback) return fallback;
      throw err;
    }
  }
  if (isTikTokUrl(url)) {
    return transcribeTikTok(url, language);
  }
  return transcribeAudioOrPodcast(url, language);
}

async function tryYtdlpCaptions(url: string, language: string): Promise<ExtractedTranscript | null> {
  if (process.env.DISABLE_YTDLP === '1') return null;
  try {
    const { spawn } = await import('child_process');
    const json = await new Promise<string>((resolve, reject) => {
      const proc = spawn(
        'yt-dlp',
        ['--skip-download', '--no-warnings', '-j', url],
        { timeout: 25000 }
      );
      let out = '';
      let err = '';
      proc.stdout.on('data', (d) => (out += d));
      proc.stderr.on('data', (d) => (err += d));
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0 && out.trim()) resolve(out);
        else reject(new Error(err || `yt-dlp exited ${code}`));
      });
    });

    const info = JSON.parse(json);
    const tracks =
      info.subtitles?.[language] ||
      info.subtitles?.en ||
      info.automatic_captions?.[language] ||
      info.automatic_captions?.en ||
      info.automatic_captions?.['en-orig'] ||
      [];
    const json3 = tracks.find((t: any) => t.ext === 'json3') || tracks[0];
    if (!json3?.url) return null;

    const { parseJson3 } = await import('./segments');
    const resp = await fetch(json3.url);
    if (!resp.ok) return null;
    const segments = parseJson3(await resp.json());
    if (segments.length === 0) return null;

    return {
      metadata: {
        title: info.title || 'YouTube Video',
        author: info.uploader || info.channel || 'YouTube Creator',
        duration_seconds: info.duration,
        thumbnail_url: info.thumbnail,
        view_count: info.view_count,
        platform: 'youtube',
        url: info.webpage_url || url,
      },
      language: language === 'auto' ? 'en' : language,
      segments,
      source_type: 'youtube_ytdlp_captions',
    };
  } catch {
    return null;
  }
}
