import re
from typing import Optional
from app.models import MediaMetadata, TranscriptResponse
from app.parsers.base import BaseMediaParser
from app.parsers.youtube import youtube_parser
from app.parsers.tiktok import tiktok_parser
from app.parsers.podcast import podcast_parser
from app.parsers.audio_file import audio_file_parser

class UniversalMediaParser(BaseMediaParser):
    def __init__(self):
        self.parsers = [
            youtube_parser,
            tiktok_parser,
            podcast_parser,
            audio_file_parser
        ]

    def get_parser(self, url: str) -> BaseMediaParser:
        for p in self.parsers:
            if p.can_handle(url):
                return p
        # Fallback to podcast/direct audio parser for generic media URLs
        return podcast_parser

    def can_handle(self, url: str) -> bool:
        return True

    async def extract_metadata(self, url: str) -> MediaMetadata:
        parser = self.get_parser(url)
        return await parser.extract_metadata(url)

    async def extract_transcript(self, url: str, language: str = "en") -> TranscriptResponse:
        parser = self.get_parser(url)
        return await parser.extract_transcript(url, language=language)

universal_parser = UniversalMediaParser()
