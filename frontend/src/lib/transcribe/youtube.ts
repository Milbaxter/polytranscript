import { parseJson3 } from './segments';
import { TranscribeError, type CaptionTrack, type ExtractedTranscript } from './types';

const YOUTUBE_RE =
  /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;

const IOS_UA =
  'com.google.ios.youtube/21.02.3 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_RE);
  return match?.[1] || null;
}

export async function transcribeYouTube(url: string, language: string): Promise<ExtractedTranscript> {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new TranscribeError('Not a valid YouTube URL.');
  }

  const player = await fetchIosPlayer(videoId);
  const metadata = await buildYouTubeMetadata(videoId, url, player);
  const tracks = getCaptionTracks(player);
  if (tracks.length === 0) {
    throw new TranscribeError(
      'This YouTube video has no captions. Paste a direct audio URL and set GROQ_API_KEY or OPENAI_API_KEY to transcribe speech.'
    );
  }

  const track = pickTrack(tracks, language);
  const segments = await downloadCaptionTrack(track);
  if (segments.length === 0) {
    throw new TranscribeError('YouTube captions were listed but could not be downloaded.');
  }

  return {
    metadata,
    language: track.languageCode || language,
    segments,
    source_type: track.kind === 'asr' ? 'youtube_asr_captions' : 'youtube_captions',
  };
}

async function fetchIosPlayer(videoId: string): Promise<any> {
  const resp = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': IOS_UA,
      'X-YouTube-Client-Name': '5',
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'IOS',
          clientVersion: '21.02.3',
          deviceMake: 'Apple',
          deviceModel: 'iPhone16,2',
          osName: 'iPhone',
          osVersion: '18.3.2.22D82',
          hl: 'en',
          gl: 'US',
        },
      },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    }),
  });

  if (!resp.ok) {
    throw new TranscribeError(`YouTube player request failed (${resp.status}).`, 502);
  }

  const data = await resp.json();
  const status = data?.playabilityStatus?.status;
  if (status && status !== 'OK') {
    throw new TranscribeError(
      data?.playabilityStatus?.reason || `YouTube rejected playback (${status}).`,
      502
    );
  }
  return data;
}

function getCaptionTracks(player: any): CaptionTrack[] {
  const raw =
    player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
    [];
  return raw
    .map((t: any) => ({
      languageCode: String(t.languageCode || ''),
      kind: t.kind,
      name: t.name?.simpleText || t.name?.runs?.[0]?.text,
      baseUrl: String(t.baseUrl || ''),
    }))
    .filter((t: CaptionTrack) => t.baseUrl);
}

function pickTrack(tracks: CaptionTrack[], language: string): CaptionTrack {
  const wanted = language && language !== 'auto' ? language.toLowerCase() : 'en';
  const score = (t: CaptionTrack) => {
    const lang = t.languageCode.toLowerCase();
    let n = 0;
    if (lang === wanted) n += 100;
    else if (lang.startsWith(wanted)) n += 80;
    else if (lang.startsWith('en')) n += 20;
    if (t.kind !== 'asr') n += 10;
    return n;
  };
  return [...tracks].sort((a, b) => score(b) - score(a))[0];
}

async function downloadCaptionTrack(track: CaptionTrack) {
  const url = track.baseUrl.includes('fmt=') ? track.baseUrl : `${track.baseUrl}&fmt=json3`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': IOS_UA,
      Accept: '*/*',
    },
  });
  if (!resp.ok) {
    throw new TranscribeError(`Caption download failed (${resp.status}).`, 502);
  }
  const text = await resp.text();
  if (!text.trim()) {
    return [];
  }
  try {
    return parseJson3(JSON.parse(text));
  } catch {
    return [];
  }
}

async function buildYouTubeMetadata(videoId: string, originalUrl: string, player: any) {
  const details = player?.videoDetails || {};
  let title = details.title || `YouTube Video (${videoId})`;
  let author = details.author || 'YouTube Creator';
  let thumbnail_url =
    details.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (!details.title) {
    try {
      const oembed = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { headers: { 'User-Agent': BROWSER_UA } }
      );
      if (oembed.ok) {
        const data = await oembed.json();
        title = data.title || title;
        author = data.author_name || author;
        thumbnail_url = data.thumbnail_url || thumbnail_url;
      }
    } catch {
      // oEmbed is metadata-only; captions already succeeded or will fail separately
    }
  }

  return {
    title,
    author,
    duration_seconds: details.lengthSeconds ? Number(details.lengthSeconds) : undefined,
    thumbnail_url,
    view_count: details.viewCount ? Number(details.viewCount) : undefined,
    platform: 'youtube' as const,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    description: typeof details.shortDescription === 'string' ? details.shortDescription.slice(0, 500) : undefined,
  };
}
