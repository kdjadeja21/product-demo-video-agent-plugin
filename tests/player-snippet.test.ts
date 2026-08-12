import { describe, expect, it } from "vitest";
import { generatePlayerSnippet } from "../src/services/player-snippet.js";

describe("generatePlayerSnippet", () => {
  const chapters = [
    { id: "welcome", label: "Welcome", startSec: 0 },
    { id: "home", label: "Home", startSec: 4.5 },
  ];

  it("emits HTML Watch Demo button, video, track, and in-player chapters", () => {
    const html = generatePlayerSnippet({
      format: "html",
      videoSrc: "/demo/a.mp4",
      captionsSrc: "/demo/a.vtt",
      chapters,
    });
    expect(html).toContain("Watch Demo");
    expect(html).toContain('data-pd-open');
    expect(html).toContain('<source src="/demo/a.mp4"');
    expect(html).toContain('src="/demo/a.vtt"');
    expect(html).toContain('kind="captions"');
    expect(html).toContain('data-pd-start="0"');
    expect(html).toContain('data-pd-start="4.5"');
    expect(html).toContain("Welcome");
    expect(html).toContain("pd-segments");
    expect(html).toContain("pd-segment-label");
    expect(html).toContain('data-pd-time');
    expect(html).toContain("0:00 / 0:00");
    expect(html).toContain("syncClock");
    expect(html).toContain("loadedmetadata");
    expect(html).not.toContain("pd-chapter-list");
    expect(html).not.toContain("pd-chapter-time");
    expect(html).not.toContain("0:04");
  });

  it("emits React WatchDemoButton with in-player chapter segments", () => {
    const jsx = generatePlayerSnippet({
      format: "react",
      videoSrc: "/demo/a.mp4",
      captionsSrc: "/demo/a.vtt",
      playPauseFlash: false,
      chapters,
    });
    expect(jsx).toContain("export function ProductDemoPlayer");
    expect(jsx).toContain("export function WatchDemoButton");
    expect(jsx).toContain("PRODUCT_DEMO_CHAPTERS");
    expect(jsx).toContain("/demo/a.mp4");
    expect(jsx).toContain('id: "welcome"');
    expect(jsx).toContain("startSec: 4.5");
    expect(jsx).toContain("data-pd-time");
    expect(jsx).toContain("formatPlaybackClock");
    expect(jsx).toContain('preload="metadata"');
    expect(jsx).toContain("Demo chapters");
    expect(jsx).not.toContain("pd-chapter-list");
    expect(jsx).not.toContain("minWidth: \"3rem\"");
  });

  it("can omit the Watch Demo button", () => {
    const html = generatePlayerSnippet({
      format: "html",
      videoSrc: "/demo/a.mp4",
      captionsSrc: "/demo/a.vtt",
      watchDemoButton: false,
      chapters,
    });
    expect(html).not.toContain("Watch Demo</button>");
    expect(html).not.toContain("data-pd-open");
    expect(html).toContain('data-pd-start="0"');
    expect(html).toContain('data-pd-time');
    expect(html).toContain("0:00 / 0:00");
    expect(html).not.toContain("pd-chapter-time");
  });
});
