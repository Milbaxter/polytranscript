'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AudioWaveform, Key } from 'lucide-react';
import { GithubIcon } from './Icons';

export const Header: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Universal', href: '/' },
    { label: 'YouTube', href: '/youtube-transcript-generator' },
    { label: 'TikTok', href: '/tiktok-transcript-generator' },
    { label: 'Podcasts', href: '/podcast-transcript-generator' },
    { label: 'API & MCP Docs', href: '/docs' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'API Keys', href: '/api-keys' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <AudioWaveform className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Omni<span className="gradient-text">Transcript</span></span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MCP Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-1 hidden sm:block">YouTube • TikTok • Podcasts AI Intelligence</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/api-keys"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Get API Key</span>
          </Link>
          <a
            href="https://github.com/Milbaxter/omnitranscript"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg gradient-btn text-white shadow-sm"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>Star on GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
