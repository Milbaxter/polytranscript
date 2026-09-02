"""Keyword / token-overlap search over transcript segments.

This is NOT embedding-based semantic search. Scores are exact-phrase bonuses
plus per-token overlap. Swap in a vector index later if you need true semantics.
"""
from typing import List
from app.models import TranscriptSegment, SearchHit, SearchResponse


class TranscriptSearcher:
    SEARCH_METHOD = "keyword_overlap"

    def search(self, segments: List[TranscriptSegment], query: str, top_k: int = 10) -> SearchResponse:
        if not segments or not query.strip():
            return SearchResponse(query=query, total_matches=0, hits=[], method=self.SEARCH_METHOD)

        query_tokens = [q.lower().strip() for q in query.split() if q.strip()]
        hits: List[SearchHit] = []

        for idx, seg in enumerate(segments):
            text_lower = seg.text.lower()
            score = 0.0

            if query.lower() in text_lower:
                score += 5.0

            for token in query_tokens:
                if token in text_lower:
                    score += 1.0

            if score > 0:
                hits.append(SearchHit(
                    segment_index=idx,
                    start=seg.start,
                    end=seg.end,
                    text=seg.text,
                    score=score,
                    formatted_start=seg.formatted_start,
                ))

        hits.sort(key=lambda h: h.score, reverse=True)
        return SearchResponse(
            query=query,
            total_matches=len(hits),
            hits=hits[:top_k],
            method=self.SEARCH_METHOD,
        )


searcher = TranscriptSearcher()
