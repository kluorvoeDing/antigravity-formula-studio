#!/usr/bin/env python3
"""
Synthesizes a sample-accurate 30.000s @ 128 BPM stereo soundtrack + foley SFX
for the ANTIGRAVITY 2026 Motion Design Showreel.
128 BPM => 1 beat = 0.46875s, 1 bar = 1.875s, 16 bars = 64 beats = 30.000s.
"""
import os
import wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
DURATION = 30.0
N_SAMPLES = int(SR * DURATION)
BPM = 128.0
BEAT = 60.0 / BPM          # 0.46875s
BAR = BEAT * 4.0           # 1.875s
HALF_BEAT = BEAT * 0.5     # 0.234375s
SIXTEENTH = BEAT * 0.25    # 0.1171875s

rng = np.random.default_rng(2026)


def midi_to_hz(m):
    return 440.0 * (2.0 ** ((m - 69.0) / 12.0))


def add_stereo(buf, start_sec, sig_l, sig_r=None):
    if sig_r is None:
        sig_r = sig_l
    i0 = int(round(start_sec * SR))
    if i0 >= N_SAMPLES:
        return
    n = min(len(sig_l), N_SAMPLES - i0)
    if n <= 0:
        return
    if i0 < 0:
        skip = -i0
        if skip >= len(sig_l):
            return
        sig_l = sig_l[skip:]
        sig_r = sig_r[skip:]
        n = min(len(sig_l), N_SAMPLES)
        i0 = 0
    buf[i0:i0 + n, 0] += sig_l[:n]
    buf[i0:i0 + n, 1] += sig_r[:n]


def lowpass(sig, cutoff, order=4):
    nyq = SR * 0.5
    c = np.clip(cutoff / nyq, 0.001, 0.99)
    sos = butter(order, c, btype="low", output="sos")
    return sosfilt(sos, sig)


def bandpass(sig, lo, hi, order=3):
    nyq = SR * 0.5
    lo_n = np.clip(lo / nyq, 0.001, 0.98)
    hi_n = np.clip(hi / nyq, lo_n + 0.002, 0.99)
    sos = butter(order, [lo_n, hi_n], btype="band", output="sos")
    return sosfilt(sos, sig)


def highpass(sig, cutoff, order=3):
    nyq = SR * 0.5
    c = np.clip(cutoff / nyq, 0.001, 0.99)
    sos = butter(order, c, btype="high", output="sos")
    return sosfilt(sos, sig)


def make_kick(dur=0.28, punch=1.0):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    freq = 44.0 + 125.0 * np.exp(-t / 0.028)
    phase = 2.0 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t / 0.095)
    click = np.sin(2.0 * np.pi * 1800.0 * t) * np.exp(-t / 0.004) * 0.35
    sig = np.tanh((body * 1.6 + click) * punch) * 0.85
    fade = np.minimum(1.0, np.linspace(dur, 0, len(t)) / 0.015)
    return sig * fade


def make_snare(dur=0.22):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    tone = np.sin(2 * np.pi * (195.0 + 90.0 * np.exp(-t / 0.015)) * t) * np.exp(-t / 0.055)
    noise = bandpass(rng.standard_normal(len(t)), 900.0, 9500.0) * np.exp(-t / 0.075)
    sig = (tone * 0.55 + noise * 0.95)
    return np.tanh(sig * 1.3) * 0.65


def make_hat(dur=0.07, open_hat=False):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    decay = 0.085 if open_hat else 0.022
    noise = highpass(rng.standard_normal(len(t)), 6800.0)
    metal = (
        np.sin(2 * np.pi * 6240 * t)
        + np.sin(2 * np.pi * 8910 * t)
        + np.sin(2 * np.pi * 11420 * t)
    ) * 0.12
    env = np.exp(-t / decay) * np.minimum(1.0, t / 0.0015)
    return (noise * 0.55 + metal) * env * 0.32


