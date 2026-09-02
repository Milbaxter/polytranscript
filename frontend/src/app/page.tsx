'use client';

import React, { useState } from 'react';
import { MediaInput } from '../components/MediaInput';
import { InteractivePlayer } from '../components/InteractivePlayer';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { ExportMenu } from '../components/ExportMenu';
import { IntelligencePanel } from '../components/IntelligencePanel';
import { transcribeMedia } from '../lib/api';
import { TranscriptResponse } from '../lib/types';
import { Sparkles, Terminal, Zap, Shield, Cpu, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
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
      setError(err.message || 'Failed to extract transcript. Please verify the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Platform Audio Intelligence & MCP Agent Server</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight font-sans">
          Transcribe <span className="gradient-text">YouTube, TikTok & Podcasts</span> with Agent-Ready Speed
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Extract instant timestamped transcripts, clean SRT/Markdown, and connect directly to <strong className="text-indigo-400">Claude Desktop, Cursor & AI Agents</strong> via Model Context Protocol (MCP).
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

            <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3 text-xs">
              <h3 className="font-semibold text-white text-sm">Media Metrics</h3>
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase">Word Count</span>
                  <span className="font-mono font-semibold text-white text-sm">{transcript.word_count.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase">Latency</span>
                  <span className="font-mono font-semibold text-emerald-400 text-sm">{transcript.processing_time_ms} ms</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase">Platform</span>
                  <span className="font-semibold text-indigo-300 uppercase">{transcript.metadata.platform}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase">Language</span>
                  <span className="font-mono uppercase text-white">{transcript.language}</span>
                </div>
              </div>

              <div className="pt-2">
                <ExportMenu transcript={transcript} />
              </div>
            </div>

            <IntelligencePanel transcript={transcript} onSeek={setSeekTime} />
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl glass-panel p-6 border border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  <span>Interactive Transcript</span>
                  <span className="text-xs text-slate-400 font-normal">({transcript.segments.length} segments)</span>
                </h3>
                <span className="text-[11px] text-indigo-400 font-mono">Click timestamp to seek</span>
              </div>
              <TranscriptViewer segments={transcript.segments} onSeek={setSeekTime} activeTime={seekTime} />
            </div>
          </div>
        </section>
      )}

      <section className="pt-12 space-y-8 border-t border-white/10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Built for Builders, Creators & Autonomous Agents</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Traditional transcript wrappers break on 429 IP bans and lack multi-platform intelligence. PolyTranscript gives you a battle-tested engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">1. Multi-Platform Ingestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unified engine for YouTube videos & shorts, TikTok captions and audio, Apple Podcasts, public RSS enclosures, and raw audio files. Spotify stays DRM-blocked on purpose.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">2. Agent-Ready MCP Server</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native Model Context Protocol integration. Plug directly into Claude Desktop, Cursor, Antigravity, or LangChain with zero custom glue code.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">3. Honest production billing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sponsor slots, API tiers, and Stripe checkout with webhook-verified keys. No demo transcripts, no client-side Pro minting.
            </p>
          </div>
        </div>
      </section>

      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-bold text-white">Ready to integrate media intelligence into your AI agent?</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Get your instant developer API key or run the local MCP server in 30 seconds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/docs"
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" />
            <span>Read API & MCP Docs</span>
          </Link>
          <Link
            href="/api-keys"
            className="px-5 py-2.5 rounded-xl gradient-btn text-white text-xs font-semibold shadow-lg flex items-center gap-2"
          >
            <span>Get Free API Key</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
