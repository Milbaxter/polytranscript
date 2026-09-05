import os
import subprocess
import tempfile
import time
from typing import List, Tuple
from app.config import settings
from app.models import TranscriptSegment

class AudioTranscriber:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY

    def has_ai_credentials(self) -> bool:
        return bool(self.groq_api_key or self.openai_api_key)

    async def transcribe_audio_file(self, audio_path: str, language: str = "en") -> Tuple[str, List[TranscriptSegment]]:
        """
        Transcribe an audio file using Groq Whisper, OpenAI Whisper, or a local audio pipeline.
        Returns full text and timestamped segments.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Ensure audio is optimized for Whisper (<25MB, 16kHz mono mp3)
        processed_path = self._preprocess_audio(audio_path)

        # 1. Try Groq Whisper (Ultra fast, cost-effective)
        if self.groq_api_key:
            try:
                return await self._transcribe_with_groq(processed_path, language)
            except Exception as e:
                print(f"[Transcriber] Groq failed, trying fallback: {e}")

        # 2. Try OpenAI Whisper
        if self.openai_api_key:
            try:
                return await self._transcribe_with_openai(processed_path, language)
            except Exception as e:
                print(f"[Transcriber] OpenAI Whisper failed: {e}")

        raise RuntimeError(
            "No speech-to-text provider is configured. Set GROQ_API_KEY or OPENAI_API_KEY, "
            "or install a local Whisper runtime. Canned demo transcripts are disabled."
        )

    def _preprocess_audio(self, input_path: str) -> str:
        """Convert any audio/video file to 16kHz mono MP3 for high compression and Whisper compatibility."""
        output_path = tempfile.mktemp(suffix=".mp3", dir=settings.TEMP_STORAGE_DIR)
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vn", "-ar", "16000", "-ac", "1", "-b:a", "64k",
            output_path
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            return output_path
        except Exception as e:
            print(f"[Transcriber] FFmpeg conversion failed, using original: {e}")
            return input_path

    async def _transcribe_with_groq(self, audio_path: str, language: str) -> Tuple[str, List[TranscriptSegment]]:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=self.groq_api_key)
        
        with open(audio_path, "rb") as f:
            transcription = await client.audio.transcriptions.create(
                file=(os.path.basename(audio_path), f.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
                language=language if language != "auto" else None,
                temperature=0.0
            )

        full_text = transcription.text.strip()
        segments = []
        raw_segments = getattr(transcription, "segments", []) or []
        for s in raw_segments:
            seg_dict = s if isinstance(s, dict) else s.model_dump()
            segments.append(TranscriptSegment(
                start=float(seg_dict.get("start", 0.0)),
                end=float(seg_dict.get("end", 0.0)),
                text=seg_dict.get("text", "").strip()
            ))

        return full_text, segments

    async def _transcribe_with_openai(self, audio_path: str, language: str) -> Tuple[str, List[TranscriptSegment]]:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.openai_api_key)
        
        with open(audio_path, "rb") as f:
            transcription = await client.audio.transcriptions.create(
                file=f,
                model="whisper-1",
                response_format="verbose_json",
                language=language if language != "auto" else None,
                timestamp_granularities=["segment"]
            )

        full_text = transcription.text.strip()
        segments = []
        raw_segments = getattr(transcription, "segments", []) or []
        for s in raw_segments:
            seg_dict = s if isinstance(s, dict) else s.model_dump()
            segments.append(TranscriptSegment(
                start=float(seg_dict.get("start", 0.0)),
                end=float(seg_dict.get("end", 0.0)),
                text=seg_dict.get("text", "").strip()
            ))

        return full_text, segments

    def _local_or_mock_transcribe(self, audio_path: str) -> Tuple[str, List[TranscriptSegment]]:
        raise RuntimeError(
            f"Refusing canned transcript for {audio_path}. Configure GROQ_API_KEY or OPENAI_API_KEY."
        )

transcriber = AudioTranscriber()
