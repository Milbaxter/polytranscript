'use client';

import React, { useState, useMemo } from 'react';
import { TranscriptSegment } from '../lib/types';
import { Search, Play, Copy, Check, Filter } from 'lucide-react';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  onSeek: (seconds: number) => void;
  activeTime?: number | null;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ segments, onSeek, activeTime }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const query = searchQuery.toLowerCase();
    return segments.filter((seg) => seg.text.toLowerCase().includes(query));
  }, [segments, searchQuery]);

  const handleCopyLine = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 rounded px-1 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Search within transcript */}
      <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-2 flex-1 px-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords in transcript..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
        {searchQuery && (
          <span className="text-[11px] text-indigo-400 font-mono pr-2">
            {filteredSegments.length} match{filteredSegments.length === 1 ? '' : 'es'}
          </span>
        )}
      </div>

      {/* Segments list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {filteredSegments.map((seg, idx) => {
          const isActive = activeTime !== null && activeTime !== undefined && activeTime >= seg.start && activeTime <= seg.end;

          return (
            <div
              key={idx}
              className={`group flex items-start gap-3 p-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-indigo-600/20 border border-indigo-500/40 shadow-sm'
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/5'
              }`}
            >
              {/* Clickable timestamp button */}
              <button
                type="button"
                onClick={() => onSeek(seg.start)}
                className="flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{seg.formatted_start || `00:${Math.floor(seg.start)}`}</span>
              </button>

              {/* Text content */}
              <div className="flex-1 text-xs text-slate-300 leading-relaxed font-sans">
                {seg.speaker && (
                  <span className="text-indigo-400 font-semibold mr-1.5">[{seg.speaker}]:</span>
                )}
                <span>{highlightMatch(seg.text, searchQuery)}</span>
              </div>

              {/* Copy line button */}
              <button
                type="button"
                onClick={() => handleCopyLine(seg.text, idx)}
                title="Copy line"
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white p-1 transition-opacity cursor-pointer"
              >
                {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
