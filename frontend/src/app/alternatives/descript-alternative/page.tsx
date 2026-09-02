'use client';

import React, { useState } from 'react';
import { MediaInput } from '../../../components/MediaInput';
import { InteractivePlayer } from '../../../components/InteractivePlayer';
import { TranscriptViewer } from '../../../components/TranscriptViewer';
import { ExportMenu } from '../../../components/ExportMenu';
import { StructuredData } from '../../../components/StructuredData';
import { transcribeMedia } from '../../../lib/api';
import { TranscriptResponse } from '../../../lib/types';
import { Check, X, Sparkles } from 'lucide-react';

export default function DescriptAltPage() {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Why choose PolyTranscript over Descript for quick transcripts?',
      answer: 'Descript requires downloading a heavy 200MB desktop application and creating an account. PolyTranscript works 100% in your browser or through an API with zero install or login required.',
    },
    {
      question: 'Can I export to SRT or Markdown?',
      answer: 'Yes, with one click you can copy Markdown with timestamps or download .SRT and .VTT subtitle files.',
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
        title="Free Lightweight Descript Alternative Online | PolyTranscript"
        description="Fast, web-based, 0-install Descript alternative for instant YouTube, TikTok, and podcast transcripts."
        url="https://polytranscript.com/alternatives/descript-alternative"
        faqs={faqs}
      />

      <section className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Fast, Lightweight Web Alternative</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto">
          Free <span className="gradient-text">Descript Alternative</span> — 0 App Install, 100% Instant
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Need a quick transcript without downloading heavyweight editing software? Paste any link below to get clean timestamped text in seconds.
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

      <section className="pt-12 border-t border-white/10 space-y-6 max-w-4xl mx-auto">
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
