import { commandExists, runCommand } from "./process.js";

export interface DependencyReport {
  ffmpeg: boolean;
  ffprobe: boolean;
  edgeTts: boolean;
  /** True when ffmpeg was built with libass `subtitles` (needed to burn-in captions). */
  ffmpegSubtitlesFilter: boolean;
  ok: boolean;
  missing: string[];
}

export async function ffmpegHasSubtitlesFilter(): Promise<boolean> {
  const result = await runCommand("ffmpeg", ["-hide_banner", "-filters"]);
  const text = `${result.stdout}\n${result.stderr}`;
  return /(^|\s)subtitles\s/.test(text);
}

export async function checkDependencies(): Promise<DependencyReport> {
  const ffmpeg = await commandExists("ffmpeg");
  const ffprobe = await commandExists("ffprobe");
  const edgeTts = await commandExists("edge-tts");
  const ffmpegSubtitlesFilter = ffmpeg
    ? await ffmpegHasSubtitlesFilter()
    : false;
  const missing: string[] = [];
  if (!ffmpeg) missing.push("ffmpeg (install ffmpeg and ensure it is on PATH)");
  if (!ffprobe) missing.push("ffprobe (install ffmpeg, which bundles ffprobe)");
  if (!edgeTts) missing.push("edge-tts (pip install edge-tts)");
  return {
    ffmpeg,
    ffprobe,
    edgeTts,
    ffmpegSubtitlesFilter,
    ok: missing.length === 0,
    missing,
  };
}
