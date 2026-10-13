#!/usr/bin/env node
// Synthesizes the series' signature sound design (always identical -> recognisable intro):
//   riser.wav  – rising sweep + noise swell that builds while the date travels back
//   tick.wav   – short clock tick for every day the red dot passes
//   impact.wav – sub boom + snap when it lands on the news date
//   whoosh.wav – air whoosh for the dive into the date
// Drop your own files with the same names into assets/sfx/ to override.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "sfx");
const SR = 48000;
const force = process.argv.includes("--force");
mkdirSync(OUT, { recursive: true });

let seed = 1337;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function wav(name, L, R = L) {
  const file = join(OUT, name);
  if (existsSync(file) && !force) return console.log(`keep ${name}`);
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = 0.89 / peak;
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
  }
  writeFileSync(file, buf);
  console.log(`wrote ${name}`);
}

// one-pole filters
const lp = (x, c) => { const y = new Float32Array(x.length); let s = 0; for (let i = 0; i < x.length; i++) y[i] = s += c(i) * (x[i] - s); return y; };
const hp = (x, c) => { const l = lp(x, c); return x.map((v, i) => v - l[i]); };

// ---- riser (2.4 s): detuned saws sweeping up + filtered noise, steep crescendo
{
  const dur = 2.4, n = Math.floor(SR * dur);
  const L = new Float32Array(n), R = new Float32Array(n);
  const ph = [0, 0, 0, 0, 0, 0];
  const noise = Float32Array.from({ length: n }, rnd);
  const nf = hp(lp(noise, (i) => 0.02 + 0.5 * (i / n) ** 2), () => 0.01);
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const f = 90 * Math.pow(2, 4.2 * u ** 1.6); // ~4 octaves up
    const env = u ** 2.2;
    let l = 0, r = 0;
    [-0.12, 0, 0.11].forEach((det, k) => {
      ph[k] = (ph[k] + (f * (1 + det * 0.06)) / SR) % 1;
      ph[k + 3] = (ph[k + 3] + (f * 2 * (1 - det * 0.05)) / SR) % 1;
      const s = (2 * ph[k] - 1) * 0.5 + Math.sin(2 * Math.PI * ph[k + 3]) * 0.3;
      l += s * (k === 0 ? 1 : k === 2 ? 0.4 : 0.7);
      r += s * (k === 2 ? 1 : k === 0 ? 0.4 : 0.7);
    });
    const trem = 1 + 0.25 * Math.sin(2 * Math.PI * (4 + 22 * u ** 2) * (i / SR));
    L[i] = (l * 0.25 + nf[i] * 1.6) * env * trem;
    R[i] = (r * 0.25 + nf[i] * 1.6) * env * trem;
  }
  wav("riser.wav", L, R);
}

// ---- tick (60 ms)
{
  const n = Math.floor(SR * 0.06), L = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    L[i] = (Math.sin(2 * Math.PI * 2400 * t) * 0.6 + Math.sin(2 * Math.PI * 5100 * t) * 0.3 + rnd() * 0.3) * Math.exp(-t * 140);
  }
  wav("tick.wav", L);
}

// ---- impact (1.6 s): pitch-dropping sub + noise snap + tail
{
  const n = Math.floor(SR * 1.6), L = new Float32Array(n), R = new Float32Array(n);
  let ph = 0;
  const noise = lp(Float32Array.from({ length: n }, rnd), (i) => Math.max(0.03, 0.6 * Math.exp(-i / SR * 6)));
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 45 + 110 * Math.exp(-t * 18);
    ph += f / SR;
    const sub = Math.tanh(Math.sin(2 * Math.PI * ph) * 2.2) * Math.exp(-t * 2.6);
    const snap = noise[i] * Math.exp(-t * 9) * 1.3;
    L[i] = sub + snap * 0.9;
    R[i] = sub + snap;
  }
  wav("impact.wav", L, R);
}

// ---- whoosh (0.9 s): band-swept noise, swelling then cut
{
  const n = Math.floor(SR * 0.9), L = new Float32Array(n), R = new Float32Array(n);
  const noise = Float32Array.from({ length: n }, rnd);
  const f = hp(lp(noise, (i) => 0.03 + 0.35 * Math.sin(Math.PI * (i / n)) ** 2), () => 0.02);
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const env = Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 2;
    L[i] = f[i] * env * (1 - 0.5 * u);
    R[i] = f[i] * env * (0.5 + 0.5 * u);
  }
  wav("whoosh.wav", L, R);
}
