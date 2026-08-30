import librosa
import numpy as np

from services.audio import SAMPLE_RATE

PITCH_FMIN = 65.0
PITCH_FMAX = 400.0


def analyze(audio: np.ndarray) -> dict:
    """Prosody features from a 16 kHz mono float32 ndarray (from `load_audio`).

    Returns plain Python floats (never numpy scalars) so the dict is
    JSON-serializable into the `sessions.prosody_data` jsonb column. If the
    clip is fully unvoiced, the pitch fields are 0.0 rather than NaN.
    """
    duration = len(audio) / SAMPLE_RATE

    f0, _voiced_flag, _voiced_prob = librosa.pyin(
        audio, sr=SAMPLE_RATE, fmin=PITCH_FMIN, fmax=PITCH_FMAX
    )
    voiced = f0[~np.isnan(f0)]
    if voiced.size:
        pitch_mean = float(np.mean(voiced))
        pitch_std = float(np.std(voiced))
        pitch_range = float(np.max(voiced) - np.min(voiced))
    else:
        pitch_mean = pitch_std = pitch_range = 0.0

    tempo, _beats = librosa.beat.beat_track(y=audio, sr=SAMPLE_RATE)
    rms = librosa.feature.rms(y=audio)[0]

    return {
        "duration": duration,
        "pitch_mean": pitch_mean,
        "pitch_std": pitch_std,
        "pitch_range": pitch_range,
        "tempo": float(np.asarray(tempo).item()),
        "rms_mean": float(np.mean(rms)),
        "rms_std": float(np.std(rms)),
    }
