'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, Cpu, Code2, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function DocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlExample = `curl -X POST https://api.omnitranscript.dev/api/v1/transcribe \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: omni_starter_yourkey" \\
  -d '{
    "url": "https://www.youtube.com/watch?v=aircAruvnKk",
    "language": "en",
    "include_chapters": true,
    "include_summary": true
  }'`;

  const pythonExample = `import httpx

response = httpx.post(
    "https://api.omnitranscript.dev/api/v1/transcribe",
    headers={"X-API-Key": "omni_starter_yourkey"},
    json={
        "url": "https://www.tiktok.com/@user/video/1234567890",
        "include_chapters": True,
        "include_summary": True
    },
    timeout=60.0
)

data = response.json()
print("Title:", data["metadata"]["title"])
print("Summary:", data["summary"]["tldr"])
for chapter in data["chapters"]:
    print(f"[{chapter['formatted_start']}] {chapter['title']}")`;

  const mcpConfigExample = `{
  "mcpServers": {
    "omnitranscript": {
      "command": "python",
      "args": [
        "/path/to/omnitranscript/backend/cli.py",
        "mcp"
      ]
    }
  }
}`;

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Developer Hub & Agent Integration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          OmniTranscript API & MCP Documentation
        </h1>
        <p className="text-sm text-slate-400">
          Learn how to integrate multi-platform transcription, AI chaptering, and soundbite search into your Python apps, TypeScript web apps, and Claude / Cursor AI agents.
        </p>
      </div>

      {/* Model Context Protocol (MCP) Section */}
      <section id="mcp" className="space-y-4 p-6 sm:p-8 rounded-2xl glass-panel-glow border-indigo-500/40">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm uppercase tracking-wider">
          <Cpu className="w-5 h-5 text-amber-400" />
          <span>Model Context Protocol (MCP) Integration</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Connect to Claude Desktop & Cursor IDE</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          OmniTranscript includes a native Model Context Protocol (MCP) server. When configured, AI agents can automatically invoke tools to transcribe YouTube, TikTok, and podcasts, generate AI chapters, search soundbites, and cite timestamps during chat conversations.
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Claude Desktop Config (<code>claude_desktop_config.json</code>):</span>
            <button
              onClick={() => copyCode(mcpConfigExample, 'mcp')}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              {copiedSection === 'mcp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'mcp' ? 'Copied' : 'Copy Config'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-indigo-200 overflow-x-auto">
            {mcpConfigExample}
          </pre>
        </div>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="font-semibold text-white block">omni_transcribe</span>
            <span className="text-slate-400 text-[11px]">Transcribe YouTube/TikTok/Podcast to clean markdown</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="font-semibold text-white block">omni_get_chapters</span>
            <span className="text-slate-400 text-[11px]">Generate timestamped chapters & bullet points</span>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <span className="font-semibold text-white block">omni_search_soundbites</span>
            <span className="text-slate-400 text-[11px]">Find exact quotes and moments with timestamps</span>
          </div>
        </div>
      </section>

      {/* REST API Endpoints */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white">REST API Reference</h2>

        {/* cURL Example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-white">1. Transcribe Media (cURL)</span>
            <button
              onClick={() => copyCode(curlExample, 'curl')}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              {copiedSection === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'curl' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-200 overflow-x-auto">
            {curlExample}
          </pre>
        </div>

        {/* Python Example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-white">2. Python SDK Integration</span>
            <button
              onClick={() => copyCode(pythonExample, 'python')}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              {copiedSection === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'python' ? 'Copied' : 'Copy Python'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-200 overflow-x-auto">
            {pythonExample}
          </pre>
        </div>
      </section>
    </div>
  );
}
