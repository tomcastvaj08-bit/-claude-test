"""Finální zvuk a video: hlas+vložky (mix.wav) + hudba + efekty -> dvouprůchodový loudnorm -14 LUFS / -1 dBTP,
pak mux do out/video.mp4 -> out/<name>_MASTER.mp4 (crf 15, kopie videa) a <name>_WEB.mp4 (crf 20, na upload).

python tools/master.py [--name Tutorial] [--no-bed] [--audio-only]
"""
import argparse, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
B, O = ROOT / "build", ROOT / "out"


def ff(*a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--name", default=None); ap.add_argument("--no-bed", action="store_true")
    ap.add_argument("--audio-only", action="store_true"); a = ap.parse_args()
    cfg = json.loads((ROOT / "project.json").read_text(encoding="utf-8"))
    name = a.name or cfg.get("slug", "Tutorial")
    ins = ["-i", str(B / "mix.wav")]
    if not a.no_bed: ins += ["-i", str(B / "music.wav"), "-i", str(B / "sfx.wav")]
    n = len(ins) // 2
    fc = "[0:a]aformat=channel_layouts=stereo[v];[v]" + "".join(f"[{i}:a]" for i in range(1, n)) + f"amix=inputs={n}:normalize=0:duration=first"
    ff(*ins, "-filter_complex", fc, "-ar", "48000", "-c:a", "pcm_f32le", str(B / "final_raw.wav"))
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", str(B / "final_raw.wav"), "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    m = json.loads(r[r.rindex("{"):r.rindex("}") + 1])
    ff("-i", str(B / "final_raw.wav"), "-af", f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
       f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true", "-ar", "48000", str(B / "final_norm.wav"))
    print(f"zvuk: vstup {m['input_i']} LUFS -> build/final_norm.wav (cíl -14 LUFS / -1 dBTP)")
    if a.audio_only: return
    v = O / "video.mp4"
    ff("-i", str(v), "-i", str(B / "final_norm.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest",
       "-movflags", "+faststart", str(O / f"{name}_MASTER.mp4"))
    ff("-i", str(O / f"{name}_MASTER.mp4"), "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
       "-movflags", "+faststart", str(O / f"{name}_WEB.mp4"))
    for f in (f"{name}_MASTER.mp4", f"{name}_WEB.mp4"):
        p = O / f; print(f, f"{p.stat().st_size / 1e6:.0f} MB")


if __name__ == "__main__":
    main()
