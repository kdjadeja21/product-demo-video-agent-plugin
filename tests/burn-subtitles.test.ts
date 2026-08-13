import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ffmpegHasSubtitlesFilter } from "../src/pipeline/deps.js";
import { burnSubtitlesIntoVideo } from "../src/pipeline/encode.js";
import { commandExists, runCommandOk } from "../src/pipeline/process.js";
import { ffprobeMedia } from "../src/pipeline/verify.js";

const hasFfmpeg = await commandExists("ffmpeg");
const hasSubtitles = hasFfmpeg && (await ffmpegHasSubtitlesFilter());

describe.runIf(hasSubtitles)("burnSubtitlesIntoVideo", () => {
  it("keeps audio and produces a captioned MP4 when ffmpeg has libass", async () => {
    const dir = await mkdtemp(join(tmpdir(), "product-demo-burn-"));
    await mkdir(dir, { recursive: true });
    const input = join(dir, "in.mp4");
    const captions = join(dir, "in.vtt");
    const output = join(dir, "out.mp4");
    await runCommandOk("ffmpeg", [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=640x360:d=1",
      "-f",
      "lavfi",
      "-i",
      "sine=f=440:d=1",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      input,
    ]);
    await writeFile(
      captions,
      "WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.000\nHello captions\n",
      "utf8",
    );
    await burnSubtitlesIntoVideo({
      videoPath: input,
      captionsPath: captions,
      outputPath: output,
    });
    const probe = await ffprobeMedia(output);
    expect(probe.hasAudio).toBe(true);
    expect(probe.width).toBe(640);
    expect(probe.height).toBe(360);
  });
});
