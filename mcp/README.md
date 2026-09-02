# OmniTranscript Model Context Protocol (MCP) Server

OmniTranscript includes a native Model Context Protocol (MCP) server that empowers any AI agent (Claude Desktop, Cursor, Antigravity, Windsurf, LangChain, LlamaIndex, OpenAI Assistants) to transcribe, search, and reason over audio and video natively.

## 🛠 Available MCP Tools

| Tool Name | Parameters | Description |
|---|---|---|
| `omni_transcribe` | `url`, `language`, `format` | Transcribes YouTube, TikTok, Podcast, or Audio file into formatted text or JSON. |
| `omni_get_chapters` | `url` | Generates timestamped AI chapters with key talking points. |
| `omni_summarize` | `url` | Returns executive TL;DR, key takeaways, action checklist, and quotes. |
| `omni_search_soundbites` | `url`, `query` | Locates exact moments and quotes with jump timestamps and relevance scores. |
| `omni_ask_media` | `url`, `question` | Grounded RAG question-answering with timestamp citations. |
| `omni_get_metadata` | `url` | Returns channel, duration, view count, platform, and upload date. |

## 🚀 Setup Instructions

### 1. Claude Desktop Setup
Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) and add:

```json
{
  "mcpServers": {
    "omnitranscript": {
      "command": "/path/to/omnitranscript/backend/venv/bin/python",
      "args": [
        "/path/to/omnitranscript/backend/cli.py",
        "mcp"
      ]
    }
  }
}
```

### 2. Cursor IDE Setup
Add to Cursor Settings -> MCP Servers:
- **Name:** `omnitranscript`
- **Type:** `command`
- **Command:** `/path/to/omnitranscript/backend/venv/bin/python /path/to/omnitranscript/backend/cli.py mcp`

### 3. Verification
Ask Claude or Cursor:
> *"Summarize this YouTube video and give me the top 3 soundbites with timestamps: https://www.youtube.com/watch?v=aircAruvnKk"*

The agent will invoke `omni_summarize` or `omni_get_chapters` automatically!
