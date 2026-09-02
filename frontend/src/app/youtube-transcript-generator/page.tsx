'use client';

import React, { useState } from 'react';
import { MediaInput } from '../../components/MediaInput';
import { InteractivePlayer } from '../../components/InteractivePlayer';
import { TranscriptViewer } from '../../components/TranscriptViewer';
import { ChaptersList } from '../../components/ChaptersList';
import { SummaryCard } from '../../components/SummaryCard';
import { ExportMenu } from '../../components/ExportMenu';
import { transcribeMedia } from '../../lib/api';
import { TranscriptResponse } from '../../lib/types';
import { Sparkles, Layers, FileText } from 'lucide-react';
import { YoutubeIcon } from '../../components/Icons';

export default function YouTubePage() {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'chapters' | 'summary'>('transcript');
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const handleTranscribe = async (
    url: string,
    options: { language: string; include_chapters: boolean; include_summary: boolean }
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await transcribeMedia(url, options);
      setTranscript(res);
      setActiveTab(res.summary ? 'summary' : 'transcript');
    } catch (err: any) {
      setError(err.message || 'Failed to extract YouTube transcript.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
          <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />
          <span>Instant YouTube Transcript Generator</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto">
          Free <span className="text-red-500">YouTube Transcript</span> Generator & AI Chaptering
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Convert any YouTube video or Short into accurate timestamped text, AI summaries, and export to SRT, VTT, Markdown, or Claude/ChatGPT prompt with one click.
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
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              {transcript.summary && (
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'summary' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Summary</span>
                </button>
              )}
              {transcript.chapters && transcript.chapters.length > 0 && (
                <button
                  onClick={() => setActiveTab('chapters')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'chapters' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Chapters ({transcript.chapters.length})</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('transcript')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'transcript' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Transcript ({transcript.segments.length})</span>
              </button>
            </div>

            <div className="rounded-2xl glass-panel p-6 border border-white/10">
              {activeTab === 'summary' && transcript.summary && (
                <SummaryCard summary={transcript.summary} metadata={transcript.metadata} />
              )}
              {activeTab === 'chapters' && (
                <ChaptersList chapters={transcript.chapters} onSeek={setSeekTime} />
              )}
              {activeTab === 'transcript' && (
                <TranscriptViewer segments={transcript.segments} onSeek={setSeekTime} activeTime={seekTime} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* SEO FAQ */}
      <section className="pt-12 border-t border-white/10 space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
            <h3 className="font-semibold text-white text-sm">How do I get a YouTube video transcript?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simply paste any YouTube link above and click Transcribe. OmniTranscript extracts captions directly in milliseconds, or transcribes the audio using Whisper AI if no captions are present.
            </p>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
            <h3 className="font-semibold text-white text-sm">Can I export to Claude or ChatGPT?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes! Click "Copy for AI / Claude" to get clean formatted markdown with timestamps and chapters ready for prompting.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
