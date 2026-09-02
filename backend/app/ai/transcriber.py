import os
import shutil
import subprocess
import tempfile
from typing import List, Tuple

from app.config import settings
from app.models import TranscriptSegment

DEMO_FORBIDDEN_SNIPPETS = (
    "Spoken audio content is parsed and indexed natively",
    "multi-platform media intelligence and agentic workflows",
    "Model Context Protocol (MCP) transform unstructured audio",
    "Welcome to this TikTok clip",
    "agentic architectures and automated multi-modal pipelines",
)


def local_whisper_available() -> bool:
    try:
        import faster_whisper  # noqa: F401
        return True
    except Exception:
        pass
    try:
        import whisper  # noqa: F401
        return True
    except Exception:
        pass
    return shutil.which("whisper") is not None


class AudioTranscriber:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY

    def has_ai_credentials(self) -> bool:
        return bool(self.groq_api_key or self.openai_api_key)

    async def transcribe_audio_file(self, audio_path: str, language: str = "en") -> Tuple[str, List[TranscriptSegment]]:
        """
        Transcribe an audio file using Groq Whisper, OpenAI Whisper, or a real local Whisper install.
        Never returns canned/demo transcript copy.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        processed_path = self._preprocess_audio(audio_path)

        if self.groq_api_key:
            try:
                return await self._transcribe_with_groq(processed_path, language)
            except Exception as e:
                print(f"[Transcriber] Groq failed, trying fallback: {e}")

        if self.openai_api_key:
            try:
                return await self._transcribe_with_openai(processed_path, language)
            except Exception as e:
                print(f"[Transcriber] OpenAI Whisper failed: {e}")

        if settings.LOCAL_WHISPER_FALLBACK and local_whisper_available():
            return self._local_whisper_transcribe(processed_path, language)

        raise RuntimeError(
            "No transcription provider available. Set GROQ_API_KEY or OPENAI_API_KEY, "
            "or install openai-whisper / faster-whisper. Demo/mock transcripts are disabled."
        )

    def _preprocess_audio(self, input_path: str) -> str:
        output_path = tempfile.mktemp(suffix=".mp3", dir=settings.TEMP_STORAGE_DIR)
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vn", "-ar", "16000", "-ac", "1", "-b:a", "64k",
            output_path,
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
                temperature=0.0,
            )

        return self._segments_from_whisper_result(transcription)

    async def _transcribe_with_openai(self, audio_path: str, language: str) -> Tuple[str, List[TranscriptSegment]]:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.openai_api_key)

        with open(audio_path, "rb") as f:
            transcription = await client.audio.transcriptions.create(
                file=f,
                model="whisper-1",
                response_format="verbose_json",
                language=language if language != "auto" else None,
                timestamp_granularities=["segment"],
            )

        return self._segments_from_whisper_result(transcription)

    def _segments_from_whisper_result(self, transcription) -> Tuple[str, List[TranscriptSegment]]:
        full_text = (transcription.text or "").strip()
        segments: List[TranscriptSegment] = []
        raw_segments = getattr(transcription, "segments", []) or []
        for s in raw_segments:
            seg_dict = s if isinstance(s, dict) else s.model_dump()
            segments.append(TranscriptSegment(
                start=float(seg_dict.get("start", 0.0)),
                end=float(seg_dict.get("end", 0.0)),
                text=(seg_dict.get("text") or "").strip(),
            ))
        self._assert_not_demo(full_text)
        return full_text, segments

    def _local_whisper_transcribe(self, audio_path: str, language: str) -> Tuple[str, List[TranscriptSegment]]:
        """Real local Whisper only. Raises if no engine is installed."""
        lang = None if language == "auto" else language

        try:
            from faster_whisper import WhisperModel

            model = WhisperModel("base", device="cpu", compute_type="int8")
            segments_iter, _info = model.transcribe(audio_path, language=lang)
            segments: List[TranscriptSegment] = []
            parts = []
            for s in segments_iter:
                text = (s.text or "").strip()
                if not text:
                    continue
                segments.append(TranscriptSegment(start=float(s.start or 0.0), end=float(s.end or 0.0), text=text))
                parts.append(text)
            full_text = " ".join(parts)
            self._assert_not_demo(full_text)
            return full_text, segments
        except ImportError:
            pass

        try:
            import whisper

            model = whisper.load_model("base")
            result = model.transcribe(audio_path, language=lang)
            full_text = (result.get("text") or "").strip()
            segments = []
            for s in result.get("segments") or []:
                segments.append(TranscriptSegment(
                    start=float(s.get("start", 0.0)),
                    end=float(s.get("end", 0.0)),
                    text=(s.get("text") or "").strip(),
                ))
            self._assert_not_demo(full_text)
            return full_text, segments
        except ImportError:
            pass

        whisper_bin = shutil.which("whisper")
        if whisper_bin:
            outdir = tempfile.mkdtemp(dir=settings.TEMP_STORAGE_DIR)
            cmd = [whisper_bin, audio_path, "--model", "base", "--output_format", "json", "--output_dir", outdir]
            if lang:
                cmd.extend(["--language", lang])
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if proc.returncode != 0:
                raise RuntimeError(f"whisper CLI failed: {proc.stderr[-500:]}")
            import json
            json_files = [os.path.join(outdir, f) for f in os.listdir(outdir) if f.endswith(".json")]
            if not json_files:
                raise RuntimeError("whisper CLI produced no JSON output")
            with open(json_files[0]) as fh:
                result = json.load(fh)
            full_text = (result.get("text") or "").strip()
            segments = [
                TranscriptSegment(
                    start=float(s.get("start", 0.0)),
                    end=float(s.get("end", 0.0)),
                    text=(s.get("text") or "").strip(),
                )
                for s in result.get("segments") or []
            ]
            self._assert_not_demo(full_text)
            return full_text, segments

        raise RuntimeError(
            "Local Whisper is not installed. Set GROQ_API_KEY or OPENAI_API_KEY, "
            "or `pip install openai-whisper` / `faster-whisper`. Mock transcripts are disabled."
        )

    def _assert_not_demo(self, full_text: str) -> None:
        lower = (full_text or "").lower()
        for snippet in DEMO_FORBIDDEN_SNIPPETS:
            if snippet.lower() in lower:
                raise RuntimeError("Refusing to return canned/demo transcript copy.")


transcriber = AudioTranscriber()