def make_sub_impact(dur=1.4, f_start=92.0, f_end=36.0):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    freq = f_end + (f_start - f_end) * np.exp(-t / 0.14)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    sub = np.sin(phase) * np.exp(-t / 0.48)
    harm = np.sin(phase * 2.0) * np.exp(-t / 0.18) * 0.25
    transient = lowpass(rng.standard_normal(len(t)), 2400.0) * np.exp(-t / 0.025) * 0.65
    sig = np.tanh((sub + harm) * 1.4) * 0.8 + transient
    fade = np.minimum(1.0, np.linspace(dur, 0, len(t)) / 0.06)
    return sig * fade


def make_riser(dur=0.9375, f_lo=220.0, f_hi=4800.0):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    u = t / dur
    noise = rng.standard_normal(len(t))
    n_lo = lowpass(noise, 700.0)
    n_hi = highpass(noise, 1800.0)
    sweep_noise = n_lo * (1.0 - u) + n_hi * (u ** 1.6)
    pitch = f_lo * ((f_hi / f_lo) ** (u ** 2))
    sine_rise = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * 0.25
    env = (u ** 2.2) * np.minimum(1.0, (1.0 - u) / 0.02)
    l = (sweep_noise * 0.45 + sine_rise) * env
    r = (np.roll(sweep_noise, 180) * 0.45 + sine_rise) * env
    return l, r


def make_whoosh(dur=0.45, brightness=3200.0):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    u = t / dur
    env = np.sin(np.pi * u) ** 1.6
    noise = bandpass(rng.standard_normal(len(t)), 280.0, brightness)
    l = noise * env * 0.42
    r = np.roll(noise, 140) * env * 0.42
    return l, r


def make_ui_click(freq=1650.0, dur=0.035):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    sig = (
        np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.005)
        + np.sin(2 * np.pi * freq * 2.4 * t) * np.exp(-t / 0.0025) * 0.4
    )
    return sig * 0.28


def make_fm_pluck(midi, dur=0.38, bright=2.2):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    fc = midi_to_hz(midi)
    fm = fc * 2.0
    mod_idx = bright * np.exp(-t / 0.065)
    sig = np.sin(2 * np.pi * fc * t + mod_idx * np.sin(2 * np.pi * fm * t))
    env = np.exp(-t / 0.11) * np.minimum(1.0, t / 0.003)
    fade = np.minimum(1.0, np.linspace(dur, 0, len(t)) / 0.02)
    return sig * env * fade * 0.34


def make_supersaw_chord(midis, dur, cutoff=2800.0, attack=0.04, release=0.25):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    l_acc = np.zeros_like(t)
    r_acc = np.zeros_like(t)
    detunes = [-0.014, -0.006, 0.0, 0.006, 0.014]
    for idx_m, m in enumerate(midis):
        f0 = midi_to_hz(m)
        for j, dt in enumerate(detunes):
            f = f0 * (1.0 + dt)
            ph = rng.uniform(0, 2 * np.pi)
            s = np.zeros_like(t)
            for k in range(1, 9):
                if f * k < SR * 0.42:
                    s += ((-1) ** (k + 1)) * np.sin(2 * np.pi * f * k * t + ph) / k
            pan = (j - 2) * 0.32 + (idx_m % 2 - 0.5) * 0.2
            gl = np.sqrt(max(0.0, 0.5 - pan * 0.4))
            gr = np.sqrt(max(0.0, 0.5 + pan * 0.4))
            l_acc += s * gl
            r_acc += s * gr

    l_acc = lowpass(l_acc / max(1, len(midis)), cutoff)
    r_acc = lowpass(r_acc / max(1, len(midis)), cutoff)

    env = np.minimum(1.0, t / max(0.005, attack))
    rem = np.linspace(dur, 0, len(t))
    env *= np.minimum(1.0, rem / max(0.01, release))
    return l_acc * env * 0.24, r_acc * env * 0.24


