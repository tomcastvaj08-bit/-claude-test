#!/usr/bin/env node
// Renders an episode to MP4 (1080x1920): headless Chromium screenshots every frame of
// engine/index.html, ffmpeg encodes them, then mixes voice + series SFX (+ optional music bed).
//
//   node scripts/render.mjs episodes/<id>                 full render -> episodes/<id>/build/reel.mp4
//   node scripts/render.mjs episodes/<id> --stills 0.5,2.5,6   PNG stills for a quick visual check
//   node scripts/render.mjs episodes/<id> --fps 15        faster draft
//   node scripts/render.mjs episodes/<id> --mb 4          motion blur (4 sub-frames/frame; default config.video.motionBlur)
//   node scripts/render.mjs episodes/<id> --contact       contact sheet (one frame every second)
//   node scripts/render.mjs episodes/<id> --cuts          frames around every cut (overlap QA)
//   node scripts/render.mjs episodes/<id> --mux-only      only re-mix audio onto the last rendered video
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, createReadStream } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(ROOT, "config.json"), "utf8"));
const args = process.argv.slice(2);
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const epDir = resolve(args[0] ?? "");
if (!existsSync(join(epDir, "episode.json"))) {
  console.error("usage: render.mjs episodes/<id> [--stills t1,t2] [--fps n] [--contact]");
  process.exit(1);
}
const build = join(epDir, "build");
mkdirSync(build, { recursive: true });

// ---------- static server over news-reel/
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp4": "video/mp4", ".webp": "image/webp" };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(ROOT) || !existsSync(p) || statSync(p).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream", "cache-control": "no-store" });
  createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--disable-lcd-text", "--force-color-profile=srgb"] });
