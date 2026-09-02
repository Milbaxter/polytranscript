'use client';

import React, { useState } from 'react';
import { MediaInput } from '../../components/MediaInput';
import { InteractivePlayer } from '../../components/InteractivePlayer';
import { TranscriptViewer } from '../../components/TranscriptViewer';
import { ExportMenu } from '../../components/ExportMenu';
import { transcribeMedia } from '../../lib/api';
import { TranscriptResponse } from '../../lib/types';
import { YoutubeIcon } from '../../components/Icons';

export default function YouTubePage() {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const handleTranscribe = async (
    url: string,
    options: { language: string }
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await transcribeMedia(url, options);
      setTranscript(res);
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
          Free <span className="text-red-500">YouTube Transcript</span> Generator & Subtitle Exporter
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Convert any YouTube video or Short into accurate timestamped text, and export to SRT, VTT, Markdown, or Claude/ChatGPT prompt with one click.
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
                <h3 className="font-semibold text-sm text-white">YouTube Transcript</h3>
                <span className="text-xs text-slate-400 font-mono">{transcript.word_count.toLocaleString()} words</span>
              </div>
              <TranscriptViewer segments={transcript.segments} onSeek={setSeekTime} activeTime={seekTime} />
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
              Simply paste any YouTube link above and click Transcribe. OmniTranscript extracts captions directly in milliseconds with zero video downloading required.
            </p>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
            <h3 className="font-semibold text-white text-sm">Can I export to Claude or Cursor via MCP?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes! Click "Copy for AI / Claude" to get clean formatted markdown with timestamps, or configure our native Model Context Protocol (MCP) server for automated agent calls.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
