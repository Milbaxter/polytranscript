'use client';

import React, { useState } from 'react';
import { TranscriptResponse } from '../lib/types';
import { Download, Copy, Check, FileText, Code, Sparkles } from 'lucide-react';

interface ExportMenuProps {
  transcript: TranscriptResponse;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ transcript }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(label);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getMarkdown = () => {
    const m = transcript.metadata;
    let md = `# ${m.title}\n**Source:** ${m.url} | **Words:** ${transcript.word_count}\n\n`;
    if (transcript.summary) {
      md += `## ⚡ Executive Summary\n${transcript.summary.tldr}\n\n`;
    }
    if (transcript.chapters && transcript.chapters.length > 0) {
      md += `## 📑 Chapters\n`;
      transcript.chapters.forEach((c) => {
        md += `### [${c.formatted_start || c.start}s] ${c.title}\n${c.summary}\n\n`;
      });
    }
    md += `## 📝 Transcript\n`;
    transcript.segments.forEach((s) => {
      md += `[${s.formatted_start || s.start}s] ${s.text}\n\n`;
    });
    return md;
  };

  const getSRT = () => {
    return transcript.segments
      .map((s, idx) => {
        const formatTime = (secs: number) => {
          const m = Math.floor(secs / 60);
          const h = Math.floor(m / 60);
          const sRem = Math.floor(secs % 60);
          const ms = Math.floor((secs - Math.floor(secs)) * 1000);
          return `${h.toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}:${sRem.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
        };
        return `${idx + 1}\n${formatTime(s.start)} --> ${formatTime(s.end)}\n${s.text}\n`;
      })
      .join('\n');
  };

  const getLLMPrompt = () => {
    return `<MEDIA_TRANSCRIPT title="${transcript.metadata.title}" url="${transcript.metadata.url}">\n${transcript.full_text}\n</MEDIA_TRANSCRIPT>\n\nPlease analyze this transcript.`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => copyToClipboard(getMarkdown(), 'md')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copiedType === 'md' ? 'Copied Markdown' : 'Copy Markdown'}</span>
      </button>

      <button
        onClick={() => copyToClipboard(getLLMPrompt(), 'prompt')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
      >
        {copiedType === 'prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
        <span>{copiedType === 'prompt' ? 'Copied LLM Prompt' : 'Copy for AI / Claude'}</span>
      </button>

      <button
        onClick={() => downloadFile(getSRT(), `${transcript.metadata.title || 'transcript'}.srt`, 'text/plain')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download SRT</span>
      </button>

      <button
        onClick={() => downloadFile(JSON.stringify(transcript, null, 2), `${transcript.metadata.title || 'transcript'}.json`, 'application/json')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <Code className="w-3.5 h-3.5" />
        <span>JSON</span>
      </button>
    </div>
  );
};