const page = await browser.newPage({ viewport: { width: cfg.video.width, height: cfg.video.height }, deviceScaleFactor: 1 });
page.on("console", (m) => m.type() !== "log" && console.log(`[page ${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => console.error(`[page error] ${e.message}`));
const url = `http://127.0.0.1:${port}/engine/index.html?ep=/${relative(ROOT, epDir)}`;
await page.goto(url);
await page.waitForFunction(() => document.body.dataset.ready || document.body.dataset.error, null, { timeout: 30000 });
const err = await page.evaluate(() => document.body.dataset.error);
if (err) {
  console.error(err);
  process.exit(1);
}
const meta = await page.evaluate(() => window.__meta);
if (meta.estimated) console.warn("⚠ build/words.json chybí – časování je jen odhad (spusť nejdřív scripts/tts.mjs)");
console.log(`duration ${meta.duration.toFixed(2)}s, scenes: ${meta.sceneStarts.map((s) => `${s.template}@${s.start.toFixed(2)}`).join(" ")}`);

const setT = (t) => page.evaluate((t) => window.__setTime(t), t);
// warm-up: touch every second of the timeline once so lazily-loaded layers/backgrounds are ready
for (let t = 0; t < meta.duration; t += 0.5) await setT(t);
await page.waitForTimeout(800);

async function stills(times, dir = join(build, "stills")) {
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (const t of times) {
    await setT(t);
    const f = join(dir, `t${t.toFixed(2).padStart(6, "0")}.png`);
    await page.screenshot({ path: f });
    files.push(f);
  }
  return files;
}

if (args.includes("--cuts")) {
  // QA: frames just before/after every scene change – check that no two texts overlap
  const times = [];
  meta.sceneStarts.forEach((s) => [-0.1, 0.05, 0.2].forEach((d) => times.push(+(s.start + d).toFixed(2))));
  const files = await stills(times, join(build, "cuts"));
  const cols = cfg.video.width > cfg.video.height ? 4 : 6;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-pattern_type", "glob", "-i", join(build, "cuts", "*.png"), "-vf", `scale=${Math.round(cfg.video.width / 4)}:${Math.round(cfg.video.height / 4)},tile=${cols}x${Math.ceil(files.length / cols)}:padding=6:color=white`, "-frames:v", "1", join(build, "cuts.png")]);
  console.log(join(build, "cuts.png"));
} else if (opt("--stills")) {
  const files = await stills(opt("--stills").split(",").map(Number));
  console.log(files.join("\n"));
} else if (args.includes("--contact")) {
  const times = [];
  for (let t = 0.3; t < meta.duration; t += meta.duration > 30 ? 1.5 : 1) times.push(+t.toFixed(2));
  const files = await stills(times, join(build, "contact"));
  const cols = cfg.video.width > cfg.video.height ? 4 : 6;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-pattern_type", "glob", "-i", join(build, "contact", "*.png"), "-vf", `scale=${Math.round(cfg.video.width / 4)}:${Math.round(cfg.video.height / 4)},tile=${cols}x${Math.ceil(files.length / cols)}:padding=6:color=white`, "-frames:v", "1", join(build, "contact.png")]);
  console.log(join(build, "contact.png"));
} else if (args.includes("--mux-only") && existsSync(join(build, "video_silent.mp4"))) {
  // audio-only change (new voice / mix tweak): reuse the rendered frames
  mixAndMux(join(build, "video_silent.mp4"), meta);
} else {
  const fps = Number(opt("--fps") ?? meta.fps);
  // motion blur: N sub-frames per frame across a 180° shutter, averaged by ffmpeg (tmix)
  const mb = Math.max(1, Number(opt("--mb") ?? cfg.video.motionBlur ?? 1));
  const shutter = Number(cfg.video.shutter ?? 0.5); // 0.5 = 180° film shutter
  const frames = Math.ceil(meta.duration * fps);
  const silent = join(build, "video_silent.mp4");
  // film grain is added AFTER the sub-frame average (otherwise averaging would wash it out):
  // luma-weighted temporal noise, new pattern every frame, a little chroma grain
  const g = Number(cfg.video.grain ?? 0);
  const grainF = g > 0 ? `,noise=c0s=${g}:c0f=t+u:c1s=${(g * 0.35).toFixed(1)}:c1f=t:c2s=${(g * 0.35).toFixed(1)}:c2f=t` : "";
  const vf = mb > 1 ? ["-vf", `tmix=frames=${mb},select='eq(mod(n,${mb}),${mb - 1})',setpts=N/${fps}/TB${grainF}`] : g > 0 ? ["-vf", grainF.slice(1)] : [];
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps * mb), "-c:v", "mjpeg", "-i", "-", ...vf, "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-r", String(fps), silent], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    for (let k = 0; k < mb; k++) {
      const sub = mb > 1 ? (k / (mb - 1) - 1) * shutter : 0; // sub-frames trail the frame time
      await setT(Math.max(0, (f + sub) / fps));
      const buf = await page.screenshot({ type: "jpeg", quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    }
    if (f % fps === 0) process.stdout.write(`\rframe ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`\nvideo ok (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  mixAndMux(silent, meta);
}
await browser.close();
server.close();

// ---------- audio
// 1) SFX stem: every event from window.__meta.sfx (hook signature, scene pops/swipes/ticks, cuts, outro)
//    is layered into ONE track -> build/sfx_stem.wav
// 2) final mix: voice + sfx stem (+ optional music bed ducked under the voice) -> reel.mp4
function resolveSfx(name) {
  const dir = join(ROOT, "assets", "sfx");
  const alias = { synth_riser: "riser.wav", tick: "tick.wav" };
  for (const f of [join(dir, "el", `${name}.mp3`), join(dir, "el", `${name}.wav`), join(dir, alias[name] ?? `${name}.wav`)]) if (existsSync(f)) return f;
  return null;
}
function buildSfxStem(meta) {
  if (!existsSync(join(ROOT, "assets", "sfx", "riser.wav"))) execFileSync("node", [join(ROOT, "scripts", "sfx.mjs")], { stdio: "inherit" });
  const events = meta.sfx.map((e) => ({ ...e, file: resolveSfx(e.name) })).filter((e) => e.file);
  const missing = meta.sfx.filter((e) => !resolveSfx(e.name)).map((e) => e.name);
  if (missing.length) console.warn(`⚠ chybí SFX: ${[...new Set(missing)].join(", ")}`);
  const inputs = [], filters = [];
  events.forEach((e, i) => {
    inputs.push("-i", e.file);
    const ms = Math.max(0, Math.round(e.at * 1000));
    // trim long generations, soften their tails
    filters.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:2.6,afade=t=out:st=2.1:d=0.5,volume=${e.gain}dB,adelay=${ms}|${ms}[s${i}]`);
  });
  filters.push(`${events.map((_, i) => `[s${i}]`).join("")}amix=inputs=${events.length}:normalize=0:duration=longest,apad,atrim=0:${meta.duration.toFixed(3)}[out]`);
  const stem = join(build, "sfx_stem.wav");
  execFileSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", filters.join(";"), "-map", "[out]", "-ar", "48000", stem], { stdio: "inherit" });
  writeFileSync(join(build, "sfx_plan.json"), JSON.stringify(events.map(({ file, ...e }) => e), null, 1));
  console.log(`SFX stem: ${events.length} vrstev -> ${stem}`);
  return stem;
}
function mixAndMux(silent, meta) {
  const A = cfg.audio;
  const stem = buildSfxStem(meta);
  const voice = join(build, "voice.mp3");
  const vms = Math.round(meta.voiceStart * 1000);
  const inputs = ["-i", silent, "-i", voice, "-i", stem];
  const f = [
    `[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${A.voiceGainDb}dB,adelay=${vms}|${vms}[v]`,
    `[2:a]volume=${A.sfxGainDb}dB[s]`,
  ];
  let mix = "[v][s]";
  const musicDir = join(ROOT, "assets", "music");
  const music = existsSync(musicDir) ? readdirSync(musicDir).find((x) => /^bed\.(mp3|wav|m4a)$/.test(x)) : null;
  if (music) {
    inputs.push("-stream_loop", "-1", "-i", join(musicDir, music));
    f.push(`[v]asplit=2[v][vk]`);
    f.push(`[3:a]aresample=48000,aformat=channel_layouts=stereo,volume=${A.musicGainDb}dB,afade=t=out:st=${Math.max(0, meta.duration - 1.2)}:d=1.2,atrim=0:${meta.duration}[m0]`, `[m0][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[m]`);
    mix = "[v][s][m]";
  }
  f.push(`${mix}amix=inputs=${music ? 3 : 2}:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,apad,atrim=0:${meta.duration.toFixed(3)}[out]`);
  const out = join(build, "reel.mp4");
  execFileSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", f.join(";"), "-map", "0:v", "-map", "[out]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out], { stdio: "inherit" });
  console.log(`✔ ${out}`);
}
