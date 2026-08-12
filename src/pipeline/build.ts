import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ResolvedDemoConfig } from "../config-schema.js";
import { captureForBuild, probeDemo, type CaptureArtifact } from "./browser-capture.js";
import { buildWebVtt, type SectionTiming } from "./captions.js";
import {
  concatVideoSegments,
  encodeStillSegment,
  encodeVideoSegment,
  muxVideoAudio,
} from "./encode.js";
import {
  concatAudioFiles,
  synthesizeAllSections,
  type NarrationResult,
} from "./narration.js";
import { checkDependencies } from "./deps.js";
import { inspectDemoOutput, type InspectReport } from "./verify.js";

export interface BuildResult {
  videoPath: string;
  captionsPath: string;
  draftDir: string;
  sectionTimings: SectionTiming[];
  inspect: InspectReport;
}

export async function runProbe(config: ResolvedDemoConfig) {
  const deps = await checkDependencies();
  if (!deps.ffmpeg || !deps.ffprobe) {
    throw new Error(
      `Missing required tools: ${deps.missing.join(", ")}. Install ffmpeg/ffprobe.`,
    );
  }
  return probeDemo(config);
}

export async function runBuild(config: ResolvedDemoConfig): Promise<BuildResult> {
  const deps = await checkDependencies();
  if (!deps.ok) {
    throw new Error(
      `Missing required tools: ${deps.missing.join(", ")}`,
    );
  }

  const draftDir = config.resolved.draftDir;
  await mkdir(draftDir, { recursive: true });
  await mkdir(dirname(config.resolved.video), { recursive: true });
  await mkdir(dirname(config.resolved.captions), { recursive: true });

  const narrations = await synthesizeAllSections({
    sections: config.sections.map((s) => ({ id: s.id, text: s.text })),
    draftDir,
    tts: config.tts,
  });

  const artifacts = await captureForBuild(config);
  const byId = new Map(artifacts.map((a) => [a.sectionId, a]));

  const segmentDir = join(draftDir, "segments");
  await mkdir(segmentDir, { recursive: true });

  const segmentPaths: string[] = [];
  const sectionTimings: SectionTiming[] = [];
  let cursor = 0;

  for (const section of config.sections) {
    const narration = narrations.find((n) => n.sectionId === section.id);
    if (!narration) {
      throw new Error(`Missing narration for section ${section.id}`);
    }
    const artifact = byId.get(section.id);
    if (!artifact) {
      throw new Error(`Missing capture for section ${section.id}`);
    }
    const segmentPath = join(segmentDir, `${section.id}.mp4`);
    await encodeArtifactSegment({
      artifact,
      durationSec: narration.durationSec,
      outputPath: segmentPath,
      video: config.video,
    });
    segmentPaths.push(segmentPath);
    sectionTimings.push({
      id: section.id,
      text: section.text,
      startSec: cursor,
      durationSec: narration.durationSec,
    });
    cursor += narration.durationSec;
  }

  const silentVideo = join(draftDir, "video-silent.mp4");
  await concatVideoSegments(segmentPaths, silentVideo);

  const narrationPath = join(draftDir, "narration.mp3");
  await concatAudioFiles(
    narrations.map((n) => n.audioPath),
    narrationPath,
  );

  const muxedDraft = join(draftDir, "product-demo.mp4");
  await muxVideoAudio({
    videoPath: silentVideo,
    audioPath: narrationPath,
    outputPath: muxedDraft,
  });

  const vtt = buildWebVtt(sectionTimings);
  const captionsDraft = join(draftDir, "product-demo.vtt");
  await writeFile(captionsDraft, vtt, "utf8");

  await copyFile(muxedDraft, config.resolved.video);
  await copyFile(captionsDraft, config.resolved.captions);

  const inspect = await inspectDemoOutput({
    videoPath: config.resolved.video,
    captionsPath: config.resolved.captions,
    draftDir,
    expectedWidth: config.video.width,
    expectedHeight: config.video.height,
  });

  await writeFile(
    join(draftDir, "build-report.json"),
    JSON.stringify({ sectionTimings, inspect, narrations: summarizeNarration(narrations) }, null, 2),
    "utf8",
  );

  return {
    videoPath: config.resolved.video,
    captionsPath: config.resolved.captions,
    draftDir,
    sectionTimings,
    inspect,
  };
}

async function encodeArtifactSegment(options: {
  artifact: CaptureArtifact;
  durationSec: number;
  outputPath: string;
  video: ResolvedDemoConfig["video"];
}): Promise<void> {
  if (options.artifact.kind === "png") {
    await encodeStillSegment({
      pngPath: options.artifact.path,
      durationSec: options.durationSec,
      outputPath: options.outputPath,
      video: options.video,
    });
    return;
  }
  await encodeVideoSegment({
    inputPath: options.artifact.path,
    durationSec: options.durationSec,
    outputPath: options.outputPath,
    video: options.video,
  });
}

function summarizeNarration(items: NarrationResult[]) {
  return items.map((n) => ({
    sectionId: n.sectionId,
    audioPath: n.audioPath,
    durationSec: n.durationSec,
  }));
}
