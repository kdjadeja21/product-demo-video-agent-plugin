import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { DemoConfig } from "../config-schema.js";
import { commandExists, runCommandOk } from "./process.js";

export interface NarrationResult {
  sectionId: string;
  audioPath: string;
  durationSec: number;
}

export async function ensureEdgeTtsAvailable(): Promise<void> {
  if (await commandExists("edge-tts")) return;
  throw new Error(
    "edge-tts not found on PATH. Install with: pip install edge-tts",
  );
}

export async function synthesizeSectionAudio(options: {
  text: string;
  outputPath: string;
  tts: DemoConfig["tts"];
}): Promise<number> {
  const { text, outputPath, tts } = options;
  await mkdir(dirname(outputPath), { recursive: true });
  await ensureEdgeTtsAvailable();
  await runCommandOk("edge-tts", [
    "--voice",
    tts.voice,
    "--rate",
    tts.rate,
    "--text",
    text,
    "--write-media",
    outputPath,
  ]);
  return probeAudioDuration(outputPath);
}

export async function synthesizeAllSections(options: {
  sections: Array<{ id: string; text: string }>;
  draftDir: string;
  tts: DemoConfig["tts"];
}): Promise<NarrationResult[]> {
  const out: NarrationResult[] = [];
  for (const section of options.sections) {
    const audioPath = join(options.draftDir, "audio", `${section.id}.mp3`);
    const durationSec = await synthesizeSectionAudio({
      text: section.text,
      outputPath: audioPath,
      tts: options.tts,
    });
    out.push({ sectionId: section.id, audioPath, durationSec });
  }
  return out;
}

export async function probeAudioDuration(audioPath: string): Promise<number> {
  const { stdout } = await runCommandOk("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    audioPath,
  ]);
  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read audio duration for ${audioPath}`);
  }
  return duration;
}

/** Concatenate per-section audio into one narration track. */
export async function concatAudioFiles(
  files: string[],
  outputPath: string,
): Promise<number> {
  if (files.length === 0) {
    throw new Error("No audio files to concatenate");
  }
  await mkdir(dirname(outputPath), { recursive: true });
  if (files.length === 1) {
    await copyFile(files[0]!, outputPath);
    return probeAudioDuration(outputPath);
  }
  const listPath = `${outputPath}.txt`;
  const body = files
    .map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
    .join("\n");
  await writeFile(listPath, body, "utf8");
  await runCommandOk("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c",
    "copy",
    outputPath,
  ]);
  return probeAudioDuration(outputPath);
}
