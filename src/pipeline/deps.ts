import { commandExists } from "./process.js";

export interface DependencyReport {
  ffmpeg: boolean;
  ffprobe: boolean;
  edgeTts: boolean;
  ok: boolean;
  missing: string[];
}

export async function checkDependencies(): Promise<DependencyReport> {
  const ffmpeg = await commandExists("ffmpeg");
  const ffprobe = await commandExists("ffprobe");
  const edgeTts = await commandExists("edge-tts");
  const missing: string[] = [];
  if (!ffmpeg) missing.push("ffmpeg (install ffmpeg and ensure it is on PATH)");
  if (!ffprobe) missing.push("ffprobe (install ffmpeg, which bundles ffprobe)");
  if (!edgeTts) missing.push("edge-tts (pip install edge-tts)");
  return {
    ffmpeg,
    ffprobe,
    edgeTts,
    ok: missing.length === 0,
    missing,
  };
}
