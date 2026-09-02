# PolyTranscript: Model Context Protocol (MCP) Technical Reference

PolyTranscript implements the official [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) specification, allowing autonomous AI agents to query, transcribe, and search multi-modal media streams.

## MCP Protocol Compatibility
- Protocol Version: `2024-11-05`
- Transport Layers: `stdio` (local subprocess), `SSE` (Server-Sent Events over HTTP)
- Client Compatibility: Claude Desktop, Cursor IDE, Windsurf, Antigravity CLI, LibreChat, Continue.dev

## Tool Specifications

### 1. `poly_transcribe`
Transcribes any YouTube, TikTok, Podcast, or Audio file into formatted text or JSON.

```json
{
  "name": "poly_transcribe",
  "description": "Transcribe any YouTube video, TikTok, Podcast (Apple/Spotify/RSS), or direct audio URL.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "The media URL"
      },
      "language": {
        "type": "string",
        "description": "Language code (default: en)",
        "default": "en"
      },
      "format": {
        "type": "string",
        "enum": ["markdown", "text", "json"],
        "default": "markdown"
      }
    },
    "required": ["url"]
  }
}
```

### 2. `poly_get_chapters`
Extracts and generates structured AI chapters with start timestamps, titles, summaries, and key points.

```json
{
  "name": "poly_get_chapters",
  "description": "Extract and generate smart AI chapters with timestamps for any YouTube, TikTok, or podcast media.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "The media URL"
      }
    },
    "required": ["url"]
  }
}
```

### 3. `poly_search_soundbites`
Searches across audio/video transcripts for exact moments or concepts with precise timestamps.

```json
{
  "name": "poly_search_soundbites",
  "description": "Search across audio/video transcript for exact moments, phrases, or topics and get direct timestamps.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "The media URL"
      },
      "query": {
        "type": "string",
        "description": "Search keyword or concept"
      }
    },
    "required": ["url", "query"]
  }
}
```

### 4. `poly_ask_media`
Performs grounded retrieval-augmented generation (RAG) over the media recording, answering questions with timestamp citations.

```json
{
  "name": "poly_ask_media",
  "description": "Ask any question about a video or podcast and get a grounded answer with timestamp citations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "The media URL"
      },
      "question": {
        "type": "string",
        "description": "Question to ask"
      }
    },
    "required": ["url", "question"]
  }
}
```
