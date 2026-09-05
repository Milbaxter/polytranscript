import { parseJson3, parseSrv3Xml, parseVtt } from './segments';
import { downloadMedia, hasWhisperCredentials, transcribeAudioBuffer } from './whisper';
import { TranscribeError, type ExtractedTranscript } from './types';
import type { TranscriptSegment } from '../types';

const TIKTOK_RE =
  /(?:https?:\/\/)?(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\//i;

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export function isTikTokUrl(url: string): boolean {
  return TIKTOK_RE.test(url);
}

export async function transcribeTikTok(url: string, language: string): Promise<ExtractedTranscript> {
  const page = await loadTikTokPage(url);
  const item = page.item;
  const video = item?.video || {};
  const author = item?.author || {};

  const metadata = {
    title: String(item?.desc || page.oembed?.title || 'TikTok Video').slice(0, 180),
    author: String(author.uniqueId || author.nickname || page.oembed?.author_name || 'TikTok Creator'),
    duration_seconds: video.duration ? Number(video.duration) : undefined,
    thumbnail_url: video.cover || video.originCover || page.oembed?.thumbnail_url,
    platform: 'tiktok' as const,
    url,
    description: item?.desc,
  };

  const captionUrl = pickTikTokCaptionUrl(video, language);
  if (captionUrl) {
    const segments = await downloadTikTokCaptions(captionUrl);
    if (segments.length > 0) {
      return {
        metadata,
        language,
        segments,
        source_type: 'tiktok_captions',
      };
    }
  }

  const mediaUrl = video.playAddr || video.downloadAddr;
  if (!mediaUrl) {
    throw new TranscribeError(
      'This TikTok has no captions and no downloadable audio. Try another video or a direct MP3 URL.'
    );
  }
  if (!hasWhisperCredentials()) {
    throw new TranscribeError(
      'This TikTok has no captions. Set GROQ_API_KEY or OPENAI_API_KEY to transcribe the audio.'
    );
  }

  const { buffer, filename } = await downloadMedia(mediaUrl, {
    Referer: 'https://www.tiktok.com/',
    Cookie: page.cookie || '',
  });
  const whispered = await transcribeAudioBuffer(buffer, filename, language);
  return {
    metadata,
    language,
    segments: whispered.segments,
    source_type: `tiktok_${whispered.source_type}`,
  };
}

async function loadTikTokPage(url: string) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });
  if (!resp.ok) {
    throw new TranscribeError(`Could not open TikTok URL (${resp.status}).`, 502);
  }
  const html = await resp.text();
  const cookie = resp.headers.get('set-cookie') || '';
  const match = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );

  let item: any = null;
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      item = data?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct || null;
    } catch {
      item = null;
    }
  }

  let oembed: any = null;
  try {
    const oem = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (oem.ok) oembed = await oem.json();
  } catch {
    oembed = null;
  }

  if (!item && !oembed) {
    throw new TranscribeError('Could not read TikTok metadata from that URL.', 502);
  }

  return { item, oembed, cookie };
}

function pickTikTokCaptionUrl(video: any, language: string): string | null {
  const infos = [
    ...(video.subtitleInfos || []),
    ...(video.claInfo?.captionInfos || []),
  ];
  if (infos.length === 0) return null;
  const wanted = language && language !== 'auto' ? language.toLowerCase() : 'en';
  const scored = infos
    .map((info: any) => ({
      url: info.Url || info.url || info.captionUrl,
      lang: String(info.LanguageCodeName || info.language || info.lang || '').toLowerCase(),
    }))
    .filter((x: { url?: string }) => x.url);
  if (scored.length === 0) return null;
  scored.sort((a: { lang: string }, b: { lang: string }) => {
    const as = a.lang.startsWith(wanted) ? 2 : a.lang.includes('en') ? 1 : 0;
    const bs = b.lang.startsWith(wanted) ? 2 : b.lang.includes('en') ? 1 : 0;
    return bs - as;
  });
  return scored[0].url;
}

async function downloadTikTokCaptions(url: string): Promise<TranscriptSegment[]> {
  const resp = await fetch(url, {
    headers: { 'User-Agent': BROWSER_UA, Referer: 'https://www.tiktok.com/' },
  });
  if (!resp.ok) return [];
  const text = await resp.text();
  if (!text.trim()) return [];
  if (text.trim().startsWith('{')) {
    try {
      return parseJson3(JSON.parse(text));
    } catch {
      return [];
    }
  }
  if (text.includes('-->')) return parseVtt(text);
  return parseSrv3Xml(text);
}
