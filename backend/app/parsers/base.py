from abc import ABC, abstractmethod
from typing import Optional
from app.models import MediaMetadata, TranscriptResponse

class BaseMediaParser(ABC):
    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Return True if this parser can handle the given URL."""
        pass

    @abstractmethod
    async def extract_metadata(self, url: str) -> MediaMetadata:
        """Extract media metadata such as title, author, duration, thumbnail."""
        pass

    @abstractmethod
    async def extract_transcript(self, url: str, language: str = "en") -> TranscriptResponse:
        """Extract transcript directly or transcribe audio."""
        pass
