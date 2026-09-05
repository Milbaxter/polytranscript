import { downloadMedia, hasWhisperCredentials, transcribeAudioBuffer } from './whisper';
import { TranscribeError, type ExtractedTranscript } from './types';

const APPLE_RE = /podcasts\.apple\.com\/[\w-]+\/podcast\/[^/]+\/id(\d+)(?:\?i=(\d+))?/;
const SPOTIFY_RE = /open\.spotify\.com\/(episode|show)\//;
const AUDIO_RE = /\.(?:mp3|m4a|wav|ogg|aac|flac|webm)(?:\?|#|$)/i;

export function isSpotifyUrl(url: string): boolean {
  return SPOTIFY_RE.test(url);
}

export function isDirectAudioUrl(url: string): boolean {
  return AUDIO_RE.test(url);
}

export function looksLikeRss(url: string): boolean {
  return /(?:\/feed|\/rss|\.xml)(?:\?|#|$)/i.test(url) || url.includes('feeds.');
}

export async function transcribeAudioOrPodcast(url: string, language: string): Promise<ExtractedTranscript> {
  if (isSpotifyUrl(url)) {
    throw new TranscribeError(
      'Spotify episodes are DRM-protected. Use the Apple Podcasts link, the show RSS feed, or a direct MP3/M4A URL.'
    );
  }

  const resolved = await resolveAudioSource(url);
  if (!hasWhisperCredentials()) {
    throw new TranscribeError(
      `Resolved "${resolved.title}" but speech-to-text needs GROQ_API_KEY or OPENAI_API_KEY on the server.`
    );
  }

  const { buffer, filename } = await downloadMedia(resolved.audioUrl);
  const whispered = await transcribeAudioBuffer(buffer, filename, language);

  return {
    metadata: {
      title: resolved.title,
      author: resolved.author,
      duration_seconds: resolved.duration,
      thumbnail_url: resolved.thumbnail,
      platform: resolved.platform,
      url: resolved.audioUrl,
      description: resolved.description,
    },
    language,
    segments: whispered.segments,
    source_type: `${resolved.platform}_${whispered.source_type}`,
  };
}

interface ResolvedAudio {
  title: string;
  author: string;
  audioUrl: string;
  thumbnail?: string;
  duration?: number;
  description?: string;
  platform: 'podcast' | 'direct_audio';
}

async function resolveAudioSource(url: string): Promise<ResolvedAudio> {
  const apple = url.match(APPLE_RE);
  if (apple) {
    const resolved = await resolveApplePodcast(apple[1], apple[2]);
    if (resolved) return resolved;
    throw new TranscribeError('Could not resolve an audio file from that Apple Podcasts URL.');
  }

  if (looksLikeRss(url) || url.endsWith('.xml')) {
    const resolved = await resolveRssEpisode(url);
    if (resolved) return resolved;
    throw new TranscribeError('That RSS feed has no audio enclosure.');
  }

  if (isDirectAudioUrl(url)) {
    const name = decodeURIComponent(url.split('?')[0].split('/').pop() || 'Audio file');
    return {
      title: name.replace(/[-_]/g, ' '),
      author: 'Direct audio',
      audioUrl: url,
      platform: 'direct_audio',
    };
  }

  throw new TranscribeError('Unsupported URL. Use YouTube, TikTok, Apple Podcasts, an RSS feed, or a direct audio file (mp3, m4a, wav, ogg, aac, flac, webm).');
}

async function resolveApplePodcast(showId: string, episodeId: string | undefined): Promise<ResolvedAudio | null> {
  const lookupId = episodeId || showId;
  const resp = await fetch(`https://itunes.apple.com/lookup?id=${lookupId}&entity=podcastEpisode`);
  if (!resp.ok) return null;
  const data = await resp.json();
  const item = (data.results || []).find((r: any) => r.episodeUrl) || data.results?.[0];
  if (!item) return null;
  const audioUrl = item.episodeUrl;
  if (!audioUrl) return null;
  return {
    title: item.trackName || item.collectionName || 'Apple Podcast Episode',
    author: item.artistName || 'Podcast Host',
    audioUrl,
    thumbnail: item.artworkUrl600 || item.artworkUrl100,
    duration: item.trackTimeMillis ? Number(item.trackTimeMillis) / 1000 : undefined,
    description: typeof item.description === 'string' ? item.description.slice(0, 500) : undefined,
    platform: 'podcast',
  };
}

async function resolveRssEpisode(feedUrl: string): Promise<ResolvedAudio | null> {
  const resp = await fetch(feedUrl, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
  });
  if (!resp.ok) return null;
  const xml = await resp.text();
  const channelTitle = textBetween(xml, '<title>', '</title>') || 'Podcast';
  const author =
    textBetween(xml, '<itunes:author>', '</itunes:author>') ||
    textBetween(xml, '<author>', '</author>') ||
    'Podcast Host';
  const image =
    attrBetween(xml, /<itunes:image[^>]*href="([^"]+)"/i) ||
    textBetween(xml, '<url>', '</url>');

  const item = xml.match(/<item\b[\s\S]*?<\/item>/i)?.[0] || '';
  if (!item) return null;
  const enclosure =
    attrBetween(item, /<enclosure[^>]*url="([^"]+)"/i) ||
    attrBetween(item, /<media:content[^>]*url="([^"]+)"/i);
  if (!enclosure) return null;

  return {
    title: `${channelTitle}: ${textBetween(item, '<title>', '</title>') || 'Episode'}`,
    author,
    audioUrl: enclosure,
    thumbnail: image,
    description: (textBetween(item, '<description>', '</description>') || '').replace(/<[^>]+>/g, '').slice(0, 500),
    platform: 'podcast',
  };
}

function textBetween(xml: string, start: string, end: string): string | undefined {
  const idx = xml.indexOf(start);
  if (idx === -1) return undefined;
  const from = idx + start.length;
  const to = xml.indexOf(end, from);
  if (to === -1) return undefined;
  return xml
    .slice(from, to)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function attrBetween(xml: string, re: RegExp): string | undefined {
  return xml.match(re)?.[1];
}
