'use client';

import React from 'react';
import Link from 'next/link';
import { AudioWaveform } from 'lucide-react';
import { TwitterXIcon, GithubIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#070a12] text-slate-400 text-xs py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <AudioWaveform className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white">PolyTranscript</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Multi-platform transcription and audio intelligence API for YouTube, TikTok, Podcasts, and autonomous AI agents.
          </p>
          <div className="text-[11px] text-slate-500">
            Model Context Protocol (MCP) Native.
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">YouTube & Video Tools</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/youtube-transcript-generator" className="hover:text-indigo-400 transition-colors">
                YouTube Transcript Generator
              </Link>
            </li>
            <li>
              <Link href="/youtube-shorts-transcript-generator" className="hover:text-indigo-400 transition-colors">
                YouTube Shorts Transcriber
              </Link>
            </li>
            <li>
              <Link href="/youtube-to-srt-converter" className="hover:text-indigo-400 transition-colors">
                YouTube to SRT Subtitles
              </Link>
            </li>
            <li>
              <Link href="/tiktok-transcript-generator" className="hover:text-indigo-400 transition-colors">
                TikTok Transcript Generator
              </Link>
            </li>
            <li>
              <Link href="/tiktok-captions-extractor" className="hover:text-indigo-400 transition-colors">
                TikTok Captions Extractor
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Podcasts & Audio Tools</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/podcast-transcript-generator" className="hover:text-indigo-400 transition-colors">
                Podcast to Text Transcriber
              </Link>
            </li>
            <li>
              <Link href="/spotify-podcast-transcript-generator" className="hover:text-indigo-400 transition-colors">
                Spotify Podcast Transcripts
              </Link>
            </li>
            <li>
              <Link href="/mp3-to-text-converter" className="hover:text-indigo-400 transition-colors">
                MP3 to Text Audio Converter
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-indigo-400 transition-colors">
                Universal Media Transcriber
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Developers & Monetization</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/docs" className="hover:text-indigo-400 transition-colors">
                REST API Documentation
              </Link>
            </li>
            <li>
              <Link href="/docs#mcp" className="hover:text-indigo-400 transition-colors">
                Claude & Cursor MCP Setup
              </Link>
            </li>
            <li>
              <Link href="/api-keys" className="hover:text-indigo-400 transition-colors">
                API Key Dashboard
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-indigo-400 transition-colors">
                Developer Pricing Tiers
              </Link>
            </li>
            <li>
              <Link href="/pricing#sponsor" className="hover:text-indigo-400 transition-colors">
                Book Top Sponsor Slot ($500/mo)
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <div>
          © {new Date().getFullYear()} PolyTranscript. Built for builders, researchers, and autonomous AI agents.
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Milbaxter/polytranscript"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            GitHub
          </a>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
};
