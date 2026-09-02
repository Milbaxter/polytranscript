'use client';

import React, { useState } from 'react';
import { SummaryResponse, MediaMetadata } from '../lib/types';
import { Sparkles, CheckSquare, Quote, Copy, Check } from 'lucide-react';
import { TwitterXIcon } from './Icons';

interface SummaryCardProps {
  summary: SummaryResponse;
  metadata: MediaMetadata;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, metadata }) => {
  const [copied, setCopied] = useState(false);

  const handleShareX = () => {
    const postText = summary.social_post || `Check out the AI breakdown of "${metadata.title}":\n\n${summary.tldr}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText.slice(0, 270))}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    const content = `⚡ TL;DR:\n${summary.tldr}\n\n🎯 Key Takeaways:\n${summary.key_takeaways.map((t) => `- ${t}`).join('\n')}\n\n🛠 Action Items:\n${summary.action_items.map((a) => `[ ] ${a}`).join('\n')}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* TLDR */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Executive TL;DR</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleShareX}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#1d9bf0]/20 hover:bg-[#1d9bf0]/30 text-[#1d9bf0] font-medium transition-colors"
            >
              <TwitterXIcon className="w-3 h-3" />
              <span>Share on X</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-sans">{summary.tldr}</p>
      </div>

      {/* Takeaways */}
      {summary.key_takeaways && summary.key_takeaways.length > 0 && (
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span>🎯 Key Takeaways & Frameworks</span>
          </h4>
          <ul className="space-y-2">
            {summary.key_takeaways.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action items */}
      {summary.action_items && summary.action_items.length > 0 && (
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Action Items & Next Steps</span>
          </h4>
          <div className="space-y-2">
            {summary.action_items.map((action, idx) => (
              <label key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer group">
                <input type="checkbox" className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500" />
                <span className="group-hover:text-white transition-colors">{action}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Soundbites */}
      {summary.soundbites && summary.soundbites.length > 0 && (
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5" />
            <span>Notable Quotes & Soundbites</span>
          </h4>
          <div className="space-y-2.5">
            {summary.soundbites.map((quote, idx) => (
              <blockquote key={idx} className="p-3 rounded-lg bg-white/[0.02] border-l-2 border-purple-500 text-xs italic text-slate-300">
                {quote}
              </blockquote>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
