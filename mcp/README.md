# PolyTranscript Model Context Protocol (MCP) Server

PolyTranscript includes a native Model Context Protocol (MCP) server that empowers any AI agent (Claude Desktop, Cursor, Antigravity, Windsurf, LangChain, LlamaIndex, OpenAI Assistants) to transcribe, search, and reason over audio and video natively.

## 🛠 Available MCP Tools

| Tool Name | Parameters | Description |
|---|---|---|
| `poly_transcribe` | `url`, `language`, `format` | Transcribes YouTube, TikTok, Podcast, or Audio file into formatted text or JSON. |
| `poly_get_chapters` | `url` | Generates timestamped AI chapters with key talking points. |
| `poly_summarize` | `url` | Returns executive TL;DR, key takeaways, action checklist, and quotes. |
| `poly_search_soundbites` | `url`, `query` | Locates exact moments and quotes with jump timestamps and relevance scores. |
| `poly_ask_media` | `url`, `question` | Grounded RAG question-answering with timestamp citations. |
| `poly_get_metadata` | `url` | Returns channel, duration, view count, platform, and upload date. |

## 🚀 Setup Instructions

### 1. Claude Desktop Setup
Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) and add:

```json
{
  "mcpServers": {
    "polytranscript": {
      "command": "/path/to/polytranscript/backend/venv/bin/python",
      "args": [
        "/path/to/polytranscript/backend/cli.py",
        "mcp"
      ]
    }
  }
}
```

### 2. Cursor IDE Setup
Add to Cursor Settings -> MCP Servers:
- **Name:** `polytranscript`
- **Type:** `command`
- **Command:** `/path/to/polytranscript/backend/venv/bin/python /path/to/polytranscript/backend/cli.py mcp`

### 3. Verification
Ask Claude or Cursor:
> *"Summarize this YouTube video and give me the top 3 soundbites with timestamps: https://www.youtube.com/watch?v=aircAruvnKk"*

The agent will invoke `poly_summarize` or `poly_get_chapters` automatically!
