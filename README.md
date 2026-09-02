<div align="center">

# ⚡ PolyTranscript

### Universal Media Intelligence API & Agent-Ready Model Context Protocol (MCP) Server
**Transcribe YouTube, TikTok & Podcasts with Built-in AI Chaptering, Soundbite Search, and Native Agent Tooling**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015-black.svg)](https://nextjs.org/)
[![MCP Ready](https://img.shields.io/badge/Model%20Context%20Protocol-MCP%20Native-8A2BE2.svg)](https://modelcontextprotocol.io/)

[Features](#-key-features) • [Quickstart](#-quickstart) • [MCP Setup](#-model-context-protocol-mcp-integration) • [REST API](#-rest-api-reference) • [Monetization Playbook](#-monetization-blueprint)

---

</div>

## 💡 The Opportunity & Disruption

In August 2026, top indie builders reported **$48,000+/mo** in product revenue (`TranscriptAPI`, `YouTubeToTranscript`, `CRHQ.ai`) with over **$11,000/mo coming solely from sponsor slots on a 4.4M user transcript tool**.

However, legacy transcript SaaS tools suffer from major flaws:
1. **Single-Platform Lock-in:** Restricted strictly to YouTube; they fail completely on **TikTok**, **Apple Podcasts**, and **Spotify RSS feeds**.
2. **Fragile Scrapers:** They break frequently on IP blocks (429 errors) and lack multi-tiered fallback pipelines.
3. **No Native Agent Tooling:** They do **not** support the open **Model Context Protocol (MCP)**, blocking autonomous AI agents (Claude Desktop, Cursor, Antigravity, ChatGPT) from querying audio data.

**PolyTranscript** disrupts this space with a unified, production-grade engine that ingests **YouTube + TikTok + Podcasts**, provides **sub-second AI chaptering & semantic soundbite search**, and connects directly into **Claude & Cursor via MCP**.

---

## 🏛 Architecture Overview

```
                                  PolyTranscript Pipeline
                                  
  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
  │  YouTube Videos │   │  TikTok Videos  │   │ Apple / Spotify │   │ Direct Audio /  │
  │    & Shorts     │   │   & Shortlinks  │   │  Podcasts / RSS │   │   MP3 / M4A     │
  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
           │                     │                     │                     │
           └─────────────────────┴──────────┬──────────┴─────────────────────┘
                                            │
                                            ▼
                           ┌───────────────────────────────────┐
                           │   Resilient Multi-Tier Ingestion  │
                           │  • Fast TimedText / Direct Sub    │
                           │  • Groq Whisper-large-v3          │
                           │  • OpenAI Whisper / Local Fallback│
                           └────────────────┬──────────────────┘
                                            │
                                            ▼
                           ┌───────────────────────────────────┐
                           │      AI Intelligence Layer        │
                           │  • Dynamic AI Chaptering          │
                           │  • Semantic Soundbite Search      │
                           │  • Executive TL;DR & Action Items │
                           │  • Grounded RAG Media Q&A         │
                           └────────────────┬──────────────────┘
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      ▼                                           ▼
       ┌──────────────────────────────┐            ┌──────────────────────────────┐
       │   Agent-Ready MCP Server     │            │    REST API & SEO Web App    │
       │  • Claude Desktop            │            │  • Next.js 15 Tailwind UI    │
       │  • Cursor IDE / Antigravity  │            │  • Sponsor Banner Engine     │
       │  • LangChain / OpenAI Agents │            │  • Developer API Keys & Docs │
       └──────────────────────────────┘            └──────────────────────────────┘
```

---

## ✨ Key Features

- 🎥 **Multi-Platform Ingestion:** Instant transcript extraction for YouTube, TikTok, Apple Podcasts, Spotify show episodes, RSS XML feeds, and raw audio files.
- ⚡ **Sub-Second Latency:** Uses direct caption streams when available (200ms latency) and cascades to ultra-fast Whisper AI when audio transcription is needed.
- 📑 **AI Chaptering & Timestamps:** Automatically clusters topics into logical chapters with start timestamps, summaries, and key points.
- 🔍 **Semantic Soundbite Search:** Find exact moments, phrases, or soundbites across hours of audio with direct timestamp jumps.
- 🤖 **Native Model Context Protocol (MCP):** Connect your media transcripts directly to Claude Desktop, Cursor, or autonomous agent loops.
- 💬 **Grounded RAG Media Q&A:** Ask questions about any podcast or video and receive accurate answers with cited timestamp ranges.
- 💰 **Monetization Engine Built-In:** Turnkey sponsor banner slots ($11k/mo arbitrage model), developer API key tiering ($0, $29, $79, $299/mo), and programmatic SEO landing pages.

---

## 🚀 Quickstart

### 1. Clone & Install Backend

```bash
# Clone the repository
git clone https://github.com/Milbaxter/polytranscript.git
cd polytranscript/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run with CLI

```bash
# Transcribe any YouTube video with AI chapters & summary
python cli.py transcribe "https://www.youtube.com/watch?v=aircAruvnKk" --format markdown

# Search for exact soundbites in a video
python cli.py search "https://www.youtube.com/watch?v=aircAruvnKk" "neural network"

# Generate intelligence summary for a podcast
python cli.py summarize "https://traffic.libsyn.com/show/episode1.mp3"
```

### 3. Start REST API Server

```bash
python cli.py serve --port 8000
# OpenAPI Docs live at: http://localhost:8000/docs
```

### 4. Start Next.js Web App

```bash
cd ../frontend
npm install
npm run dev
# Web interface live at: http://localhost:3000
```

---

## 🤖 Model Context Protocol (MCP) Integration

PolyTranscript includes a native MCP server exposing rich tools to Claude Desktop, Cursor, and AI agents.

### Claude Desktop Setup
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "polytranscript": {
      "command": "/absolute/path/to/polytranscript/backend/venv/bin/python",
      "args": [
        "/absolute/path/to/polytranscript/backend/cli.py",
        "mcp"
      ]
    }
  }
}
```

### Available MCP Tools:
- `poly_transcribe(url, language, format)`: Transcribe any URL to Markdown/JSON.
- `poly_get_chapters(url)`: Extract timestamped AI chapters.
- `poly_summarize(url)`: Generate executive summary, takeaways, and action items.
- `poly_search_soundbites(url, query)`: Search for exact moments with timestamps.
- `poly_ask_media(url, question)`: Grounded RAG Q&A with timestamp citations.
- `poly_get_metadata(url)`: Extract title, author, duration, views, and platform.

---

## 📡 REST API Reference

### `POST /api/v1/transcribe`
Transcribe YouTube, TikTok, Podcast, or Audio URL.

```bash
curl -X POST http://localhost:8000/api/v1/transcribe \
  -H "Content-Type: application/json" \
  -H "X-API-Key: poly_starter_live_key" \
  -d '{
    "url": "https://www.youtube.com/watch?v=aircAruvnKk",
    "language": "en",
    "include_chapters": true,
    "include_summary": true
  }'
```

**Response Example:**
```json
{
  "metadata": {
    "title": "But what is a neural network? | Deep learning chapter 1",
    "author": "3Blue1Brown",
    "duration_seconds": 1153.0,
    "platform": "youtube",
    "url": "https://www.youtube.com/watch?v=aircAruvnKk"
  },
  "language": "en",
  "word_count": 3357,
  "processing_time_ms": 182.4,
  "chapters": [
    {
      "start": 0.0,
      "end": 148.0,
      "title": "Introduction & Context",
      "summary": "Covers key talking points from 00:00 to 02:28."
    }
  ],
  "summary": {
    "tldr": "Neural networks are mathematical functions inspired by the brain...",
    "key_takeaways": ["Neurons hold numbers between 0 and 1", "Weights represent connection strength"],
    "action_items": ["Review linear algebra foundations", "Inspect sigmoid activations"]
  },
  "segments": [
    { "start": 4.22, "end": 5.4, "text": "This is a 3." }
  ]
}
```

---

## 💰 Monetization Blueprint

Read the full **[MONETIZATION_PLAYBOOK.md](./MONETIZATION_PLAYBOOK.md)** for a deep dive into replicating the **$48,000/mo** indie hacker blueprint:
1. **High-Traffic SEO Magnets:** Capture organic search traffic via `/youtube-transcript-generator`, `/tiktok-transcript-generator`, `/podcast-transcript-generator`.
2. **Sponsor Banner Arbitrage:** Monetize top header real-estate ($500–$2,000/mo per sponsor slot).
3. **API Subscription Tiers:** Free ($0), Starter ($29/mo), Pro ($79/mo), Scale ($299/mo).
4. **Agent MCP Ecosystem:** Distribute to developers building agentic workflows on Claude Desktop and Cursor.

---

## 🐳 Docker Deployment

```bash
# Build and run both backend and frontend
docker compose up -d
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

---

## 🧪 Testing

```bash
cd backend
PYTHONPATH=. venv/bin/pytest tests/
```

---

## 📄 License

MIT License — free for personal and commercial use. Built for developers, creators, and autonomous AI agents.
