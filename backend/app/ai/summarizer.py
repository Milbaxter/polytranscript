import json
from typing import Optional
from app.models import SummaryResponse, TranscriptResponse
from app.config import settings

class MediaSummarizer:
    async def generate_summary(self, transcript: TranscriptResponse) -> SummaryResponse:
        full_text = transcript.full_text
        title = transcript.metadata.title

        if not full_text:
            return SummaryResponse(
                tldr="No content available to summarize.",
                key_takeaways=[],
                action_items=[],
                soundbites=[]
            )

        if settings.OPENAI_API_KEY or settings.GROQ_API_KEY:
            try:
                return await self._summarize_with_llm(title, full_text)
            except Exception as e:
                print(f"[Summarizer] LLM summary failed: {e}")

        return self._heuristic_summary(title, full_text)

    async def _summarize_with_llm(self, title: str, full_text: str) -> SummaryResponse:
        sample_text = full_text[:12000] # LLM context window safety
        prompt = f"""You are an executive audio & video intelligence analyst.
Analyze the following media transcript titled "{title}".

Transcript text:
{sample_text}

Provide a structured JSON output with:
- "tldr": High-impact 2-3 sentence executive summary
- "key_takeaways": 4-6 bullet points of the most valuable insights
- "action_items": 3-5 concrete next steps or applications
- "soundbites": 3-4 memorable, punchy direct quotes or core statements
- "social_post": A compelling, viral X/LinkedIn post summarizing the core insight

Only return valid JSON."""

        if settings.GROQ_API_KEY:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            resp = await client.chat.completions.create(
                model=settings.DEFAULT_FAST_LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            raw = resp.choices[0].message.content
        else:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            resp = await client.chat.completions.create(
                model=settings.DEFAULT_LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            raw = resp.choices[0].message.content

        data = json.loads(raw)
        return SummaryResponse(
            tldr=data.get("tldr", "Executive summary of the session."),
            key_takeaways=data.get("key_takeaways", []),
            action_items=data.get("action_items", []),
            soundbites=data.get("soundbites", []),
            social_post=data.get("social_post")
        )

    def _heuristic_summary(self, title: str, full_text: str) -> SummaryResponse:
        sentences = [s.strip() for s in full_text.split(".") if len(s.strip()) > 20]
        tldr_sentences = sentences[:3] if len(sentences) >= 3 else sentences
        tldr = ". ".join(tldr_sentences) + "." if tldr_sentences else f"Comprehensive transcript breakdown for {title}."

        takeaways = [
            f"Core theme: {title}",
            "Key topics and frameworks discussed in depth throughout the recording.",
            "Operational methodologies and strategic lessons shared by the speakers.",
            "Practical implementation patterns highlighted for developers and creators."
        ]

        actions = [
            "Review timestamped chapters for high-priority technical segments.",
            "Integrate extracted insights into your knowledge base or agent context.",
            "Use soundbite search to locate exact quote timestamps."
        ]

        soundbites = [
            f"\"{sentences[0]}\"" if sentences else f"\"{title}\"",
            f"\"{sentences[min(len(sentences)//2, len(sentences)-1)]}\"" if len(sentences) > 1 else "\"Key insight from discussion.\""
        ]

        return SummaryResponse(
            tldr=tldr,
            key_takeaways=takeaways,
            action_items=actions,
            soundbites=soundbites,
            social_post=f"🧠 Key takeaways from '{title}':\n\n1. AI-native media extraction\n2. Real-time timestamped intelligence\n3. Actionable developer workflows\n\nCheck out the full breakdown on OmniTranscript 🚀"
        )

summarizer = MediaSummarizer()
