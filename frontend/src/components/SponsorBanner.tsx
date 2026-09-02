'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { getSponsorInfo } from '../lib/api';
import { SponsorInfo } from '../lib/types';

export const SponsorBanner: React.FC = () => {
  const [sponsor, setSponsor] = useState<SponsorInfo | null>(null);

  useEffect(() => {
    getSponsorInfo().then(setSponsor).catch(() => {});
  }, []);

  if (!sponsor || !sponsor.enabled) return null;

  return (
    <div className="w-full bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border-b border-indigo-500/20 py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            {sponsor.badge}
          </span>
          <span className="text-slate-300 font-medium">{sponsor.text}</span>
        </div>
        <Link
          href={sponsor.link}
          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold hover:underline group"
        >
          <span>Claim Sponsor Slot</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
