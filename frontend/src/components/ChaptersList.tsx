'use client';

import React from 'react';
import { Chapter } from '../lib/types';
import { Bookmark, Clock, ChevronRight } from 'lucide-react';

interface ChaptersListProps {
  chapters: Chapter[];
  onSeek: (seconds: number) => void;
}

export const ChaptersList: React.FC<ChaptersListProps> = ({ chapters, onSeek }) => {
  if (!chapters || chapters.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs">
        No chapters generated for this media.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chapters.map((chapter, idx) => (
        <div
          key={idx}
          onClick={() => onSeek(chapter.start)}
          className="group p-4 rounded-xl bg-white/[0.03] hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                {chapter.formatted_start || `00:${Math.floor(chapter.start)}`}
              </span>
              <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                {chapter.title}
              </h4>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          <p className="text-xs text-slate-400 mb-2 leading-relaxed">{chapter.summary}</p>

          {chapter.key_points && chapter.key_points.length > 0 && (
            <ul className="space-y-1 pl-2 border-l border-white/10">
              {chapter.key_points.map((kp, kIdx) => (
                <li key={kIdx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  <span>{kp}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};
