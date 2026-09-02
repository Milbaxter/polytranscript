import asyncio
import sys
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown

from app.config import settings
from app.parsers.universal import universal_parser
from app.ai.chapterer import chapter_generator
from app.ai.summarizer import summarizer
from app.ai.searcher import searcher
from app.ai.chat import chat_engine
from app.utils.formatters import format_markdown, format_srt, format_vtt

app = typer.Typer(
    name="polytranscript",
    help="⚡ Multi-Platform Media Intelligence CLI (YouTube + TikTok + Podcasts + MCP)",
    add_completion=False
)
console = Console()

@app.command()
def transcribe(
    url: str = typer.Argument(..., help="YouTube, TikTok, Podcast RSS, or Audio URL"),
    language: str = typer.Option("en", "--lang", "-l", help="Language code (e.g. en, es, fr)"),
    chapters: bool = typer.Option(True, "--chapters/--no-chapters", help="Include AI chapters"),
    summary: bool = typer.Option(True, "--summary/--no-summary", help="Include executive summary"),
    format_type: str = typer.Option("markdown", "--format", "-f", help="Output format: markdown, srt, vtt, text, json"),
    output: str = typer.Option(None, "--output", "-o", help="Save output to file")
):
    """Transcribe any YouTube, TikTok, or podcast URL into timestamped text."""
    async def _run():
        with console.status(f"[bold green]Fetching & transcribing {url}...[/bold green]"):
            transcript = await universal_parser.extract_transcript(url, language=language)
            if chapters and transcript.segments:
                transcript.chapters = await chapter_generator.generate_chapters(transcript.segments, transcript.full_text)
            if summary and transcript.full_text:
                transcript.summary = await summarizer.generate_summary(transcript)

        meta = transcript.metadata
        console.print(Panel(
            f"[bold cyan]{meta.title}[/bold cyan]\n"
            f"[yellow]Platform:[/yellow] {meta.platform.upper()} | [yellow]Words:[/yellow] {transcript.word_count} | [yellow]Lang:[/yellow] {transcript.language}\n"
            f"[dim]{meta.url}[/dim]",
            title="🎯 Media Transcribed"
        ))

        # Format output
        fmt = format_type.lower()
        if fmt in ["md", "markdown"]:
            res = format_markdown(transcript)
        elif fmt == "srt":
            res = format_srt(transcript.segments)
        elif fmt == "vtt":
            res = format_vtt(transcript.segments)
        elif fmt == "json":
            res = transcript.model_dump_json(indent=2)
        else:
            res = transcript.full_text

        if output:
            with open(output, "w") as f:
                f.write(res)
            console.print(f"[bold green]✓ Saved transcript to {output}[/bold green]")
        else:
            if fmt == "markdown":
                console.print(Markdown(res))
            else:
                console.print(res)

    asyncio.run(_run())

@app.command()
def search(
    url: str = typer.Argument(..., help="Media URL"),
    query: str = typer.Argument(..., help="Search phrase or keyword")
):
    """Search for exact soundbites and timestamp moments within media transcript."""
    async def _run():
        with console.status("[bold green]Searching transcript...[/bold green]"):
            transcript = await universal_parser.extract_transcript(url)
            results = searcher.search(transcript.segments, query)

        table = Table(title=f"Soundbite Search: '{query}' ({len(results.hits)} matches)")
        table.add_column("Timestamp", style="cyan bold", width=12)
        table.add_column("Snippet", style="white")
        table.add_column("Score", style="magenta", justify="right")

        for hit in results.hits:
            table.add_row(f"[{hit.formatted_start}]", hit.text, f"{hit.score:.1f}")

        console.print(table)

    asyncio.run(_run())

@app.command()
def summarize(
    url: str = typer.Argument(..., help="Media URL to summarize")
):
    """Generate executive TL;DR, key takeaways, soundbites, and action items."""
    async def _run():
        with console.status("[bold green]Generating intelligence summary...[/bold green]"):
            transcript = await universal_parser.extract_transcript(url)
            summary_res = await summarizer.generate_summary(transcript)

        console.print(Panel(f"[bold]{summary_res.tldr}[/bold]", title="⚡ Executive TL;DR", border_style="green"))
        
        console.print("\n[bold yellow]🎯 Key Takeaways:[/bold yellow]")
        for t in summary_res.key_takeaways:
            console.print(f"  • {t}")

        console.print("\n[bold cyan]🛠 Action Items:[/bold cyan]")
        for a in summary_res.action_items:
            console.print(f"  [ ] {a}")

        console.print("\n[bold magenta]💬 Notable Quotes:[/bold magenta]")
        for q in summary_res.soundbites:
            console.print(f"  > {q}")

    asyncio.run(_run())

@app.command()
def chat(
    url: str = typer.Argument(..., help="Media URL"),
    question: str = typer.Argument(..., help="Question to ask about the recording")
):
    """Ask a question about the video/podcast and receive a grounded answer with timestamp citations."""
    async def _run():
        with console.status("[bold green]Analyzing transcript & answering...[/bold green]"):
            transcript = await universal_parser.extract_transcript(url)
            ans = await chat_engine.answer_question(question, transcript.full_text, transcript.segments)

        console.print(Panel(ans.answer, title=f"🤖 Answer: '{question}'", border_style="cyan"))
        if ans.relevant_timestamps:
            console.print("\n[bold yellow]Timestamp Citations:[/bold yellow]")
            for c in ans.relevant_timestamps:
                console.print(f"  • [cyan][{c['formatted_start']}][/cyan] \"{c['text']}\"")

    asyncio.run(_run())

@app.command()
def serve(
    host: str = typer.Option("0.0.0.0", "--host", "-h"),
    port: int = typer.Option(8000, "--port", "-p"),
    reload: bool = typer.Option(True, "--reload/--no-reload")
):
    """Start the PolyTranscript REST API server."""
    import uvicorn
    console.print(f"[bold green]Starting PolyTranscript API on http://{host}:{port}...[/bold green]")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)

@app.command()
def mcp():
    """Start the Model Context Protocol (MCP) server over stdio for AI agents."""
    from app.mcp_server import mcp as mcp_instance
    console.print("[bold green]Starting PolyTranscript MCP Server (stdio)...[/bold green]", file=sys.stderr)
    mcp_instance.run(transport="stdio")

if __name__ == "__main__":
    app()
