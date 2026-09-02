import json
import math
from typing import List
from app.models import Chapter, TranscriptSegment
from app.config import settings

class ChapterGenerator:
    async def generate_chapters(self, segments: List[TranscriptSegment], full_text: str) -> List[Chapter]:
        if not segments:
            return []

        # 1. Try LLM if API Key available (OpenAI or Groq)
        if settings.OPENAI_API_KEY or settings.GROQ_API_KEY:
            try:
                llm_chapters = await self._generate_with_llm(segments)
                if llm_chapters:
                    return llm_chapters
            except Exception as e:
                print(f"[Chapterer] LLM generation failed, using heuristic: {e}")

        # 2. Resilient Rule-Based / Heuristic Semantic Chunking
        return self._heuristic_chapters(segments)

    async def _generate_with_llm(self, segments: List[TranscriptSegment]) -> List[Chapter]:
        from openai import AsyncOpenAI
        
        # Prepare sample with timestamps
        formatted_segments = []
        for s in segments[::max(1, len(segments) // 40)]:  # sample representative timestamps
            formatted_segments.append(f"[{s.formatted_start}] {s.text[:100]}")

        prompt = f"""You are an expert audio editor and content strategist.
Given the following timestamped transcript excerpts, create 4 to 8 clear, high-value chapters with timestamps.

Transcript sample:
{chr(10).join(formatted_segments[:50])}

Return a valid JSON array of objects with the exact structure:
[
  {{
    "start": 0.0,
    "end": 120.0,
    "title": "Introduction & Overview",
    "summary": "Brief 1-sentence chapter description",
    "key_points": ["Key point 1", "Key point 2"]
  }}
]
Only return JSON, nothing else."""

        if settings.GROQ_API_KEY:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            resp = await client.chat.completions.create(
                model=settings.DEFAULT_FAST_LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw = resp.choices[0].message.content
        else:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            resp = await client.chat.completions.create(
                model=settings.DEFAULT_LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw = resp.choices[0].message.content

        data = json.loads(raw)
        items = data.get("chapters", data) if isinstance(data, dict) else data
        if not isinstance(items, list):
            items = list(data.values())[0] if isinstance(data, dict) else []

        chapters = []
        for it in items:
            chapters.append(Chapter(
                start=float(it.get("start", 0.0)),
                end=float(it.get("end", 0.0)),
                title=it.get("title", "Chapter"),
                summary=it.get("summary", ""),
                key_points=it.get("key_points", [])
            ))
        return chapters

    def _heuristic_chapters(self, segments: List[TranscriptSegment]) -> List[Chapter]:
        total_duration = segments[-1].end - segments[0].start if segments else 0
        if total_duration <= 0:
            total_duration = max(60.0, len(segments) * 3.0)

        # Target between 3 and 7 chapters based on duration
        num_chapters = max(2, min(7, int(total_duration // 180) + 1))
        chunk_size = len(segments) // num_chapters if num_chapters > 0 else len(segments)
        
        chapters = []
        for i in range(num_chapters):
            start_idx = i * chunk_size
            end_idx = min(len(segments), (i + 1) * chunk_size if i < num_chapters - 1 else len(segments))
            seg_slice = segments[start_idx:end_idx]
            if not seg_slice:
                continue

            start_t = seg_slice[0].start
            end_t = seg_slice[-1].end
            slice_text = " ".join([s.text for s in seg_slice[:5]])
            words = [w for w in slice_text.split() if len(w) > 4][:3]
            topic_hint = " ".join(words).title() if words else "Discussion"

            default_titles = [
                "Introduction & Context",
                f"Core Concepts: {topic_hint}",
                "Detailed Breakdown & Deep Dive",
                "Practical Applications & Strategy",
                "Key Insights & Challenges",
                "Future Outlook & Conclusions"
            ]
            title = default_titles[i % len(default_titles)]

            chapters.append(Chapter(
                start=round(start_t, 2),
                end=round(end_t, 2),
                title=f"{title}",
                summary=f"Covers key talking points from {seg_slice[0].formatted_start} to {seg_slice[-1].formatted_start}.",
                key_points=[
                    seg_slice[0].text[:80] + "...",
                    seg_slice[len(seg_slice)//2].text[:80] + "..." if len(seg_slice) > 2 else "In-depth analysis"
                ]
            ))

        return chapters

chapter_generator = ChapterGenerator()
