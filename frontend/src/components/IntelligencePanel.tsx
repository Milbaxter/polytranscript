'use client';

import React, { useState } from 'react';
import { TranscriptResponse } from '../lib/types';
import { askMedia } from '../lib/api';
import { BookOpen, ListTree, MessageCircle, Loader2, Play } from 'lucide-react';

interface Props {
  transcript: TranscriptResponse;
  onSeek: (seconds: number) => void;
}

export const IntelligencePanel: React.FC<Props> = ({ transcript, onSeek }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Array<{ start?: number; formatted_start?: string; text?: string }>>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const chapters = transcript.chapters || [];
  const summary = transcript.summary;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    setAsking(true);
    setAskError(null);
    try {
      const res = await askMedia(question.trim(), transcript.full_text, transcript.segments);
      setAnswer(res.answer);
      setCitations(res.relevant_timestamps || []);
    } catch (err: any) {
      setAskError(err.message || 'Q&A failed');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      {summary && (
        <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Executive summary</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">{summary.tldr}</p>
          {summary.key_takeaways?.length > 0 && (
            <ul className="space-y-1">
              {summary.key_takeaways.map((t, i) => (
                <li key={i} className="text-xs text-slate-400">• {t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {chapters.length > 0 && (
        <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-3">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <ListTree className="w-4 h-4 text-indigo-400" />
            <span>Chapters</span>
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {chapters.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSeek(c.start)}
                className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5"
              >
                <div className="flex items-center gap-2 text-[11px] text-indigo-300 font-mono">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  {c.formatted_start || `${Math.floor(c.start / 60)}:${Math.floor(c.start % 60).toString().padStart(2, '0')}`}
                  <span className="text-white font-sans font-semibold">{c.title}</span>
                </div>
                {c.summary && <p className="text-[11px] text-slate-400 mt-1">{c.summary}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl glass-panel p-6 border border-white/10 space-y-3">
        <h3 className="font-semibold text-sm text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span>Ask this transcript</span>
        </h3>
        <p className="text-[11px] text-slate-500">
          Keyword-overlap retrieval plus optional LLM. Not embedding-based semantic search.
        </p>
        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What is the main argument?"
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={asking || !question.trim()}
            className="px-3 py-2 rounded-lg gradient-btn text-white text-xs font-semibold disabled:opacity-50"
          >
            {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ask'}
          </button>
        </form>
        {askError && <p className="text-[11px] text-red-300">{askError}</p>}
        {answer && <p className="text-xs text-slate-300 leading-relaxed">{answer}</p>}
        {citations.length > 0 && (
          <div className="space-y-1">
            {citations.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => typeof c.start === 'number' && onSeek(c.start)}
                className="block text-[11px] text-indigo-300 hover:underline text-left"
              >
                [{c.formatted_start}] {c.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
