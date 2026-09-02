'use client';

import React, { useState } from 'react';
import { SearchHit } from '../lib/types';
import { Search, X, Play, Sparkles } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeek: (seconds: number) => void;
  hits: SearchHit[];
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSeek, hits }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Soundbite Search Results ({hits.length})</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {hits.map((hit, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSeek(hit.start);
                onClose();
              }}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer flex items-start gap-3"
            >
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                [{hit.formatted_start}]
              </span>
              <p className="text-xs text-slate-300 leading-relaxed flex-1">{hit.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
