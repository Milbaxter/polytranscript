import pytest
from app.parsers.youtube import youtube_parser
from app.parsers.tiktok import tiktok_parser
from app.parsers.podcast import podcast_parser
from app.parsers.universal import universal_parser
from app.ai.chapterer import chapter_generator
from app.ai.summarizer import summarizer
from app.ai.searcher import searcher
from app.models import TranscriptSegment, TranscriptResponse, MediaMetadata

def test_url_detection():
    # YouTube URLs
    assert youtube_parser.can_handle("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert youtube_parser.can_handle("https://youtu.be/dQw4w9WgXcQ")
    assert youtube_parser.can_handle("https://youtube.com/shorts/dQw4w9WgXcQ")
    assert youtube_parser.extract_video_id("https://youtu.be/dQw4w9WgXcQ") == "dQw4w9WgXcQ"

    # TikTok URLs
    assert tiktok_parser.can_handle("https://www.tiktok.com/@user/video/1234567890123456789")
    assert tiktok_parser.can_handle("https://vm.tiktok.com/ZM8123456/")
    assert tiktok_parser.can_handle("https://vt.tiktok.com/ZS8123456/")

    # Podcast URLs
    assert podcast_parser.can_handle("https://podcasts.apple.com/us/podcast/id123456789?i=1000123456")
    assert podcast_parser.can_handle("https://feeds.simplecast.com/54nAGcIl")
    assert podcast_parser.can_handle("https://traffic.libsyn.com/show/episode1.mp3")

    # Universal Dispatcher
    p_yt = universal_parser.get_parser("https://youtu.be/dQw4w9WgXcQ")
    assert p_yt == youtube_parser
    p_tk = universal_parser.get_parser("https://www.tiktok.com/@user/video/12345")
    assert p_tk == tiktok_parser

def test_searcher():
    segments = [
        TranscriptSegment(start=0.0, end=10.0, text="In this episode we discuss artificial intelligence agents and MCP."),
        TranscriptSegment(start=10.0, end=20.0, text="Autonomous systems need rich multi-modal context."),
        TranscriptSegment(start=20.0, end=30.0, text="Model Context Protocol MCP enables seamless tool invocation.")
    ]

    res = searcher.search(segments, "MCP")
    assert res.total_matches >= 2
    assert res.hits[0].segment_index in [0, 2]

    res_context = searcher.search(segments, "autonomous context")
    assert res_context.total_matches >= 1

    res_empty = searcher.search(segments, "nonexistentwordxyz")
    assert res_empty.total_matches == 0

@pytest.mark.asyncio
async def test_chapter_and_summary_generators():
    segments = [
        TranscriptSegment(start=0.0, end=60.0, text="Introduction to scalable transcription architectures and audio parsing."),
        TranscriptSegment(start=60.0, end=180.0, text="Comparing YouTube caption extractors with direct Whisper streaming pipelines."),
        TranscriptSegment(start=180.0, end=300.0, text="Monetization blueprints and building high-traffic SEO landing pages."),
        TranscriptSegment(start=300.0, end=450.0, text="Conclusion and next steps for deploying MCP servers in production.")
    ]
    full_text = " ".join([s.text for s in segments])

    chapters = await chapter_generator.generate_chapters(segments, full_text)
    assert len(chapters) >= 2
    assert chapters[0].start == 0.0

    mock_transcript = TranscriptResponse(
        metadata=MediaMetadata(title="Scaling AI Transcription", platform="youtube", url="https://youtu.be/demo"),
        language="en",
        full_text=full_text,
        segments=segments,
        word_count=len(full_text.split())
    )

    summary = await summarizer.generate_summary(mock_transcript)
    assert len(summary.tldr) > 0
    assert len(summary.key_takeaways) > 0
