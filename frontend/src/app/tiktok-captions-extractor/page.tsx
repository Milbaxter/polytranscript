'use client';

import React, { useState } from 'react';
import { MediaInput } from '../../components/MediaInput';
import { InteractivePlayer } from '../../components/InteractivePlayer';
import { TranscriptViewer } from '../../components/TranscriptViewer';
import { ExportMenu } from '../../components/ExportMenu';
import { StructuredData } from '../../components/StructuredData';
import { transcribeMedia } from '../../lib/api';
import { TranscriptResponse } from '../../lib/types';
import { TikTokIcon } from '../../components/Icons';

export default function TikTokCaptionsPage() {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I extract captions from a TikTok video?',
      answer: 'Copy the TikTok video link (or vm.tiktok.com shortlink), paste it above, and click Transcribe. The spoken text and captions are extracted in seconds.',
    },
    {
      question: 'Can I copy TikTok text to ChatGPT or Claude?',
      answer: 'Yes, click "Copy for AI / Claude" to get clean, prompt-ready text from the TikTok audio.',
    },
  ];

  const handleTranscribe = async (url: string, options: { language: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await transcribeMedia(url, options);
      setTranscript(res);
    } catch (err: any) {
      setError(err.message || 'Failed to extract TikTok captions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <StructuredData
        title="TikTok Captions Extractor Online | PolyTranscript"
        description="Extract closed captions and spoken text from TikTok videos and shortlinks for free. Fast online AI transcription."
        url="https://polytranscript.com/tiktok-captions-extractor"
        faqs={faqs}
      />

      <section className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold">
          <TikTokIcon className="w-3.5 h-3.5 text-pink-500" />
          <span>TikTok Closed Captions to Text</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto">
          Free <span className="text-pink-500">TikTok Captions</span> Extractor & Transcriber
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Rip captions and spoken audio from any TikTok clip, viral soundbite, or mobile link. Export to SRT, TXT, or Markdown instantly.
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
            <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
              <ExportMenu transcript={transcript} />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl glass-panel p-6 border border-white/10">
              <TranscriptViewer segments={transcript.segments} onSeek={setSeekTime} activeTime={seekTime} />
            </div>
          </div>
        </section>
      )}

      <section className="pt-12 border-t border-white/10 space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 gap-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
              <h3 className="font-semibold text-white text-sm">{faq.question}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
