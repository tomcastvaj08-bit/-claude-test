#!/usr/bin/env node
// One-shot: voiceover (unless it already exists) -> full render.
//   node scripts/build.mjs episodes/<id> [--mock] [--retts] [--fps n]
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const ep = args[0];
const run = (script, extra) => execFileSync("node", [join(ROOT, "scripts", script), ep, ...extra], { stdio: "inherit" });

if (!existsSync(join(ROOT, "assets", "sfx", "riser.wav"))) execFileSync("node", [join(ROOT, "scripts", "sfx.mjs")], { stdio: "inherit" });
if (args.includes("--retts") || args.includes("--mock") || !existsSync(join(ep, "build", "words.json"))) {
  run("tts.mjs", args.includes("--mock") ? ["--mock"] : []);
}
const fps = args.includes("--fps") ? ["--fps", args[args.indexOf("--fps") + 1]] : [];
run("render.mjs", fps);
