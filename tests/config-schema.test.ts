import { describe, expect, it } from "vitest";
import { parseDemoConfig } from "../src/config-schema.js";

const valid = {
  baseUrl: "http://127.0.0.1:3000",
  output: {
    video: "public/demo/a.mp4",
    captions: "public/demo/a.vtt",
    draftDir: "public/demo/draft",
  },
  sections: [
    { id: "welcome", kind: "title", text: "Hello there." },
    { id: "home", route: "/", text: "Home screen." },
  ],
};

describe("parseDemoConfig", () => {
  it("applies video and tts defaults", () => {
    const cfg = parseDemoConfig(valid, "/tmp/project");
    expect(cfg.video.width).toBe(1920);
    expect(cfg.video.height).toBe(1080);
    expect(cfg.tts.provider).toBe("edge-tts");
    expect(cfg.resolved.video).toContain("a.mp4");
  });

  it("rejects route sections without route", () => {
    expect(() =>
      parseDemoConfig(
        {
          ...valid,
          sections: [{ id: "x", text: "Nope" }],
        },
        "/tmp/project",
      ),
    ).toThrow();
  });

  it("rejects traversal in output paths", () => {
    expect(() =>
      parseDemoConfig(
        {
          ...valid,
          output: {
            video: "../escape.mp4",
            captions: "a.vtt",
            draftDir: "draft",
          },
        },
        "/tmp/project",
      ),
    ).toThrow();
  });
});
