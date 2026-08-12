import { describe, expect, it } from "vitest";
import {
  buildScalePadFilter,
  buildStillSegmentArgs,
  buildVideoSegmentArgs,
} from "../src/pipeline/encode.js";

describe("ffmpeg argv builders", () => {
  const video = {
    width: 1920,
    height: 1080,
    fps: 30,
    background: "#1E1033",
  };

  it("builds scale+pad filter without crop", () => {
    const vf = buildScalePadFilter(video);
    expect(vf).toContain("force_original_aspect_ratio=decrease");
    expect(vf).toContain("pad=1920:1080");
    expect(vf).not.toContain("crop=");
  });

  it("still args use argv array shape", () => {
    const args = buildStillSegmentArgs({
      pngPath: "/tmp/a.png",
      durationSec: 2.5,
      outputPath: "/tmp/a.mp4",
      video,
    });
    expect(args[0]).toBe("-y");
    expect(args).toContain("-vf");
    expect(args).toContain("libx264");
    expect(args.at(-1)).toBe("/tmp/a.mp4");
  });

  it("video segment args include duration", () => {
    const args = buildVideoSegmentArgs({
      inputPath: "/tmp/a.webm",
      durationSec: 3,
      outputPath: "/tmp/b.mp4",
      video,
    });
    expect(args).toContain("3.000");
  });
});
