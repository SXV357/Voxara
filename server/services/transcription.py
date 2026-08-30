import numpy as np
from faster_whisper import WhisperModel

from config import settings
from models import Transcript, TranscriptWord

_model: WhisperModel | None = None


def _get_model() -> WhisperModel:
    """Lazily load the faster-whisper model as a process-wide singleton.

    First call downloads the model (~140 MB for `base`) and takes ~10s; the
    session sits in `processing` meanwhile, which the frontend handles.
    """
    global _model
    if _model is None:
        _model = WhisperModel(
            settings.whisper_model, device="cpu", compute_type="int8"
        )
    return _model


def transcribe(audio: np.ndarray) -> Transcript:
    """Transcribe a 16 kHz mono float32 ndarray (from `load_audio`) to a Transcript.

    The ndarray is passed through as-is — faster-whisper skips its internal
    decode step when handed an array.
    """
    segments, _info = _get_model().transcribe(
        audio, word_timestamps=True, language="en"
    )

    text_parts: list[str] = []
    words: list[TranscriptWord] = []
    for segment in segments:
        text_parts.append(segment.text.strip())
        for word in segment.words or []:
            words.append(
                TranscriptWord(
                    word=word.word.strip(),
                    start=round(word.start, 2),
                    end=round(word.end, 2),
                )
            )

    return Transcript(text=" ".join(text_parts), words=words)
