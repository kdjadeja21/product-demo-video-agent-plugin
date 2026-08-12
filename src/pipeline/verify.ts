import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseVttDuration } from "./captions.js";
import { runCommandOk } from "./process.js";
import { readFile } from "node:fs/promises";

export interface MediaProbe {
  durationSec: number;
  width?: number;
  height?: number;
  hasAudio?: boolean;
}

export interface InspectReport {
  video?: MediaProbe;
  audioDurationSec?: number;
  captionsDurationSec?: number;
  sampleFrames: string[];
  ok: boolean;
  issues: string[];
}

export async function ffprobeMedia(path: string): Promise<MediaProbe> {
  const { stdout } = await runCommandOk("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    path,
  ]);
  const data = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{
      codec_type?: string;
      width?: number;
      height?: number;
    }>;
  };
  const durationSec = Number.parseFloat(data.format?.duration ?? "0");
  const videoStream = data.streams?.find((s) => s.codec_type === "video");
  const hasAudio = Boolean(data.streams?.some((s) => s.codec_type === "audio"));
  return {
    durationSec,
    width: videoStream?.width,
    height: videoStream?.height,
    hasAudio,
  };
}

export async function extractSampleFrame(
  videoPath: string,
  atSec: number,
  outputPath: string,
): Promise<void> {
  await mkdir(join(outputPath, ".."), { recursive: true });
  await runCommandOk("ffmpeg", [
    "-y",
    "-ss",
    Math.max(0, atSec).toFixed(3),
    "-i",
    videoPath,
    "-frames:v",
    "1",
    outputPath,
  ]);
}

export async function inspectDemoOutput(options: {
  videoPath: string;
  captionsPath?: string;
  draftDir: string;
  expectedWidth?: number;
  expectedHeight?: number;
  durationToleranceSec?: number;
}): Promise<InspectReport> {
  const issues: string[] = [];
  const tolerance = options.durationToleranceSec ?? 0.75;
  const sampleDir = join(options.draftDir, "inspect");
  await mkdir(sampleDir, { recursive: true });

  const video = await ffprobeMedia(options.videoPath);
  if (!video.width || !video.height) {
    issues.push("Video stream missing dimensions");
  }
  if (
    options.expectedWidth &&
    options.expectedHeight &&
    (video.width !== options.expectedWidth ||
      video.height !== options.expectedHeight)
  ) {
    issues.push(
      `Resolution ${video.width}x${video.height} != ${options.expectedWidth}x${options.expectedHeight}`,
    );
  }
  if (!video.hasAudio) {
    issues.push("Video has no audio track");
  }

  let captionsDurationSec: number | undefined;
  if (options.captionsPath) {
    try {
      const vtt = await readFile(options.captionsPath, "utf8");
      captionsDurationSec = parseVttDuration(vtt);
      if (Math.abs(captionsDurationSec - video.durationSec) > tolerance) {
        issues.push(
          `Caption end ${captionsDurationSec.toFixed(2)}s vs video ${video.durationSec.toFixed(2)}s (tol ${tolerance}s)`,
        );
      }
    } catch {
      issues.push(`Captions missing or unreadable: ${options.captionsPath}`);
    }
  }

  const sampleFrames: string[] = [];
  const points = [
    { name: "first", at: 0.1 },
    { name: "mid", at: video.durationSec / 2 },
    { name: "last", at: Math.max(0, video.durationSec - 0.25) },
  ];
  for (const point of points) {
    const out = join(sampleDir, `${point.name}.png`);
    await extractSampleFrame(options.videoPath, point.at, out);
    sampleFrames.push(out);
  }

  return {
    video,
    captionsDurationSec,
    sampleFrames,
    ok: issues.length === 0,
    issues,
  };
}
