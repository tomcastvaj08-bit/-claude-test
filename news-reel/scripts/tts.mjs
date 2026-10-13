#!/usr/bin/env node
// Voiceover: ElevenLabs text-to-speech WITH character timestamps.
//
//   node scripts/tts.mjs episodes/<id>            -> build/voice.mp3 + build/words.json
//   node scripts/tts.mjs episodes/<id> --mock     -> silent placeholder with estimated timings
//   node scripts/tts.mjs episodes/<id> --from-file build/voice_raw.mp3
//                                                 -> use audio made elsewhere (e.g. Higgsfield), timings estimated
//   node scripts/tts.mjs --hook                   -> (re)generate the shared series hook line assets/voice/hook.mp3
//   node scripts/tts.mjs --voices                 -> list voices on the ElevenLabs account
//
// episode.json "script" may contain cue markers [[name]] in front of a word. They are stripped
// before synthesis and their times land in words.json -> cues, so scenes can start exactly on them.
// ElevenLabs v3 audio tags like [excited] / [whispers] are passed through to the model.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(ROOT, "config.json"), "utf8"));
const V = cfg.voice;
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const envFile = join(ROOT, ".env");
  if (existsSync(envFile)) {
    const m = readFileSync(envFile, "utf8").match(/^ELEVENLABS_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  }
  throw new Error("Chybí ELEVENLABS_API_KEY (env proměnná nebo news-reel/.env). Alternativa: --mock nebo --from-file.");
}

const ffprobeDur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

function parseScript(raw) {
  // returns { text, cueOffsets: {name: charIndexInText} }
  const cueOffsets = {};
  let text = "";
  const re = /\[\[([\w-]+)\]\]\s*/g;
  let last = 0, m;
  while ((m = re.exec(raw))) {
    text += raw.slice(last, m.index);
    cueOffsets[m[1]] = text.length;
    last = re.lastIndex;
  }
  text += raw.slice(last);
  return { text: text.replace(/[ \t]+/g, " ").trim(), cueOffsets };
}

