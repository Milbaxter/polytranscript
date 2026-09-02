'use client';

import React, { useState } from 'react';
import { MediaInput } from '../../components/MediaInput';
import { InteractivePlayer } from '../../components/InteractivePlayer';
import { TranscriptViewer } from '../../components/TranscriptViewer';
import { ExportMenu } from '../../components/ExportMenu';
import { StructuredData } from '../../components/StructuredData';
import { transcribeMedia } from '../../lib/api';
import { TranscriptResponse } from '../../lib/types';
import { FileText, Download } from 'lucide-react';

export default function YouTubeToSrtPage() {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I convert a YouTube video to an SRT subtitle file?',
      answer: 'Paste your YouTube video URL, click Transcribe, and click "Download SRT". The file will immediately download to your device with properly formatted SubRip timestamps.',
    },
    {
      question: 'Does this work for auto-generated captions?',
      answer: 'Yes! PolyTranscript extracts both creator-uploaded manual subtitles and automatic captions.',
    },
  ];

  const handleTranscribe = async (url: string, options: { language: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await transcribeMedia(url, options);
      setTranscript(res);
    } catch (err: any) {
      setError(err.message || 'Failed to convert YouTube to SRT.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <StructuredData
        title="YouTube to SRT Subtitle Converter | PolyTranscript"
        description="Convert any YouTube video to an SRT or VTT subtitle file online. Instant, accurate timestamped captions."
        url="https://polytranscript.com/youtube-to-srt-converter"
        faqs={faqs}
      />

      <section className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>YouTube to Subtitles (.SRT / .VTT)</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto">
          Free <span className="gradient-text">YouTube to SRT</span> Subtitle Converter
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Download accurate, millisecond-precise SRT and WebVTT subtitle files from any YouTube video in seconds.
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
