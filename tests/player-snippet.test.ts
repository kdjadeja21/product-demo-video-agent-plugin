import { describe, expect, it } from "vitest";
import { generatePlayerSnippet } from "../src/services/player-snippet.js";

describe("generatePlayerSnippet", () => {
  const chapters = [
    { id: "welcome", label: "Welcome", startSec: 0 },
    { id: "home", label: "Home", startSec: 4.5 },
  ];

  it("emits HTML Watch Demo button, native video controls, track, and chapter buttons", () => {
    const html = generatePlayerSnippet({
      format: "html",
      videoSrc: "/demo/a.mp4",
      captionsSrc: "/demo/a.vtt",
      chapters,
    });
    expect(html).toContain("Watch Demo");
    expect(html).toContain("data-pd-open");
    expect(html).toContain("<source src=\"/demo/a.mp4\"");
    expect(html).toContain("src=\"/demo/a.vtt\"");
    expect(html).toContain("kind=\"captions\"");
    expect(html).toContain("controls");
    expect(html).toContain("playsinline");
    expect(html).toContain("data-pd-start=\"0\"");
    expect(html).toContain("data-pd-start=\"4.5\"");
    expect(html).toContain("Welcome");
    expect(html).toContain("pd-chapters");
    expect(html).toContain("Demo chapters");
    expect(html).toContain("stopPlayback");
    expect(html).toContain("video.pause()");
    expect(html).toContain("video.currentTime = 0");
    expect(html).toContain("dialog?.addEventListener(\"close\"");
    expect(html).not.toContain("pd-chapter-list");
    expect(html).not.toContain("pd-chrome");
    expect(html).not.toContain("data-pd-cc");
    expect(html).not.toContain("is-idle");
    expect(html).not.toContain("scheduleIdle");
  });

  it("emits React WatchDemoButton with native controls and dialog stop", () => {
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
    expect(jsx).toContain("id: \"welcome\"");
    expect(jsx).toContain("startSec: 4.5");
    expect(jsx).toContain("preload=\"metadata\"");
    expect(jsx).toContain("controls");
    expect(jsx).toContain("playsInline");
    expect(jsx).toContain("Demo chapters");
    expect(jsx).toContain("onClose={stopPlayback}");
    expect(jsx).toContain("video.pause()");
    expect(jsx).toContain("video.currentTime = 0");
    expect(jsx).toContain("seekTo");
    expect(jsx).not.toContain("pd-chapter-list");
    expect(jsx).not.toContain("showControls");
    expect(jsx).not.toContain("scheduleIdle");
    expect(jsx).not.toContain("Toggle captions");
    expect(jsx).not.toContain("toggleFullscreen");
    expect(jsx).not.toContain("formatPlaybackClock");
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
    expect(html).toContain("controls");
    expect(html).toContain("data-pd-start=\"0\"");
    expect(html).toContain("Welcome");
  });
});