def make_bass_note(midi, dur, cutoff=420.0):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    f = midi_to_hz(midi)
    sub = np.sin(2 * np.pi * f * t)
    saw = np.zeros_like(t)
    for k in range(1, 7):
        saw += ((-1) ** (k + 1)) * np.sin(2 * np.pi * f * k * t) / k
    saw = lowpass(saw, cutoff)
    sig = np.tanh((sub * 0.75 + saw * 0.55) * 1.2)
    env = np.minimum(1.0, t / 0.008) * np.minimum(1.0, np.linspace(dur, 0, len(t)) / 0.03)
    return sig * env * 0.45


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(base_dir, "output")
    os.makedirs(out_dir, exist_ok=True)
    buf = np.zeros((N_SAMPLES, 2), dtype=np.float64)

    chords = [
        [54, 57, 61, 64, 68],  # F#m9
        [50, 54, 57, 61, 64],  # Dmaj9
        [57, 61, 64, 68, 71],  # Aadd9
        [52, 56, 59, 61, 66],  # E6/9
    ]
    bass_roots = [30, 26, 33, 28]  # F#1, D1, A1, E1

    # --- ACT I: COLD OPEN (0.000 - 3.750s) ---
    for t_tick, f_tick in [(0.02, 1800), (0.234, 2100), (0.469, 2400), (0.703, 2800)]:
        add_stereo(buf, t_tick, make_ui_click(f_tick, 0.04))

    l_pad, r_pad = make_supersaw_chord(chords[0], 1.875, cutoff=900.0, attack=0.6, release=0.3)
    add_stereo(buf, 0.0, l_pad * 0.7, r_pad * 0.7)

    l_riser, r_riser = make_riser(0.9375, 180.0, 4200.0)
    add_stereo(buf, 0.9375, l_riser * 0.85, r_riser * 0.85)

    # 1.875s TITLE SLAM
    add_stereo(buf, 1.875, make_sub_impact(1.6, 110.0, 38.0))
    add_stereo(buf, 1.875, make_kick(0.3, 1.25))
    l_c, r_c = make_supersaw_chord(chords[0], 1.875, cutoff=3600.0, attack=0.015, release=0.45)
    add_stereo(buf, 1.875, l_c * 1.15, r_c * 1.15)
    add_stereo(buf, 2.34375, make_snare() * 0.8)
    l_w, r_w = make_whoosh(0.45, 4500.0)
    add_stereo(buf, 2.8125, l_w, r_w)
    add_stereo(buf, 3.28125, make_snare() * 0.95)
    l_r2, r_r2 = make_riser(0.46875, 400.0, 5200.0)
    add_stereo(buf, 3.28125, l_r2 * 0.7, r_r2 * 0.7)

    # --- ACT II: 3D SCULPTURE & IRIDESCENT CHROME (3.750 - 9.375s) ---
    for bar_idx, bar_start in enumerate([3.750, 5.625, 7.500]):
        c_idx = (bar_idx + 1) % 4
        l_c, r_c = make_supersaw_chord(chords[c_idx], BAR, cutoff=2400.0 + bar_idx * 450.0, attack=0.04, release=0.2)
        add_stereo(buf, bar_start, l_c, r_c)

        for b in range(4):
            t_b = bar_start + b * BEAT
            add_stereo(buf, t_b, make_kick(0.26, 1.05))
            if b % 2 == 1:
                add_stereo(buf, t_b, make_snare())
            add_stereo(buf, t_b + HALF_BEAT, make_hat(0.08, open_hat=True))
            add_stereo(buf, t_b + SIXTEENTH, make_hat(0.04) * 0.55)
            add_stereo(buf, t_b + 3 * SIXTEENTH, make_hat(0.04) * 0.65)
            add_stereo(buf, t_b + HALF_BEAT * 0.35, make_bass_note(bass_roots[c_idx] + 12, BEAT * 0.7, cutoff=520.0))

        arp_notes = chords[c_idx]
        for s in range(16):
            t_s = bar_start + s * SIXTEENTH
            note = arp_notes[s % len(arp_notes)] + (12 if s % 8 >= 4 else 0)
            vel = 0.75 if s % 2 == 0 else 0.48
            pl = make_fm_pluck(note, 0.22, bright=2.0) * vel
            pan = 0.25 * np.sin(s * 0.8)
            add_stereo(buf, t_s, pl * (1 - pan), pl * (1 + pan))

    add_stereo(buf, 7.500, make_sub_impact(1.1, 95.0, 38.0) * 0.9)
    l_w2, r_w2 = make_whoosh(0.55, 6500.0)
    add_stereo(buf, 7.35, l_w2, r_w2)

    # --- ACT III: SWISS EDITORIAL & KINETIC TYPOGRAPHY (9.375 - 15.000s) ---
    add_stereo(buf, 9.375, make_sub_impact(0.7, 80.0, 42.0) * 0.75)
    for step in range(8):
        t_step = 9.375 + step * HALF_BEAT
        add_stereo(buf, t_step, make_ui_click(1400 + step * 180, 0.05) * 1.1)
        if step % 2 == 0:
            add_stereo(buf, t_step, make_kick(0.2, 0.95))
            pl = make_fm_pluck(chords[step % 4][2], 0.28, bright=3.0) * 1.1
            add_stereo(buf, t_step, pl, pl)
        else:
            add_stereo(buf, t_step, make_snare(0.14) * 0.75)

    # EASE / SNAP / FLOW / IMPACT
    l_w3, r_w3 = make_whoosh(0.45, 2200.0)
    add_stereo(buf, 11.250, l_w3 * 0.9, r_w3 * 0.9)
    l_e, r_e = make_supersaw_chord(chords[1], 0.46, cutoff=1800.0, attack=0.08, release=0.15)
    add_stereo(buf, 11.250, l_e, r_e)

    add_stereo(buf, 11.71875, make_snare(0.16) * 1.25)
    add_stereo(buf, 11.71875, make_ui_click(3200.0, 0.03) * 1.4)

    for k, m in enumerate([61, 64, 68, 73, 76]):
        pl = make_fm_pluck(m, 0.24, bright=1.6) * 0.9
        add_stereo(buf, 12.1875 + k * 0.065, pl * 0.8, pl * 1.1)

    add_stereo(buf, 12.65625, make_sub_impact(1.1, 120.0, 34.0) * 1.15)
    add_stereo(buf, 12.65625, make_kick(0.3, 1.3))
    l_imp, r_imp = make_supersaw_chord(chords[3], 0.55, cutoff=4500.0, attack=0.005, release=0.3)
    add_stereo(buf, 12.65625, l_imp * 1.2, r_imp * 1.2)

    l_r3, r_r3 = make_riser(1.4, 240.0, 4800.0)
    add_stereo(buf, 13.55, l_r3 * 0.75, r_r3 * 0.75)
    for s in range(8):
        add_stereo(buf, 13.125 + s * HALF_BEAT, make_hat(0.05) * (0.5 + 0.07 * s))

    # --- ACT IV: UI/UX & DATA VIZ (15.000 - 20.625s) ---
    for bar_idx, bar_start in enumerate([15.000, 16.875, 18.750]):
        c_idx = bar_idx % 4
        l_c, r_c = make_supersaw_chord(chords[c_idx], BAR, cutoff=1700.0 + bar_idx * 650.0, attack=0.05, release=0.25)
        add_stereo(buf, bar_start, l_c * 0.85, r_c * 0.85)
        add_stereo(buf, bar_start, make_bass_note(bass_roots[c_idx] + 12, BAR * 0.9, cutoff=380.0) * 0.8)
        for b in range(4):
            t_b = bar_start + b * BEAT
            add_stereo(buf, t_b, make_kick(0.24, 0.95))
            if b % 2 == 1:
                add_stereo(buf, t_b, make_snare(0.18) * 0.85)
            add_stereo(buf, t_b + HALF_BEAT, make_hat(0.05) * 0.7)

    for t_ui, f_ui in [(15.40, 1950), (16.10, 2350), (17.20, 2750), (18.10, 3100), (18.75, 1600)]:
        add_stereo(buf, t_ui, make_ui_click(f_ui, 0.04) * 1.25)
    l_w4, r_w4 = make_whoosh(0.5, 5200.0)
    add_stereo(buf, 18.75, l_w4, r_w4)
    l_r4, r_r4 = make_riser(1.875, 220.0, 6200.0)
    add_stereo(buf, 18.75, l_r4 * 1.1, r_r4 * 1.1)

    # --- ACT V: CLIMAX VFX & PARTICLE DROP (20.625 - 26.250s) ---
    add_stereo(buf, 20.625, make_sub_impact(1.4, 115.0, 35.0) * 1.1)
    for bar_idx, bar_start in enumerate([20.625, 22.500, 24.375]):
        c_idx = (bar_idx + 1) % 4
        l_c, r_c = make_supersaw_chord(chords[c_idx], BAR, cutoff=4800.0, attack=0.01, release=0.15)
        add_stereo(buf, bar_start, l_c * 1.2, r_c * 1.2)
        add_stereo(buf, bar_start, make_bass_note(bass_roots[c_idx] + 12, BAR * 0.95, cutoff=720.0) * 1.05)

        for b in range(4):
            t_b = bar_start + b * BEAT
            add_stereo(buf, t_b, make_kick(0.26, 1.25))
            if b % 2 == 1:
                add_stereo(buf, t_b, make_snare(0.22) * 1.05)
            add_stereo(buf, t_b + HALF_BEAT, make_hat(0.08, open_hat=True) * 0.9)

        for s in range(16):
            t_s = bar_start + s * SIXTEENTH
            note = chords[c_idx][s % len(chords[c_idx])] + 12
            pl = make_fm_pluck(note, 0.19, bright=3.2) * 0.85
            pan = 0.38 * np.cos(s * 0.9)
            add_stereo(buf, t_s, pl * (1 - pan), pl * (1 + pan))

    l_r5, r_r5 = make_riser(1.875, 320.0, 7800.0)
    add_stereo(buf, 24.375, l_r5 * 1.15, r_r5 * 1.15)
    for h in range(8):
        add_stereo(buf, 24.375 + h * HALF_BEAT, make_snare(0.14) * (0.6 + 0.08 * h))

    # --- ACT VI: CLEAN RESOLVE & RÉSUMÉ SIGN-OFF (26.250 - 30.000s) ---
    add_stereo(buf, 26.250, make_sub_impact(2.4, 95.0, 36.0) * 1.0)
    l_res1, r_res1 = make_supersaw_chord([57, 61, 64, 68, 73], 3.70, cutoff=2200.0, attack=0.06, release=1.45)
    add_stereo(buf, 26.250, l_res1 * 1.1, r_res1 * 1.1)
    for idx_c, (t_ch, m_ch) in enumerate([(26.250, 76), (26.71875, 80), (27.1875, 81), (27.65625, 85)]):
        pl = make_fm_pluck(m_ch, 1.3, bright=1.2) * 0.7
        add_stereo(buf, t_ch, pl * (0.9 if idx_c % 2 == 0 else 1.1), pl * (1.1 if idx_c % 2 == 0 else 0.9))

    fade_len = int(0.35 * SR)
    buf[-fade_len:, 0] *= np.linspace(1.0, 0.0, fade_len)
    buf[-fade_len:, 1] *= np.linspace(1.0, 0.0, fade_len)

    buf = np.tanh(buf * 0.92) * 0.92
    peak = np.max(np.abs(buf))
    if peak > 0.96:
        buf *= 0.96 / peak

    pcm = (buf * 32767.0).astype(np.int16)
    out_wav = os.path.join(out_dir, "soundtrack.wav")
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())

    print(f"Audio synthesized: {out_wav} ({DURATION:.3f}s, peak={peak:.3f})")


if __name__ == "__main__":
    main()
