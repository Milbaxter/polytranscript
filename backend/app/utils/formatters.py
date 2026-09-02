from typing import List
from app.models import TranscriptResponse, TranscriptSegment

def format_timestamp_srt(seconds: float) -> str:
    mins, secs = divmod(int(seconds), 60)
    hours, mins = divmod(mins, 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{mins:02d}:{secs:02d},{millis:03d}"

def format_timestamp_vtt(seconds: float) -> str:
    mins, secs = divmod(int(seconds), 60)
    hours, mins = divmod(mins, 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{mins:02d}:{secs:02d}.{millis:03d}"

def format_srt(segments: List[TranscriptSegment]) -> str:
    lines = []
    for idx, seg in enumerate(segments, 1):
        lines.append(str(idx))
        lines.append(f"{format_timestamp_srt(seg.start)} --> {format_timestamp_srt(seg.end)}")
        lines.append(seg.text)
        lines.append("")
    return "\n".join(lines)

def format_vtt(segments: List[TranscriptSegment]) -> str:
    lines = ["WEBVTT", ""]
    for idx, seg in enumerate(segments, 1):
        lines.append(f"{format_timestamp_vtt(seg.start)} --> {format_timestamp_vtt(seg.end)}")
        lines.append(seg.text)
        lines.append("")
    return "\n".join(lines)

def format_markdown(transcript: TranscriptResponse) -> str:
    meta = transcript.metadata
    lines = [
        f"# {meta.title}",
        f"**Author / Channel:** {meta.author}  ",
        f"**Platform:** {meta.platform.upper()} | **Language:** {transcript.language} | **Words:** {transcript.word_count}  ",
        f"**Source URL:** [{meta.url}]({meta.url})",
        "",
        "---",
        ""
    ]

    if transcript.summary:
        s = transcript.summary
        lines.extend([
            "## ⚡ Executive Summary (TL;DR)",
            s.tldr,
            "",
            "### 🎯 Key Takeaways",
            *[f"- {item}" for item in s.key_takeaways],
            "",
            "### 🛠 Action Items",
            *[f"- [ ] {item}" for item in s.action_items],
            "",
            "### 💬 Notable Quotes",
            *[f"> {quote}" for quote in s.soundbites],
            "",
            "---",
            ""
        ])

    if transcript.chapters:
        lines.extend([
            "## 📑 Chapters & Timestamps",
            ""
        ])
        for c in transcript.chapters:
            lines.append(f"### `[{c.formatted_start}]` {c.title}")
            lines.append(f"{c.summary}")
            if c.key_points:
                lines.extend([f"- {kp}" for kp in c.key_points])
            lines.append("")
        lines.extend(["---", ""])

    lines.extend([
        "## 📝 Full Transcript",
        ""
    ])
    for seg in transcript.segments:
        speaker_prefix = f"**[{seg.speaker}]** " if seg.speaker else ""
        lines.append(f"`[{seg.formatted_start}]` {speaker_prefix}{seg.text}")

    return "\n".join(lines)

def format_llm_prompt(transcript: TranscriptResponse) -> str:
    meta = transcript.metadata
    return f"""<MEDIA_TRANSCRIPT>
Title: {meta.title}
Author: {meta.author}
Platform: {meta.platform}
Duration: {meta.duration_seconds or 'Unknown'} seconds
URL: {meta.url}

Content:
{transcript.full_text}
</MEDIA_TRANSCRIPT>

Please analyze this transcript and provide key insights."""
