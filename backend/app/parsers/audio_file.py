import os
import tempfile
import asyncio
from app.models import MediaMetadata, TranscriptResponse
from app.parsers.base import BaseMediaParser
from app.ai.transcriber import transcriber

class AudioFileParser(BaseMediaParser):
    def can_handle(self, url: str) -> bool:
        return os.path.isfile(url) or url.startswith("file://")

    async def extract_metadata(self, file_path: str) -> MediaMetadata:
        clean_path = file_path.replace("file://", "")
        filename = os.path.basename(clean_path)
        size_mb = os.path.getsize(clean_path) / (1024 * 1024) if os.path.exists(clean_path) else 0.0

        return MediaMetadata(
            title=filename,
            author="Uploaded File",
            platform="file_upload",
            url=clean_path,
            description=f"Local media file ({size_mb:.1f} MB)"
        )

    async def extract_transcript(self, file_path: str, language: str = "en") -> TranscriptResponse:
        clean_path = file_path.replace("file://", "")
        metadata = await self.extract_metadata(clean_path)

        full_text, segments = await transcriber.transcribe_audio_file(clean_path, language=language)
        word_count = len(full_text.split())

        return TranscriptResponse(
            metadata=metadata,
            language=language,
            full_text=full_text,
            segments=segments,
            source_type="file_upload_whisper",
            word_count=word_count
        )

audio_file_parser = AudioFileParser()
