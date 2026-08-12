import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { DemoConfig } from "../config-schema.js";
import { runCommandOk } from "./process.js";

export interface EncodeVideoOptions {
  width: number;
  height: number;
  fps: number;
  background: string;
}

export function buildScalePadFilter(options: EncodeVideoOptions): string {
  const { width, height, background } = options;
  const bg = background.replace("#", "");
  return [
    `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x${bg}`,
    "setsar=1",
  ].join(",");
}

/** Build ffmpeg argv to turn a still PNG into a timed H.264 segment. */
export function buildStillSegmentArgs(options: {
  pngPath: string;
  durationSec: number;
  outputPath: string;
  video: EncodeVideoOptions;
}): string[] {
  const vf = buildScalePadFilter(options.video);
  return [
    "-y",
    "-loop",
    "1",
    "-i",
    options.pngPath,
    "-t",
    options.durationSec.toFixed(3),
    "-r",
    String(options.video.fps),
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-preset",
    "medium",
    "-an",
    options.outputPath,
  ];
}

/** Re-encode / pad an interactive clip to target resolution and duration. */
export function buildVideoSegmentArgs(options: {
  inputPath: string;
  durationSec: number;
  outputPath: string;
  video: EncodeVideoOptions;
}): string[] {
  const vf = buildScalePadFilter(options.video);
  return [
    "-y",
    "-i",
    options.inputPath,
    "-t",
    options.durationSec.toFixed(3),
    "-r",
    String(options.video.fps),
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-preset",
    "medium",
    "-an",
    options.outputPath,
  ];
}

export async function encodeStillSegment(options: {
  pngPath: string;
  durationSec: number;
  outputPath: string;
  video: DemoConfig["video"];
}): Promise<void> {
  await mkdir(dirname(options.outputPath), { recursive: true });
  await runCommandOk(
    "ffmpeg",
    buildStillSegmentArgs({
      pngPath: options.pngPath,
      durationSec: options.durationSec,
      outputPath: options.outputPath,
      video: options.video,
    }),
  );
}

export async function encodeVideoSegment(options: {
  inputPath: string;
  durationSec: number;
  outputPath: string;
  video: DemoConfig["video"];
}): Promise<void> {
  await mkdir(dirname(options.outputPath), { recursive: true });
  await runCommandOk(
    "ffmpeg",
    buildVideoSegmentArgs({
      inputPath: options.inputPath,
      durationSec: options.durationSec,
      outputPath: options.outputPath,
      video: options.video,
    }),
  );
}

export async function concatVideoSegments(
  segmentPaths: string[],
  outputPath: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  const listPath = join(dirname(outputPath), "concat-list.txt");
  const body = segmentPaths
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
}

export async function muxVideoAudio(options: {
  videoPath: string;
  audioPath: string;
  outputPath: string;
}): Promise<void> {
  await mkdir(dirname(options.outputPath), { recursive: true });
  await runCommandOk("ffmpeg", [
    "-y",
    "-i",
    options.videoPath,
    "-i",
    options.audioPath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    options.outputPath,
  ]);
}

export async function renderTitleCardPng(options: {
  outputPath: string;
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  background: string;
}): Promise<void> {
  await mkdir(dirname(options.outputPath), { recursive: true });
  const bg = options.background.replace("#", "");
  const titleEsc = escapeDrawtext(options.title);
  const subtitleEsc = options.subtitle
    ? escapeDrawtext(options.subtitle)
    : "";
  await runCommandOk("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x${bg}:s=${options.width}x${options.height}:d=1`,
    "-vf",
    `drawtext=text='${titleEsc}':fontsize=64:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40${
      subtitleEsc
        ? `,drawtext=text='${subtitleEsc}':fontsize=32:fontcolor=white@0.85:x=(w-text_w)/2:y=(h-text_h)/2+40`
        : ""
    }`,
    "-frames:v",
    "1",
    options.outputPath,
  ]);
}

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "%%");
}
