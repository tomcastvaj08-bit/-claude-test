#!/usr/bin/env node
// Turns a voiceover made through the ElevenLabs connector (MCP) into the engine's inputs.
//
//   node scripts/ingest-voice.mjs episodes/<id> <voice.mp3> <scribe-words.json>
//
// voice.mp3         – downloaded eleven_v4 take
// scribe-words.json – Scribe transcript of that take ({ words: [{text,start,end}] })
// Writes build/voice.mp3 (tempo from config/episode, leading silence trimmed) and build/words.json
// with cue times resolved from the [[cue]] markers in episode.json "script".
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(ROOT, "config.json"), "utf8"));
const [epArg, audioArg, wordsArg] = process.argv.slice(2);
if (!wordsArg) {
  console.error("usage: ingest-voice.mjs episodes/<id> <voice.mp3> <scribe-words.json>");
  process.exit(1);
}
const epDir = resolve(epArg);
const ep = JSON.parse(readFileSync(join(epDir, "episode.json"), "utf8"));
const build = join(epDir, "build");
mkdirSync(build, { recursive: true });
const tempo = ep.tempo ?? cfg.voice.tempo ?? 1;

const isSpoken = (t) => !/^\[[^\]]*\]$/.test(t) && /[\p{L}\p{N}]/u.test(t);
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

// script tokens with cue markers
const scriptTokens = [];
const cueAt = {}; // cue -> index into spoken script tokens
// audio tags ([confident, relaxed], [deadpan]…) are direction, not speech – drop them, even multi-word ones
const untag = (s) => s.replace(/(?<!\[)\[[^\[\]]*\](?!\])/g, " ");
for (const tok of untag(ep.script).split(/\s+/).filter(Boolean)) {
  let t = tok;
  let m;
  while ((m = t.match(/^\[\[([\w-]+)\]\](.*)$/))) {
    cueAt[m[1]] = scriptTokens.length;
    t = m[2];
  }
  if (t && isSpoken(t)) scriptTokens.push(t);
}

// leading silence of the raw take
let lead = 0;
try {
  const r = execFileSync("bash", ["-c", `ffmpeg -v info -i "${resolve(audioArg)}" -af silencedetect=n=-50dB:d=0.02 -f null - 2>&1 | grep -m2 -E 'silence_(start|end)'`]).toString();
  const s = r.match(/silence_start: ([\d.-]+)/), e = r.match(/silence_end: ([\d.]+)/);
  if (s && Math.abs(+s[1]) < 0.01 && e) lead = Math.max(0, +e[1] - 0.03);
} catch {}

const raw = JSON.parse(readFileSync(resolve(wordsArg), "utf8"));
let inTag = false;
const spoken = (raw.words ?? raw).filter((w) => {
  const t = w.text, open = t.startsWith("[") || inTag;
  inTag = open && !t.endsWith("]");
  return !open && (w.type ?? "word") === "word" && isSpoken(t);
});
const fix = (t) => +Math.max(0, (t - lead) / tempo).toFixed(3);
const words = spoken.map((w) => ({ text: w.text.replace(/…/g, ""), start: fix(w.start), end: fix(w.end) }));

// align script tokens -> transcript words (greedy, tolerant to small differences)
const map = [];
let j = 0;
for (let i = 0; i < scriptTokens.length; i++) {
  const n = norm(scriptTokens[i]);
  let k = j;
  while (k < words.length && k < j + 4 && norm(words[k].text) !== n) k++;
  if (k < words.length && norm(words[k].text) === n) {
    map[i] = k;
    j = k + 1;
  } else map[i] = Math.min(j, words.length - 1);
}
const cues = {};
for (const [name, idx] of Object.entries(cueAt)) {
  const w = words[map[Math.min(idx, map.length - 1)]];
  cues[name] = Math.max(0, +(w.start - 0.08).toFixed(3)); // cut slightly before the word lands
}

const out = join(build, "voice.mp3");
execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", String(lead), "-i", resolve(audioArg), "-af", `atempo=${tempo}`, "-ar", "48000", "-b:a", "192k", out]);
const duration = +Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString()).toFixed(3);
writeFileSync(join(build, "words.json"), JSON.stringify({ source: `elevenlabs-mcp:${audioArg}`, tempo, duration, cues, words }, null, 1));
console.log(`voice ${duration}s (tempo ${tempo}, lead ${lead.toFixed(2)}s), ${words.length} slov`);
console.log(Object.entries(cues).map(([k, v]) => `${k}@${v}`).join("  "));
