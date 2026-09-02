'use client';

import React, { useState } from 'react';
import { MediaInput } from '../components/MediaInput';
import { InteractivePlayer } from '../components/InteractivePlayer';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { ChaptersList } from '../components/ChaptersList';
import { SummaryCard } from '../components/SummaryCard';
import { ExportMenu } from '../components/ExportMenu';
import { transcribeMedia } from '../lib/api';
import { TranscriptResponse } from '../lib/types';
import { Sparkles, Layers, FileText, Cpu, Terminal, Zap, Shield, Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
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
      setError(err.message || 'Failed to extract transcript. Please verify the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeek = (seconds: number) => {
    setSeekTime(seconds);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>The #1 Multi-Platform Media Intelligence & MCP API</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight font-sans">
          Transcribe <span className="gradient-text">YouTube, TikTok & Podcasts</span> with Agent-Ready AI
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Extract instant timestamped transcripts, AI chaptering, semantic soundbite search, and connect directly to <strong className="text-indigo-400">Claude Desktop, Cursor & AI Agents</strong> via Model Context Protocol (MCP).
        </p>

        {/* Input Bar */}
        <div className="pt-4">
          <MediaInput onTranscribe={handleTranscribe} isLoading={isLoading} />
        </div>

        {error && (
          <div className="max-w-xl mx-auto p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs text-left">
            <strong>Error:</strong> {error}
          </div>
        )}
      </section>

      {/* Main Results Container */}
      {transcript && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Left Column: Media Player & Quick Info */}
          <div className="lg:col-span-5 space-y-6">
            <InteractivePlayer metadata={transcript.metadata} seekTime={seekTime} />

            <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3 text-xs">
              <h3 className="font-semibold text-white text-sm">Media Intelligence Metrics</h3>
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
                  <span className="text-slate-500 block text-[10px] uppercase">Source Engine</span>
                  <span className="font-semibold text-indigo-300 capitalize">{transcript.source_type.replace(/_/g, ' ')}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase">Detected Lang</span>
                  <span className="font-mono uppercase text-white">{transcript.language}</span>
                </div>
              </div>

              <div className="pt-2">
                <ExportMenu transcript={transcript} />
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Tabs (Summary / Chapters / Full Transcript) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                {transcript.summary && (
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'summary'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
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
                      activeTab === 'chapters'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Chapters ({transcript.chapters.length})</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'transcript'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Full Transcript ({transcript.segments.length})</span>
                </button>
              </div>
            </div>

            {/* Active Tab Body */}
            <div className="rounded-2xl glass-panel p-6 border border-white/10">
              {activeTab === 'summary' && transcript.summary && (
                <SummaryCard summary={transcript.summary} metadata={transcript.metadata} />
              )}
              {activeTab === 'chapters' && (
                <ChaptersList chapters={transcript.chapters} onSeek={handleSeek} />
              )}
              {activeTab === 'transcript' && (
                <TranscriptViewer segments={transcript.segments} onSeek={handleSeek} activeTime={seekTime} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Feature Grid / Competitive Advantage */}
      <section className="pt-12 space-y-8 border-t border-white/10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Why OmniTranscript Dominates Legacy Scrapers</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Traditional transcript wrappers break on 429 IP bans and lack multi-platform intelligence. OmniTranscript gives you a battle-tested engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Multi-Platform Ingestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unified API for YouTube videos & shorts, TikTok captions and audio, Apple Podcasts, Spotify show feeds, RSS XML, and raw audio files.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Agent-Ready MCP Server</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native Model Context Protocol integration. Plug directly into Claude Desktop, Cursor, Antigravity, or LangChain with zero custom glue code.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Built-in Monetization & SEO</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Replicate the $48k/mo blueprint: programmatic sponsor slot ad banners, developer API subscription tiers, and high-ranking SEO landing pages.
            </p>
          </div>
        </div>
      </section>

      {/* Developer CTA */}
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
