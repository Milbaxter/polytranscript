'use client';

import React, { useState } from 'react';
import { Radio, Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { YoutubeIcon, TikTokIcon } from './Icons';

interface MediaInputProps {
  onTranscribe: (url: string, options: { language: string }) => void;
  isLoading: boolean;
}

export const MediaInput: React.FC<MediaInputProps> = ({ onTranscribe, isLoading }) => {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');

  const getPlatformIcon = () => {
    if (/youtube\.com|youtu\.be/.test(url)) {
      return <YoutubeIcon className="w-5 h-5 text-red-500 animate-pulse" />;
    }
    if (/tiktok\.com/.test(url)) {
      return <TikTokIcon className="w-5 h-5 text-pink-500 animate-pulse" />;
    }
    if (/apple\.com|spotify\.com|rss|feed|\.mp3/.test(url)) {
      return <Radio className="w-5 h-5 text-purple-400 animate-pulse" />;
    }
    return <Search className="w-5 h-5 text-slate-400" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onTranscribe(url.trim(), { language });
  };

  const sampleUrls = [
    { label: '3Blue1Brown (YouTube)', url: 'https://www.youtube.com/watch?v=aircAruvnKk' },
    { label: 'Lex Fridman (YouTube)', url: 'https://www.youtube.com/watch?v=jvqFAi7vkBc' },
    { label: 'CC0 sample MP3 (MDN)', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center rounded-2xl glass-panel-glow p-2 transition-all duration-300">
          <div className="pl-3 pr-2 flex items-center justify-center">
            {getPlatformIcon()}
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any YouTube, TikTok, Apple Podcast, RSS episode, or Audio URL..."
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm md:text-base focus:outline-none px-2 py-2.5 font-sans"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-btn text-white text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Transcribe</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="auto">Auto-detect</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] text-slate-500 hidden sm:inline">Try:</span>
          {sampleUrls.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrl(s.url);
                onTranscribe(s.url, { language });
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors truncate"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
