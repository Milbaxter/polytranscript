'use client';

import React from 'react';
import Link from 'next/link';
import { AudioWaveform } from 'lucide-react';
import { TwitterXIcon, GithubIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#070a12] text-slate-400 text-xs py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <AudioWaveform className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white">OmniTranscript</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            The next-generation multi-platform transcription, AI chaptering, and soundbite intelligence API for developers and autonomous AI agents.
          </p>
          <div className="text-[11px] text-slate-500">
            Model Context Protocol (MCP) native.
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Free SEO Tools</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/youtube-transcript-generator" className="hover:text-indigo-400 transition-colors">
                YouTube Transcript Generator
              </Link>
            </li>
            <li>
              <Link href="/tiktok-transcript-generator" className="hover:text-indigo-400 transition-colors">
                TikTok Captions & Transcript
              </Link>
            </li>
            <li>
              <Link href="/podcast-transcript-generator" className="hover:text-indigo-400 transition-colors">
                Podcast to Text (RSS / Apple / Spotify)
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-indigo-400 transition-colors">
                Universal Audio Transcriber
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Developers & Agents</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/docs" className="hover:text-indigo-400 transition-colors">
                REST API Documentation
              </Link>
            </li>
            <li>
              <Link href="/docs#mcp" className="hover:text-indigo-400 transition-colors">
                Claude & Cursor MCP Server Setup
              </Link>
            </li>
            <li>
              <Link href="/api-keys" className="hover:text-indigo-400 transition-colors">
                API Key Dashboard
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-indigo-400 transition-colors">
                Developer API Pricing
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Monetization & Open Source</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/pricing#sponsor" className="hover:text-indigo-400 transition-colors">
                Sponsor Slot Arbitrage ($11k/mo blueprint)
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/Milbaxter/omnitranscript"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                GitHub Repository
              </a>
            </li>
            <li>
              <span className="text-slate-500">MIT Open Source License</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <div>
          © {new Date().getFullYear()} OmniTranscript. Built for builders, researchers, and autonomous AI agents.
        </div>
        <div className="flex items-center gap-4">
          <span>YouTube™, TikTok™, Apple™ are trademarks of their respective owners.</span>
        </div>
      </div>
    </footer>
  );
};
