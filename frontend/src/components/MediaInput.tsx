'use client';

import React, { useState } from 'react';
import { Radio, Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { YoutubeIcon, TikTokIcon } from './Icons';

interface MediaInputProps {
  onTranscribe: (url: string, options: { language: string; include_chapters: boolean; include_summary: boolean }) => void;
  isLoading: boolean;
}

export const MediaInput: React.FC<MediaInputProps> = ({ onTranscribe, isLoading }) => {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [includeChapters, setIncludeChapters] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  const getPlatformIcon = () => {
    if (/youtube\.com|youtu\.be/.test(url)) {
      return <YoutubeIcon className="w-5 h-5 text-red-500" />;
    }
    if (/tiktok\.com/.test(url)) {
      return <TikTokIcon className="w-5 h-5 text-pink-500" />;
    }
    if (/apple\.com|spotify\.com|rss|feed|\.mp3/.test(url)) {
      return <Radio className="w-5 h-5 text-purple-400" />;
    }
    return <Search className="w-5 h-5 text-slate-400" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onTranscribe(url.trim(), {
      language,
      include_chapters: includeChapters,
      include_summary: includeSummary
    });
  };

  const sampleUrls = [
    { label: '3Blue1Brown Neural Networks (YouTube)', url: 'https://www.youtube.com/watch?v=aircAruvnKk' },
    { label: 'Lex Fridman AI & Robotics (YouTube)', url: 'https://www.youtube.com/watch?v=jvqFAi7vkBc' },
    { label: 'Tech & AI Podcast (RSS / MP3)', url: 'https://traffic.libsyn.com/show/episode1.mp3' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center rounded-2xl glass-panel-glow p-2 transition-all duration-300">
          <div className="pl-3 pr-2 flex items-center justify-center">
            {getPlatformIcon()}
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any YouTube, TikTok, Apple Podcast, RSS Feed, or Audio URL..."
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm md:text-base focus:outline-none px-2 py-2.5 font-sans"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl gradient-btn text-white text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer shrink-0"
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

      {/* Options & Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-2">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-300">
            <input
              type="checkbox"
              checked={includeChapters}
              onChange={(e) => setIncludeChapters(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500"
            />
            <span>AI Chaptering</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-300">
            <input
              type="checkbox"
              checked={includeSummary}
              onChange={(e) => setIncludeSummary(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500"
            />
            <span>Executive Summary</span>
          </label>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/60 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="en">English (auto)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="auto">Auto-detect</option>
            </select>
          </div>
        </div>

        {/* Fast Samples */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] text-slate-500 hidden sm:inline">Try:</span>
          {sampleUrls.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrl(s.url);
                onTranscribe(s.url, { language, include_chapters: includeChapters, include_summary: includeSummary });
              }}
              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors truncate max-w-[180px]"
            >
              {s.label.split(' ')[0]} {s.label.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
