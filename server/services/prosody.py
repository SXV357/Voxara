import librosa
import numpy as np

from services.audio import SAMPLE_RATE

'''
maybe revisit this later on dependent on feedback especially upper bound - on dramatic
scenarios pitch can go pretty high and 400 may be a bit low for that and pyin if anything
higher is going to discard it and could impact feedback

pyin listens to recording and moment by moment figures out how high or low voice is - pitch
measured in Hz where higher number is higher voice (need to give it a range)
'''
PITCH_FMIN = 65.0
PITCH_FMAX = 400.0


def analyze(audio: np.ndarray) -> dict:
    """Prosody features from a 16 kHz mono float32 ndarray (from `load_audio`).

    Returns plain Python floats (never numpy scalars) so the dict is
    JSON-serializable into the `sessions.prosody_data` jsonb column. If the
    clip is fully unvoiced, the pitch fields are 0.0 rather than NaN.

    pitch = how high or low note is (how fast sound wave repeats in frequency Hz)
    volume = how big wave is (amplitude for ex)
    """

    # 16k samples = 1 second (audio is list of samples)
    duration = len(audio) / SAMPLE_RATE

    '''
    pyin chops audio into small frames and returns 3 arrays (one slot per frame)
    f0 is array of frequencies (Hz or NaN) - pitch if frame had one or not
    '''
    f0, _voiced_flag, _voiced_prob = librosa.pyin(
        audio, sr=SAMPLE_RATE, fmin=PITCH_FMIN, fmax=PITCH_FMAX
    )

    # only keeping frames with a real pitch
    voiced = f0[~np.isnan(f0)]

    if voiced.size:
        # average Hz - baseline vocal pitch
        pitch_mean = float(np.mean(voiced))

        # how spread out is pitch around average (low = monotone, high = varied and expressive)
        pitch_std = float(np.std(voiced))

        # full span between lowest and highest note in take
        pitch_range = float(np.max(voiced) - np.min(voiced))
    else:
        pitch_mean = pitch_std = pitch_range = 0.0

    # music beat detector - finds rhythmic pulse by looking at where energy spikes
    # and returns tempo in beats per min
    tempo, _beats = librosa.beat.beat_track(y=audio, sr=SAMPLE_RATE)

    # root mean square amplitude - volume measurement (loudness envelope over time)
    rms = librosa.feature.rms(y=audio)[0]

    return {
        "duration": duration,
        "pitch_mean": pitch_mean,
        "pitch_std": pitch_std,
        "pitch_range": pitch_range,
        "tempo": float(np.asarray(tempo).item()),
        "rms_mean": float(np.mean(rms)),
        "rms_std": float(np.std(rms)), # loudness variation: low = flat and high = dynamic delivery
    }
