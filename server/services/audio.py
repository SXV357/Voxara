import io

import numpy as np
from faster_whisper.audio import decode_audio

SAMPLE_RATE = 16000


def load_audio(webm_bytes: bytes) -> np.ndarray:
    """Decode browser webm/opus bytes to a float32 mono ndarray at 16 kHz.

    Uses faster-whisper's bundled PyAV (FFmpeg libraries, no system `ffmpeg`
    binary). The returned array is the shared input for both transcription and
    prosody analysis, so neither has to touch a file or re-decode.
    """
    return decode_audio(io.BytesIO(webm_bytes), sampling_rate=SAMPLE_RATE)
