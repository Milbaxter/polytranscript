'use client';

import React, { useState } from 'react';
import { MediaInput } from '../../components/MediaInput';
import { InteractivePlayer } from '../../components/InteractivePlayer';
import { TranscriptViewer } from '../../components/TranscriptViewer';
import { ExportMenu } from '../../components/ExportMenu';
import { StructuredData } from '../../components/StructuredData';
import { transcribeMedia } from '../../lib/api';
import { TranscriptResponse } from '../../lib/types';
import { YoutubeIcon } from '../../components/Icons';
import { Zap, Shield, Sparkles } from 'lucide-react';

export default function YouTubeShortsPage() {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I get the transcript of a YouTube Short?',
      answer: 'Simply paste any YouTube Short link (youtube.com/shorts/...) into PolyTranscript and click Transcribe. The transcript is extracted in milliseconds with full timestamps.',
    },
    {
      question: 'Can I export YouTube Shorts subtitles to SRT or TXT?',
      answer: 'Yes! You can download SRT, VTT, or Markdown files with a single click, or copy the formatted transcript directly for ChatGPT and Claude prompts.',
    },
    {
      question: 'Is this YouTube Shorts transcript tool free?',
      answer: 'Yes, PolyTranscript is 100% free for online use with no sign-up required.',
    },
  ];

  const handleTranscribe = async (url: string, options: { language: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await transcribeMedia(url, options);
      setTranscript(res);
    } catch (err: any) {
      setError(err.message || 'Failed to extract YouTube Shorts transcript.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <StructuredData
        title="YouTube Shorts Transcript Generator | PolyTranscript"
        description="Extract instant, timestamped transcripts from any YouTube Short video online. Free, fast, and no login required."
        url="https://polytranscript.com/youtube-shorts-transcript-generator"
        faqs={faqs}
      />

      <section className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
          <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />
          <span>YouTube Shorts to Text</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto">
          Free <span className="text-red-500">YouTube Shorts</span> Transcript Generator
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Convert short-form YouTube videos into clean text and subtitles with exact start timestamps. Export to Markdown, SRT, or copy directly for AI prompts.
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
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="font-semibold text-sm text-white">Shorts Transcript</h3>
                <span className="text-xs text-slate-400 font-mono">{transcript.word_count.toLocaleString()} words</span>
              </div>
              <TranscriptViewer segments={transcript.segments} onSeek={setSeekTime} activeTime={seekTime} />
            </div>
          </div>
        </section>
      )}

      {/* SEO Content & FAQ */}
      <section className="pt-12 border-t border-white/10 space-y-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl glass-panel border border-white/5 space-y-1">
            <div className="text-amber-400 font-semibold text-xs flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Sub-Second Extraction</span>
            </div>
            <p className="text-[11px] text-slate-400">Extracts direct timed captions in under 200ms without downloading video files.</p>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-white/5 space-y-1">
            <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>100% Free & Unlimited</span>
            </div>
            <p className="text-[11px] text-slate-400">No account or credit card needed for free online transcription.</p>
          </div>
          <div className="p-4 rounded-xl glass-panel border border-white/5 space-y-1">
            <div className="text-indigo-400 font-semibold text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agent & LLM Ready</span>
            </div>
            <p className="text-[11px] text-slate-400">Pre-formatted for Claude, Cursor, and ChatGPT prompts.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 gap-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
                <h3 className="font-semibold text-white text-sm">{faq.question}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
