export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  formatted_start?: string;
}

export interface MediaMetadata {
  title: string;
  author: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  view_count?: number;
  upload_date?: string;
  platform: 'youtube' | 'tiktok' | 'podcast' | 'direct_audio' | 'file_upload' | 'unknown';
  url: string;
  description?: string;
}

export interface TranscriptResponse {
  metadata: MediaMetadata;
  language: string;
  full_text: string;
  segments: TranscriptSegment[];
  source_type: string;
  word_count: number;
  processing_time_ms: number;
  created_at: string;
}

export interface SponsorInfo {
  enabled: boolean;
  text: string;
  link: string;
  badge: string;
}

export interface APIKeyInfo {
  key: string;
  tier: 'free' | 'starter' | 'pro' | 'scale' | 'enterprise';
  monthly_limit: number;
  used_this_month: number;
  active: boolean;
}
