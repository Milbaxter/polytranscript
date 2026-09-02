from typing import List, Dict, Any
from app.models import ChatRequest, ChatResponse, TranscriptSegment
from app.ai.searcher import searcher
from app.config import settings

class MediaChatEngine:
    async def answer_question(self, question: str, full_text: str, segments: List[TranscriptSegment]) -> ChatResponse:
        if not full_text:
            return ChatResponse(
                answer="No transcript data available to answer this question.",
                relevant_timestamps=[]
            )

        # 1. Retrieve top matching segments
        search_res = searcher.search(segments, question, top_k=5)
        citations = []
        for hit in search_res.hits:
            citations.append({
                "start": hit.start,
                "end": hit.end,
                "formatted_start": hit.formatted_start,
                "text": hit.text
            })

        # 2. If LLM available, generate grounded answer
        if settings.OPENAI_API_KEY or settings.GROQ_API_KEY:
            try:
                context_snippets = "\n".join([f"[{c['formatted_start']}] {c['text']}" for c in citations])
                prompt = f"""You are an intelligent assistant analyzing an audio/video recording.
Answer the user's question based strictly on the provided transcript excerpts.
Always cite the relevant timestamps (e.g. [02:15]) when stating facts.

Transcript Excerpts:
{context_snippets}

User Question: {question}

Helpful, accurate answer with timestamp citations:"""

                if settings.GROQ_API_KEY:
                    from groq import AsyncGroq
                    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
                    resp = await client.chat.completions.create(
                        model=settings.DEFAULT_FAST_LLM_MODEL,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.2
                    )
                    answer = resp.choices[0].message.content.strip()
                else:
                    from openai import AsyncOpenAI
                    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                    resp = await client.chat.completions.create(
                        model=settings.DEFAULT_LLM_MODEL,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.2
                    )
                    answer = resp.choices[0].message.content.strip()

                return ChatResponse(answer=answer, relevant_timestamps=citations)
            except Exception as e:
                print(f"[ChatEngine] LLM failed: {e}")

        # 3. Fallback answer synthesis
        if citations:
            best = citations[0]
            answer = f"Based on the transcript around [{best['formatted_start']}]: \"{best['text']}\""
        else:
            answer = f"The transcript discusses: {full_text[:200]}..."

        return ChatResponse(answer=answer, relevant_timestamps=citations)

chat_engine = MediaChatEngine()
