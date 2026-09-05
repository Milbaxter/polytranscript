import type { MediaMetadata, TranscriptSegment } from '../types';

export class TranscribeError extends Error {
  status: number;

  constructor(message: string, status = 422) {
    super(message);
    this.name = 'TranscribeError';
    this.status = status;
  }
}

export interface CaptionTrack {
  languageCode: string;
  kind?: string;
  name?: string;
  baseUrl: string;
}

export interface ExtractedTranscript {
  metadata: MediaMetadata;
  language: string;
  segments: TranscriptSegment[];
  source_type: string;
}
