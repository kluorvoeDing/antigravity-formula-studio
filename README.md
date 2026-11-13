# ANTIGRAVITY // Formula Studio v2.5 & 2026 Motion Showreel

Bento modular specification generator (**Web • Motion Video • AI Image • Google Flow**) paired with a 60fps WebGL2 raymarched & Canvas2D motion graphics showreel.

## Entrypoints

- `index.html` / `video_formula_builder.html` — **ANTIGRAVITY Formula Studio v2.5** (Double-Bezel Bento workbench, Personal Style DNA persisted in `localStorage`, Anti-Slop enforcement, live formula compiler & JSON export/import).
- `showreel.html` — **30-second 60fps WebGL2 + Canvas2D Motion Design Showreel** (real-time interactive preview in any browser).

## Local Offline Video & Audio Synthesis

```bash
# Synthesize 30s 128 BPM soundtrack -> output/soundtrack.wav
python3 generate_audio.py

# Render 1800 frames (1920x1080 @ 60fps) via headless Chromium + FFmpeg -> output/ANTIGRAVITY_SHOWREEL_2026.mp4
node render_video.mjs
```
