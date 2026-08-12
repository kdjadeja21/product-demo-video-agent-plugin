import { describe, expect, it } from "vitest";
import { generatePlayerSnippet } from "../src/services/player-snippet.js";

describe("generatePlayerSnippet", () => {
  it("emits HTML with video and track", () => {
    const html = generatePlayerSnippet({
      format: "html",
      videoSrc: "/demo/a.mp4",
      captionsSrc: "/demo/a.vtt",
    });
    expect(html).toContain('<source src="/demo/a.mp4"');
    expect(html).toContain('src="/demo/a.vtt"');
    expect(html).toContain('kind="captions"');
  });

  it("emits React component source", () => {
    const jsx = generatePlayerSnippet({
      format: "react",
      videoSrc: "/demo/a.mp4",
      captionsSrc: "/demo/a.vtt",
      playPauseFlash: false,
    });
    expect(jsx).toContain("export function ProductDemoPlayer");
    expect(jsx).toContain("/demo/a.mp4");
  });
});
