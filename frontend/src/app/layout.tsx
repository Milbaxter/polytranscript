import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/Header';
import { SponsorBanner } from '../components/SponsorBanner';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'PolyTranscript | Multi-Platform Audio Intelligence & MCP Agent API',
  description: 'Transcribe YouTube, TikTok, Podcasts, and Audio with instant AI chaptering, semantic soundbite search, and Agent-ready Model Context Protocol (MCP) server.',
  keywords: [
    'youtube transcript generator',
    'tiktok captions to text',
    'podcast to text transcription',
    'mcp audio transcription',
    'model context protocol transcript',
    'ai chaptering api',
    'audio intelligence api'
  ],
  authors: [{ name: 'PolyTranscript Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Header />
        <SponsorBanner />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
