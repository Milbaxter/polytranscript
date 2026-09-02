import re
from typing import List
from app.models import TranscriptSegment, SearchHit, SearchResponse

class TranscriptSearcher:
    def search(self, segments: List[TranscriptSegment], query: str, top_k: int = 10) -> SearchResponse:
        if not segments or not query.strip():
            return SearchResponse(query=query, total_matches=0, hits=[])

        query_tokens = [q.lower().strip() for q in query.split() if q.strip()]
        hits: List[SearchHit] = []

        for idx, seg in enumerate(segments):
            text_lower = seg.text.lower()
            score = 0.0
            
            # Exact phrase match bonus
            if query.lower() in text_lower:
                score += 5.0

            # Token match scoring
            matched_tokens = 0
            for token in query_tokens:
                if token in text_lower:
                    matched_tokens += 1
                    score += 1.0

            if score > 0:
                # Highlight or format snippet
                snippet = seg.text
                hits.append(SearchHit(
                    segment_index=idx,
                    start=seg.start,
                    end=seg.end,
                    text=snippet,
                    score=score,
                    formatted_start=seg.formatted_start
                ))

        # Sort by relevance score descending
        hits.sort(key=lambda h: h.score, reverse=True)
        top_hits = hits[:top_k]

        return SearchResponse(
            query=query,
            total_matches=len(hits),
            hits=top_hits
        )

searcher = TranscriptSearcher()
