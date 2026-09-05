import type { TranscriptSegment } from '../types';

export function formatStart(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function decorateSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
  return segments.map((s) => ({
    ...s,
    formatted_start: s.formatted_start || formatStart(s.start),
  }));
}

export function parseJson3(data: { events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }> }): TranscriptSegment[] {
  const raw: TranscriptSegment[] = [];
  for (const ev of data.events || []) {
    if (!ev.segs) continue;
    const text = ev.segs
      .map((s) => s.utf8 || '')
      .join('')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text || text === '\n') continue;
    const start = (ev.tStartMs || 0) / 1000;
    const dur = (ev.dDurationMs || 2000) / 1000;
    raw.push({
      start: round2(start),
      end: round2(start + dur),
      text,
    });
  }
  return mergeUtterances(raw);
}

export function parseSrv3Xml(xml: string): TranscriptSegment[] {
  const raw: TranscriptSegment[] = [];
  const textRe = /<text[^>]*start="([^"]+)"[^>]*(?:dur="([^"]+)")?[^>]*>([\s\S]*?)<\/text>/gi;
  let m: RegExpExecArray | null;
  while ((m = textRe.exec(xml))) {
    const start = Number(m[1] || 0);
    const dur = Number(m[2] || 2);
    const text = decodeXml(m[3] || '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    raw.push({ start: round2(start), end: round2(start + dur), text });
  }
  return mergeUtterances(raw);
}

export function parseVtt(vtt: string): TranscriptSegment[] {
  const raw: TranscriptSegment[] = [];
  const blocks = vtt.split(/\n\n+/);
  for (const block of blocks) {
    const match = block.match(/(\d{2}:\d{2}:\d{2}[.,]\d{3}|\d{2}:\d{2}[.,]\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}[.,]\d{3}|\d{2}:\d{2}[.,]\d{3})\n([\s\S]+)/);
    if (!match) continue;
    const text = match[3].replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim();
    if (!text) continue;
    raw.push({
      start: parseClock(match[1]),
      end: parseClock(match[2]),
      text,
    });
  }
  return mergeUtterances(raw);
}

export function mergeUtterances(segments: TranscriptSegment[], maxSeconds = 12, maxChars = 180): TranscriptSegment[] {
  if (segments.length === 0) return [];
  const out: TranscriptSegment[] = [];
  let cur = { ...segments[0] };
  for (const next of segments.slice(1)) {
    const gap = next.start - cur.end;
    const would = `${cur.text} ${next.text}`;
    const canMerge =
      gap <= 0.65 &&
      next.end - cur.start <= maxSeconds &&
      would.length <= maxChars &&
      !/[.!?]$/.test(cur.text.trim());
    if (canMerge) {
      cur = { start: cur.start, end: next.end, text: would.replace(/\s+/g, ' ').trim() };
    } else {
      out.push(cur);
      cur = { ...next };
    }
  }
  out.push(cur);
  return decorateSegments(out);
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseClock(value: string): number {
  const clean = value.replace(',', '.');
  const parts = clean.split(':').map(Number);
  if (parts.length === 3) return round2(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  if (parts.length === 2) return round2(parts[0] * 60 + parts[1]);
  return 0;
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
