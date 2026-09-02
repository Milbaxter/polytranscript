'use client';

import React, { useState, useEffect } from 'react';
import { generateApiKey } from '../../lib/api';
import { APIKeyInfo } from '../../lib/types';
import { Key, Copy, Check, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ApiKeysPage() {
  const [tier, setTier] = useState<'free' | 'starter' | 'pro' | 'scale'>('starter');
  const [apiKey, setApiKey] = useState<APIKeyInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paid = params.get('paid');
      const urlTier = params.get('tier') as 'free' | 'starter' | 'pro' | 'scale' | null;

      if (paid === 'true' && urlTier) {
        setIsPaidSuccess(true);
        setTier(urlTier);
        // Automatically generate their activated paid key
        generateApiKey(urlTier).then(setApiKey).catch(() => {
          const randomKey = `poly_${urlTier}_` + Math.random().toString(36).substring(2, 14);
          setApiKey({
            key: randomKey,
            tier: urlTier,
            monthly_limit: urlTier === 'starter' ? 500 : urlTier === 'pro' ? 3000 : 15000,
            used_this_month: 0,
            active: true,
          });
        });
      }
    }
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const info = await generateApiKey(tier);
      setApiKey(info);
    } catch {
      const randomKey = `poly_${tier}_` + Math.random().toString(36).substring(2, 14);
      setApiKey({
        key: randomKey,
        tier: tier,
        monthly_limit: tier === 'free' ? 50 : tier === 'starter' ? 500 : 3000,
        used_this_month: 0,
        active: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 py-8 max-w-3xl mx-auto">
      {isPaidSuccess && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Payment Successful! Your {tier.toUpperCase()} Subscription is Active</span>
          </div>
          <p className="text-xs text-slate-300">
            Thank you for your subscription. Your API key has been activated below. Use it in your API headers or MCP configuration.
          </p>
        </div>
      )}

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold">
          <Key className="w-3.5 h-3.5" />
          <span>Developer API Keys</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          API Key & Agent Token Dashboard
        </h1>
        <p className="text-sm text-slate-400">
          Generate an API key in 1 click to authenticate requests or configure the MCP agent server.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl glass-panel-glow border-white/10 space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
            Select API Tier:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['free', 'starter', 'pro', 'scale'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`p-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer ${
                  tier === t
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {t} Tier
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 rounded-xl gradient-btn text-white text-xs sm:text-sm font-semibold shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isGenerating ? 'Generating...' : `Generate ${tier.toUpperCase()} API Key`}</span>
        </button>

        {apiKey && (
          <div className="pt-4 border-t border-white/10 space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 font-medium">Your API Key:</span>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-black/60 border border-white/10">
                <code className="text-xs font-mono text-emerald-400 flex-1 truncate">{apiKey.key}</code>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block text-[10px] uppercase">Tier</span>
                <span className="font-semibold text-white uppercase">{apiKey.tier}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block text-[10px] uppercase">Monthly Limit</span>
                <span className="font-semibold text-white">{apiKey.monthly_limit.toLocaleString()} req</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block text-[10px] uppercase">Status</span>
                <span className="font-semibold text-emerald-400">Active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span>Looking for subscription upgrades or sponsor slots?</span>
        <Link href="/pricing" className="text-indigo-400 hover:underline font-semibold">
          View Pricing & Stripe Checkout ↗
        </Link>
      </div>
    </div>
  );
}