async function synth(text, { modelId = V.modelId } = {}) {
  const key = apiKey();
  const stability = modelId === "eleven_v3" ? [0, 0.5, 1].reduce((a, b) => (Math.abs(b - V.stability) < Math.abs(a - V.stability) ? b : a)) : V.stability;
  const body = {
    text,
    model_id: modelId,
    language_code: V.languageCode,
    voice_settings: { stability, similarity_boost: V.similarityBoost, style: V.style, use_speaker_boost: true },
  };
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${V.voiceId}/with-timestamps?output_format=mp3_44100_192`;
  let res = await fetch(url, { method: "POST", headers: { "xi-api-key": key, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (res.status === 400 || res.status === 422) {
    const err = await res.text();
    console.warn(`ElevenLabs ${res.status}: ${err.slice(0, 300)}`);
    if (modelId !== V.fallbackModelId && V.fallbackModelId) {
      console.warn(`-> zkouším fallback model ${V.fallbackModelId}`);
      return synth(text.replace(/\[[a-z ]+\]\s*/gi, ""), { modelId: V.fallbackModelId });
    }
    throw new Error(err);
  }
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return { audio: Buffer.from(j.audio_base64, "base64"), alignment: j.alignment ?? j.normalized_alignment, sentText: body.text, modelId };
}

// Map every char of `text` to a start/end time using the alignment (tolerant to small mismatches).
function charTimes(text, al) {
  const chars = al.characters, st = al.character_start_times_seconds, en = al.character_end_times_seconds;
  const out = new Array(text.length);
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    let k = j;
    while (k < chars.length && k < j + 6 && chars[k] !== text[i]) k++;
    if (k < chars.length && chars[k] === text[i]) {
      out[i] = [st[k], en[k]];
      j = k + 1;
    } else out[i] = out[i - 1] ?? [0, 0];
  }
  return out;
}

function wordsFrom(text, times) {
  const words = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) {
    if (/^\[[^\]]*\]$/.test(m[0])) continue; // v3 audio tag
    const a = m.index, b = m.index + m[0].length - 1;
    words.push({ text: m[0], start: +times[a][0].toFixed(3), end: +times[b][1].toFixed(3) });
  }
  return words;
}

function tempoize(inFile, outFile, tempo) {
  // atempo keeps pitch; also trim leading silence so the voice hits right after the hook
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", inFile, "-af", `atempo=${tempo},silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02`, "-ar", "48000", "-b:a", "192k", outFile]);
}
function leadSilenceSec(file) {
  try {
    const r = execFileSync("bash", ["-c", `ffmpeg -v info -i "${file}" -af silencedetect=n=-50dB:d=0.02 -f null - 2>&1 | grep -m1 -E 'silence_(start|end)'`]).toString();
    const s = r.match(/silence_start: ([\d.-]+)/), e = r.match(/silence_end: ([\d.]+)/);
    if (s && Math.abs(+s[1]) < 0.01 && e) return +e[1];
  } catch {}
  return 0;
}

function estimateWords(text, duration, lead = 0) {
  // weights: chars + pauses at punctuation
  const toks = [...text.matchAll(/\S+/g)].filter((m) => !/^\[[^\]]*\]$/.test(m[0]));
  const w = toks.map((m) => m[0].length + 2 + (/[.!?]$/.test(m[0]) ? 5 : /[,;:–]$/.test(m[0]) ? 2.5 : 0));
  const sum = w.reduce((a, b) => a + b, 0);
  const usable = duration - lead - 0.15;
  let t = lead;
  const times = new Array(text.length).fill(null);
  const words = toks.map((m, i) => {
    const d = (w[i] / sum) * usable;
    const pause = /[.!?]$/.test(m[0]) ? (5 / w[i]) * d : /[,;:–]$/.test(m[0]) ? (2.5 / w[i]) * d : 0;
    const wd = { text: m[0], start: +t.toFixed(3), end: +(t + d - pause).toFixed(3), index: m.index };
    t += d;
    return wd;
  });
  return words;
}

async function episode(dir) {
  const epDir = resolve(dir);
  const ep = JSON.parse(readFileSync(join(epDir, "episode.json"), "utf8"));
  const build = join(epDir, "build");
  mkdirSync(build, { recursive: true });
  const { text, cueOffsets } = parseScript(ep.script);
  const tempo = ep.tempo ?? V.tempo ?? 1;
  const outAudio = join(build, "voice.mp3");
  let words, cues = {}, source;

  if (flag("--mock")) {
    // silent track, ~14 chars/s at tempo 1
    const est = estimateWords(text, (text.length / 14.5) / tempo + 0.3);
    const dur = est.at(-1).end + 0.3;
    execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `anullsrc=r=48000:cl=stereo`, "-t", String(dur), "-b:a", "128k", outAudio]);
    words = est;
    source = "mock";
  } else if (opt("--from-file")) {
    const src = resolve(opt("--from-file"));
    tempoize(src, outAudio, tempo);
    words = estimateWords(text, ffprobeDur(outAudio));
    source = `file:${src}`;
  } else {
    console.log(`ElevenLabs: voice=${V.voiceId} model=${V.modelId} (${text.length} znaků)`);
    const r = await synth(text);
    const raw = join(build, "voice_raw.mp3");
    writeFileSync(raw, r.audio);
    writeFileSync(join(build, "alignment.json"), JSON.stringify(r.alignment));
    const lead = leadSilenceSec(raw);
    tempoize(raw, outAudio, tempo);
    const ct = charTimes(r.sentText, r.alignment).map(([a, b]) => [Math.max(0, (a - lead) / tempo), Math.max(0, (b - lead) / tempo)]);
    words = wordsFrom(r.sentText, ct);
    for (const [name, off] of Object.entries(cueOffsets)) cues[name] = +ct[Math.min(off, ct.length - 1)][0].toFixed(3);
    source = `elevenlabs:${r.modelId}`;
  }

  if (!Object.keys(cues).length) {
    // map cue char offsets onto estimated words
    for (const [name, off] of Object.entries(cueOffsets)) {
      const w = words.find((w) => (w.index ?? 0) >= off) ?? words.at(-1);
      cues[name] = w.start;
    }
  }
  words = words.map(({ index, ...w }) => w);
  const duration = +ffprobeDur(outAudio).toFixed(3);
  writeFileSync(join(build, "words.json"), JSON.stringify({ source, tempo, duration, cues, words }, null, 1));
  console.log(`hotovo: ${duration}s, ${words.length} slov, cues: ${Object.entries(cues).map(([k, v]) => `${k}@${v}`).join(" ")}`);
}

async function hookLine() {
  const dir = join(ROOT, "assets", "voice");
  mkdirSync(dir, { recursive: true });
  const r = await synth(V.hookLine);
  const raw = join(dir, "hook_raw.mp3");
  writeFileSync(raw, r.audio);
  tempoize(raw, join(dir, "hook.mp3"), V.tempo ?? 1);
  console.log(`assets/voice/hook.mp3 (${ffprobeDur(join(dir, "hook.mp3")).toFixed(2)}s)`);
}

async function listVoices() {
  const res = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", { headers: { "xi-api-key": apiKey() } });
  const j = await res.json();
  for (const v of j.voices ?? []) console.log(`${v.voice_id}  ${v.name}  [${v.category}] ${Object.values(v.labels ?? {}).join(", ")}  ${v.preview_url ?? ""}`);
}

if (flag("--voices")) await listVoices();
else if (flag("--hook")) await hookLine();
else if (args[0] && !args[0].startsWith("--")) await episode(args[0]);
else {
  console.error("usage: tts.mjs episodes/<id> [--mock | --from-file f.mp3] | --hook | --voices");
  process.exit(1);
}
