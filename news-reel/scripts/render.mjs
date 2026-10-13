#!/usr/bin/env node
// Renders an episode to MP4 (1080x1920): headless Chromium screenshots every frame of
// engine/index.html, ffmpeg encodes them, then mixes voice + series SFX (+ optional music bed).
//
//   node scripts/render.mjs episodes/<id>                 full render -> episodes/<id>/build/reel.mp4
//   node scripts/render.mjs episodes/<id> --stills 0.5,2.5,6   PNG stills for a quick visual check
//   node scripts/render.mjs episodes/<id> --fps 15        faster draft
//   node scripts/render.mjs episodes/<id> --contact       contact sheet (one frame every second)
//   node scripts/render.mjs episodes/<id> --mux-only      only re-mix audio onto the last rendered video
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, readdirSync, statSync, createReadStream } from "node:fs";
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

if (opt("--stills")) {
  const files = await stills(opt("--stills").split(",").map(Number));
  console.log(files.join("\n"));
} else if (args.includes("--contact")) {
  const times = [];
  for (let t = 0.3; t < meta.duration; t += meta.duration > 30 ? 1.5 : 1) times.push(+t.toFixed(2));
  const files = await stills(times, join(build, "contact"));
  const cols = 6;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-pattern_type", "glob", "-i", join(build, "contact", "*.png"), "-vf", `scale=270:480,tile=${cols}x${Math.ceil(files.length / cols)}:padding=6:color=white`, "-frames:v", "1", join(build, "contact.png")]);
  console.log(join(build, "contact.png"));
} else if (args.includes("--mux-only") && existsSync(join(build, "video_silent.mp4"))) {
  // audio-only change (new voice / mix tweak): reuse the rendered frames
  mixAndMux(join(build, "video_silent.mp4"), meta);
} else {
  const fps = Number(opt("--fps") ?? meta.fps);
  const frames = Math.ceil(meta.duration * fps);
  const silent = join(build, "video_silent.mp4");
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(fps), silent], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await setT(f / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
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
function mixAndMux(silent, meta) {
  const A = cfg.audio;
  const sfx = (n) => join(ROOT, "assets", "sfx", n);
  if (!existsSync(sfx("riser.wav"))) execFileSync("node", [join(ROOT, "scripts", "sfx.mjs")], { stdio: "inherit" });
  const inputs = [], filters = [], labels = [];
  let nIn = 1; // input 0 is the silent video
  const add = (file, at, gainDb, extra = "") => {
    const i = nIn++;
    inputs.push("-i", file);
    const ms = Math.max(0, Math.round(at * 1000));
    filters.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo${extra},volume=${gainDb}dB,adelay=${ms}|${ms}[a${i}]`);
    labels.push(`[a${i}]`);
    return `[a${i}]`;
  };
  const h = meta.hook;
  const riserDur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", sfx("riser.wav")]).toString());
  add(sfx("riser.wav"), h.impact - riserDur + 0.04, A.sfxGainDb - 2);
  h.ticks.forEach((t) => add(sfx("tick.wav"), t, A.sfxGainDb - 6));
  add(sfx("impact.wav"), h.impact, A.sfxGainDb);
  add(sfx("whoosh.wav"), h.whoosh, A.sfxGainDb - 3);
  const hookVoice = join(ROOT, "assets", "voice", "hook.mp3");
  if (existsSync(hookVoice)) add(hookVoice, A.hookVoiceAt, A.voiceGainDb);
  const voice = join(build, "voice.mp3");
  const vLabel = add(voice, meta.voiceStart, A.voiceGainDb);

  const musicDir = join(ROOT, "assets", "music");
  const music = existsSync(musicDir) ? readdirSync(musicDir).find((f) => /^bed\.(mp3|wav|m4a)$/.test(f)) : null;
  let musicLabel = null;
  if (music) {
    const i = nIn++;
    inputs.push("-stream_loop", "-1", "-i", join(musicDir, music));
    const fadeAt = Math.max(0, meta.duration - 1.2);
    filters.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${A.musicGainDb}dB,afade=t=in:st=0:d=0.4,afade=t=out:st=${fadeAt}:d=1.2,atrim=0:${meta.duration}[m${i}]`);
    musicLabel = `[m${i}]`;
  }
  // voice is split so it can also duck the music
  const vIdx = labels.indexOf(vLabel);
  let mixInputs = labels.slice();
  if (musicLabel) {
    filters.push(`${vLabel}asplit=2[vmix][vkey]`, `${musicLabel}[vkey]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[mduck]`);
    mixInputs[vIdx] = "[vmix]";
    mixInputs.push("[mduck]");
  }
  filters.push(`${mixInputs.join("")}amix=inputs=${mixInputs.length}:normalize=0:duration=longest,alimiter=limit=0.95,apad,atrim=0:${meta.duration.toFixed(3)}[out]`);
  const out = join(build, "reel.mp4");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", silent, ...inputs, "-filter_complex", filters.join(";"), "-map", "0:v", "-map", "[out]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out], { stdio: "inherit" });
  console.log(`✔ ${out}`);
}
