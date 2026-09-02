import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SponsorBanner } from '../components/SponsorBanner';

export const metadata: Metadata = {
  metadataBase: new URL('https://polytranscript.com'),
  title: 'PolyTranscript | Multi-Platform Transcript & MCP API',
  description: 'Instant YouTube, TikTok, Podcast, and Audio transcription API and Model Context Protocol (MCP) server for Claude Desktop and Cursor.',
  authors: [{ name: 'PolyTranscript Team' }],
  keywords: [
    'youtube transcript generator',
    'tiktok captions to text',
    'podcast to text transcription',
    'mcp audio transcription',
    'model context protocol transcript',
    'claude mcp audio server',
    'audio intelligence api',
  ],
  alternates: {
    canonical: 'https://polytranscript.com',
  },
  openGraph: {
    title: 'PolyTranscript | Multi-Platform Transcript & MCP API',
    description: 'Instant YouTube, TikTok, Podcast & Audio transcription API and Model Context Protocol (MCP) server.',
    url: 'https://polytranscript.com',
    siteName: 'PolyTranscript',
    type: 'website',
    images: [
      {
        url: 'https://polytranscript.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PolyTranscript Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PolyTranscript | Multi-Platform Transcript & MCP API',
    description: 'Instant YouTube, TikTok, Podcast & Audio transcription API and Model Context Protocol (MCP) server.',
    creator: '@Milbaxter',
  },
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
