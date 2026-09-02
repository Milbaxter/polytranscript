'use client';

import React, { useState } from 'react';
import { MediaInput } from '../../../components/MediaInput';
import { InteractivePlayer } from '../../../components/InteractivePlayer';
import { TranscriptViewer } from '../../../components/TranscriptViewer';
import { ExportMenu } from '../../../components/ExportMenu';
import { StructuredData } from '../../../components/StructuredData';
import { transcribeMedia } from '../../../lib/api';
import { TranscriptResponse } from '../../../lib/types';
import { Check, X, Zap, Shield, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TranscriptApiAltPage() {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Why choose PolyTranscript over TranscriptAPI?',
      answer: 'PolyTranscript natively supports YouTube, TikTok, and Podcasts (Apple & Spotify) with native Model Context Protocol (MCP) server support, whereas TranscriptAPI is strictly limited to YouTube.',
    },
    {
      question: 'How does the pricing compare?',
      answer: 'PolyTranscript offers a generous free tier (50 requests/mo) and $29/mo Starter plan with multi-platform support, plus instant self-serve API keys.',
    },
  ];

  const handleTranscribe = async (url: string, options: { language: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await transcribeMedia(url, options);
      setTranscript(res);
    } catch (err: any) {
      setError(err.message || 'Failed to extract transcript.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <StructuredData
        title="Best TranscriptAPI Alternative for YouTube, TikTok & Podcasts | PolyTranscript"
        description="Looking for a faster, multi-platform alternative to TranscriptAPI? PolyTranscript gives you YouTube, TikTok, Podcasts, and native MCP agent tooling."
        url="https://polytranscript.com/alternatives/transcriptapi-alternative"
        faqs={faqs}
      />

      <section className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Competitor Comparison & Alternative</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto">
          The #1 <span className="gradient-text">TranscriptAPI Alternative</span> for AI Builders
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          TranscriptAPI is limited to YouTube. PolyTranscript gives you unified multi-platform transcription (YouTube + TikTok + Podcasts) with sub-second speed and native MCP agent tooling.
        </p>

        <div className="pt-4">
          <MediaInput onTranscribe={handleTranscribe} isLoading={isLoading} />
        </div>

        {error && (
          <div className="max-w-xl mx-auto p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs text-left">
            <strong>Error:</strong> {error}
          </div>
        )}
      </section>

      {transcript && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          <div className="lg:col-span-5 space-y-6">
            <InteractivePlayer metadata={transcript.metadata} seekTime={seekTime} />
            <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
              <ExportMenu transcript={transcript} />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl glass-panel p-6 border border-white/10">
              <TranscriptViewer segments={transcript.segments} onSeek={setSeekTime} activeTime={seekTime} />
            </div>
          </div>
        </section>
      )}

      {/* Comparison Table */}
      <section className="pt-12 border-t border-white/10 space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center">Feature Comparison: PolyTranscript vs. TranscriptAPI</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-indigo-400 font-bold">PolyTranscript</th>
                <th className="py-3 px-4 text-slate-400">TranscriptAPI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">YouTube Videos & Shorts</td>
                <td className="py-3 px-4 text-emerald-400"><Check className="w-4 h-4 inline" /> Sub-second</td>
                <td className="py-3 px-4 text-emerald-400"><Check className="w-4 h-4 inline" /> Yes</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">TikTok Video & Shortlink Transcripts</td>
                <td className="py-3 px-4 text-emerald-400"><Check className="w-4 h-4 inline" /> Native</td>
                <td className="py-3 px-4 text-red-400"><X className="w-4 h-4 inline" /> No</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Podcasts (Apple, Spotify, RSS)</td>
                <td className="py-3 px-4 text-emerald-400"><Check className="w-4 h-4 inline" /> Native</td>
                <td className="py-3 px-4 text-red-400"><X className="w-4 h-4 inline" /> No</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Model Context Protocol (MCP) Server</td>
                <td className="py-3 px-4 text-emerald-400"><Check className="w-4 h-4 inline" /> Claude & Cursor</td>
                <td className="py-3 px-4 text-red-400"><X className="w-4 h-4 inline" /> No</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Free Community Tier</td>
                <td className="py-3 px-4 text-emerald-400"><Check className="w-4 h-4 inline" /> 50 req/mo free</td>
                <td className="py-3 px-4 text-slate-400">Limited trial</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="pt-8 border-t border-white/10 space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 gap-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
              <h3 className="font-semibold text-white text-sm">{faq.question}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
