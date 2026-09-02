import asyncio
import json
import logging
from mcp.server.fastmcp import FastMCP

from app.parsers.universal import universal_parser
from app.ai.chapterer import chapter_generator
from app.ai.summarizer import summarizer
from app.ai.searcher import searcher
from app.ai.chat import chat_engine
from app.utils.formatters import format_markdown

# Initialize FastMCP Server
mcp = FastMCP("polytranscript-mcp")

@mcp.tool()
async def poly_transcribe(url: str, language: str = "en", format: str = "markdown") -> str:
    """
    Transcribe any YouTube video, TikTok, Podcast (Apple/Spotify/RSS), or direct audio URL.
    Returns clean timestamped transcript text.
    
    Args:
        url: The media URL (e.g. YouTube, TikTok, or podcast link)
        language: Optional language code (default 'en')
        format: 'markdown', 'text', or 'json'
    """
    try:
        transcript = await universal_parser.extract_transcript(url, language=language)
        if format == "markdown":
            return format_markdown(transcript)
        elif format == "json":
            return transcript.model_dump_json(indent=2)
        return transcript.full_text
    except Exception as e:
        return f"Error transcribing media from '{url}': {str(e)}"

@mcp.tool()
async def poly_get_chapters(url: str) -> str:
    """
    Extract and generate smart AI chapters with timestamps for any YouTube, TikTok, or podcast media.
    
    Args:
        url: The media URL
    """
    try:
        transcript = await universal_parser.extract_transcript(url)
        chapters = await chapter_generator.generate_chapters(transcript.segments, transcript.full_text)
        
        output = [f"# Chapters for {transcript.metadata.title}\n"]
        for c in chapters:
            output.append(f"### [{c.formatted_start}] {c.title}")
            output.append(f"{c.summary}")
            if c.key_points:
                for kp in c.key_points:
                    output.append(f"- {kp}")
            output.append("")
        return "\n".join(output)
    except Exception as e:
        return f"Error extracting chapters for '{url}': {str(e)}"

@mcp.tool()
async def poly_summarize(url: str) -> str:
    """
    Generate an executive summary, key takeaways, action items, and soundbites from any video or podcast URL.
    
    Args:
        url: The media URL
    """
    try:
        transcript = await universal_parser.extract_transcript(url)
        summary = await summarizer.generate_summary(transcript)
        
        output = [
            f"# Executive Summary: {transcript.metadata.title}",
            f"**Source:** {url}\n",
            f"## ⚡ TL;DR\n{summary.tldr}\n",
            "## 🎯 Key Takeaways",
            *[f"- {t}" for t in summary.key_takeaways],
            "\n## 🛠 Action Items",
            *[f"- [ ] {a}" for a in summary.action_items],
            "\n## 💬 Notable Quotes",
            *[f"> {q}" for q in summary.soundbites]
        ]
        return "\n".join(output)
    except Exception as e:
        return f"Error summarizing media from '{url}': {str(e)}"

@mcp.tool()
async def poly_search_soundbites(url: str, query: str) -> str:
    """
    Search across audio/video transcript for exact moments, phrases, or topics and get direct timestamps.
    
    Args:
        url: The media URL
        query: Search term or concept
    """
    try:
        transcript = await universal_parser.extract_transcript(url)
        search_res = searcher.search(transcript.segments, query, top_k=10)
        
        output = [f"# Search Results for \"{query}\" in {transcript.metadata.title}\n"]
        if not search_res.hits:
            return f"No matches found for '{query}' in '{transcript.metadata.title}'."
            
        for h in search_res.hits:
            output.append(f"- `[{h.formatted_start}]` {h.text} *(relevance: {h.score})*")
        return "\n".join(output)
    except Exception as e:
        return f"Error searching soundbites in '{url}': {str(e)}"

@mcp.tool()
async def poly_ask_media(url: str, question: str) -> str:
    """
    Ask any question about a video or podcast and get a grounded answer with timestamp citations.
    
    Args:
        url: The media URL
        question: The user's question
    """
    try:
        transcript = await universal_parser.extract_transcript(url)
        res = await chat_engine.answer_question(question, transcript.full_text, transcript.segments)
        
        output = [f"**Answer:**\n{res.answer}\n"]
        if res.relevant_timestamps:
            output.append("**Timestamp Citations:**")
            for c in res.relevant_timestamps:
                output.append(f"- `[{c['formatted_start']}]` \"{c['text']}\"")
        return "\n".join(output)
    except Exception as e:
        return f"Error answering question for '{url}': {str(e)}"

@mcp.tool()
async def poly_get_metadata(url: str) -> str:
    """
    Get metadata for any media URL (title, author, duration, views, platform, thumbnail).
    
    Args:
        url: The media URL
    """
    try:
        meta = await universal_parser.extract_metadata(url)
        return meta.model_dump_json(indent=2)
    except Exception as e:
        return f"Error fetching metadata for '{url}': {str(e)}"

if __name__ == "__main__":
    mcp.run(transport="stdio")
