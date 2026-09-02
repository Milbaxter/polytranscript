'use client';

import React, { useRef, useEffect } from 'react';
import { MediaMetadata } from '../lib/types';
import { Music, Video } from 'lucide-react';
import { YoutubeIcon, TikTokIcon } from './Icons';

interface InteractivePlayerProps {
  metadata: MediaMetadata;
  seekTime: number | null;
}

export const InteractivePlayer: React.FC<InteractivePlayerProps> = ({ metadata, seekTime }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const ytId = getYouTubeId(metadata.url);

  useEffect(() => {
    if (seekTime !== null) {
      if (audioRef.current) {
        audioRef.current.currentTime = seekTime;
        audioRef.current.play().catch(() => {});
      }
    }
  }, [seekTime]);

  return (
    <div className="w-full rounded-2xl overflow-hidden glass-panel border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {metadata.platform === 'youtube' && <YoutubeIcon className="w-4 h-4 text-red-500" />}
          {metadata.platform === 'tiktok' && <TikTokIcon className="w-4 h-4 text-pink-500" />}
          {metadata.platform === 'podcast' && <Music className="w-4 h-4 text-purple-400" />}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {metadata.platform} Media Player
          </span>
        </div>
        {metadata.duration_seconds && (
          <span className="text-xs text-slate-400 font-mono">
            {Math.floor(metadata.duration_seconds / 60)}:{(Math.floor(metadata.duration_seconds % 60)).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {ytId ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/40">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1${seekTime !== null ? `&start=${Math.floor(seekTime)}&autoplay=1` : ''}`}
            title={metadata.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : metadata.url.match(/\.(mp3|wav|ogg|m4a)/i) ? (
        <div className="p-4 rounded-xl bg-slate-900/60 flex flex-col gap-3">
          <div className="text-sm font-medium text-white truncate">{metadata.title}</div>
          <audio ref={audioRef} controls src={metadata.url} className="w-full h-10 rounded" />
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-4">
          {metadata.thumbnail_url && (
            <img src={metadata.thumbnail_url} alt={metadata.title} className="w-16 h-16 rounded-lg object-cover" />
          )}
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{metadata.title}</h4>
            <p className="text-xs text-slate-400">{metadata.author}</p>
            <a
              href={metadata.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-400 hover:underline mt-1 inline-block"
            >
              Open Original Source ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
