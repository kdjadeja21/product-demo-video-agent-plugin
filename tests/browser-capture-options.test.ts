import { describe, expect, it } from "vitest";
import { buildBrowserContextOptions } from "../src/pipeline/browser-capture.js";
import type { ResolvedDemoConfig } from "../src/config-schema.js";

function minimalConfig(): ResolvedDemoConfig {
  return {
    baseUrl: "http://localhost:3000",
    output: {
      video: "public/demo/a.mp4",
      captions: "public/demo/a.vtt",
      draftDir: "public/demo/draft",
    },
    video: {
      width: 1920,
      height: 1080,
      fps: 30,
      fit: "pad",
      background: "#1E1033",
    },
    tts: {
      provider: "edge-tts",
      voice: "en-US-AvaNeural",
      rate: "+0%",
    },
    sections: [{ id: "home", route: "/", text: "Home." }],
    projectRoot: "/tmp/project",
    resolved: {
      video: "/tmp/project/public/demo/a.mp4",
      captions: "/tmp/project/public/demo/a.vtt",
      draftDir: "/tmp/project/public/demo/draft",
    },
  };
}

describe("buildBrowserContextOptions", () => {
  it("enables reducedMotion reduce for capture", () => {
    const options = buildBrowserContextOptions(minimalConfig(), "/tmp/video");
    expect(options.reducedMotion).toBe("reduce");
    expect(options.viewport).toEqual({ width: 1920, height: 1080 });
    expect(options.recordVideo?.dir).toBe("/tmp/video");
  });
});
