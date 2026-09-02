'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap, Shield, HelpCircle, ArrowRight, Key, Flame } from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const tiers = [
    {
      name: 'Free / Community',
      price: '$0',
      description: 'Perfect for indie hackers, students, and casual prototyping.',
      features: [
        '50 API requests / month',
        'YouTube timedtext captions',
        'TikTok video parsing',
        'Basic AI summaries',
        'Model Context Protocol (MCP) local stdio',
        'Community Discord & GitHub support',
      ],
      cta: 'Get Free Key',
      href: '/api-keys',
      popular: false,
    },
    {
      name: 'Starter',
      price: billingCycle === 'monthly' ? '$29' : '$24',
      period: '/ month',
      description: 'Ideal for early-stage AI agent builders and automated content workflows.',
      features: [
        '500 requests / month',
        'YouTube + TikTok + Podcasts (Apple & Spotify)',
        'Automated AI Chaptering & Timestamps',
        'Semantic Soundbite Search API',
        'Sub-second transcription response time',
        'Standard Rate Limits (60 req/min)',
        'Email & Developer Support',
      ],
      cta: 'Start Starter Plan',
      href: '/api-keys?tier=starter',
      popular: false,
    },
    {
      name: 'Pro (Most Popular)',
      price: billingCycle === 'monthly' ? '$79' : '$64',
      period: '/ month',
      description: 'For growing SaaS apps, autonomous AI agents, and content intelligence platforms.',
      features: [
        '3,000 requests / month',
        'All Starter features included',
        'Whisper AI audio fallback for videos without captions',
        'Direct MP3 / M4A / WAV file uploads',
        'Speaker Diarization support',
        'Grounded RAG Q&A endpoint',
        'High concurrency (300 req/min)',
        'Priority Slack / Discord channel',
      ],
      cta: 'Upgrade to Pro',
      href: '/api-keys?tier=pro',
      popular: true,
    },
    {
      name: 'Scale / Agency',
      price: billingCycle === 'monthly' ? '$299' : '$249',
      period: '/ month',
      description: 'High-throughput enterprise infrastructure for large data pipelines & AI apps.',
      features: [
        '15,000 requests / month',
        'Custom Webhook callbacks for bulk jobs',
        'Dedicated proxy rotation infrastructure (0% 429 rate)',
        'Custom AI Chaptering schemas & prompts',
        'Unlimited concurrency',
        '99.9% Uptime SLA',
        '1-on-1 Engineering integration support',
      ],
      cta: 'Contact Sales / Subscribe',
      href: '/api-keys?tier=scale',
      popular: false,
    },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Simple, Transparent Pricing</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Developer API & Agent Infrastructure
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Scale your transcription and multi-platform media intelligence with zero infrastructure headaches.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-xs font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 rounded-full bg-indigo-600/40 p-0.5 border border-indigo-500/50 transition-colors relative"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6 bg-indigo-400' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
            Yearly <span className="text-[10px] text-emerald-400 font-bold ml-1">Save 20%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((t, idx) => (
          <div
            key={idx}
            className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all ${
              t.popular
                ? 'glass-panel-glow border-indigo-500/50 shadow-indigo-500/20 shadow-xl'
                : 'glass-panel border-white/10'
            }`}
          >
            {t.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                Most Popular
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">{t.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">{t.price}</span>
                {t.period && <span className="text-xs text-slate-400">{t.period}</span>}
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Features:</span>
                <ul className="space-y-2">
                  {t.features.map((feat, fIdx) => (
                    <li key={fIdx} className="text-xs text-slate-300 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href={t.href}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  t.popular ? 'gradient-btn text-white shadow-md' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span>{t.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Sponsor Monetization Blueprint Section ($11k/mo Arbitrage Model) */}
      <section id="sponsor" className="p-8 sm:p-12 rounded-3xl glass-panel-glow border-purple-500/30 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Sponsorship & Traffic Monetization</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Sponsor the Top Header Slot ($500 / month)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Reach over 100,000+ monthly AI developers, content creators, and researchers actively transcribing media. Guaranteed top-of-page banner with direct link and UTM tracking.
            </p>
          </div>
          <a
            href="mailto:sponsor@omnitranscript.dev?subject=Sponsor Slot Inquiry"
            className="px-6 py-3 rounded-xl gradient-btn text-white text-xs font-semibold whitespace-nowrap shadow-lg flex items-center gap-2"
          >
            <span>Book Sponsor Banner</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
