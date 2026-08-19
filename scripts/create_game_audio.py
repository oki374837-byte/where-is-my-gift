from pathlib import Path
import math
import wave

OUT = Path(__file__).resolve().parents[1] / "assets" / "audio"
OUT.mkdir(parents=True, exist_ok=True)
RATE = 44100


def write_wav(path: Path, seconds: float, sample_fn):
    frames = bytearray()
    for i in range(int(RATE * seconds)):
        value = max(-1.0, min(1.0, sample_fn(i / RATE, i / (RATE * seconds))))
        frames.extend(int(value * 32767).to_bytes(2, "little", signed=True))
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(RATE)
        audio.writeframes(frames)


def collect_tone(t, progress):
    frequency = 660 + 540 * progress
    envelope = min(progress / 0.08, (1 - progress) / 0.18, 1.0)
    return 0.42 * envelope * math.sin(2 * math.pi * frequency * t)


def ambient_pad(t, progress):
    fade = min(progress / 0.1, (1 - progress) / 0.1, 1.0)
    layer_one = math.sin(2 * math.pi * 220 * t)
    layer_two = math.sin(2 * math.pi * 277.18 * t + 0.7)
    layer_three = math.sin(2 * math.pi * 329.63 * t + 1.4)
    pulse = 0.72 + 0.28 * math.sin(2 * math.pi * 0.18 * t)
    return 0.055 * fade * pulse * (0.48 * layer_one + 0.32 * layer_two + 0.2 * layer_three)


write_wav(OUT / "collect.wav", 0.26, collect_tone)
write_wav(OUT / "ambient.wav", 8.0, ambient_pad)
print(f"Created {OUT / 'collect.wav'} and {OUT / 'ambient.wav'}")
