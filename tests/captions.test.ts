import { describe, expect, it } from "vitest";
import {
  allocateSentenceTimings,
  buildChapters,
  buildWebVtt,
  defaultChaptersRelativePath,
  formatChapterTimestamp,
  formatVttTimestamp,
  humanizeSectionId,
  parseVttDuration,
  splitSentences,
} from "../src/pipeline/captions.js";

describe("captions", () => {
  it("splits sentences", () => {
    expect(splitSentences("Hello there. How are you? Fine!")).toEqual([
      "Hello there.",
      "How are you?",
      "Fine!",
    ]);
  });

  it("allocates by character weight", () => {
    const cues = allocateSentenceTimings("Hi. Longer sentence here.", 0, 10);
    expect(cues).toHaveLength(2);
    expect(cues[0]!.startSec).toBe(0);
    expect(cues[1]!.endSec).toBe(10);
    expect(cues[0]!.endSec).toBeLessThan(cues[1]!.endSec);
    expect(cues[1]!.endSec - cues[1]!.startSec).toBeGreaterThan(
      cues[0]!.endSec - cues[0]!.startSec,
    );
  });

  it("builds WebVTT", () => {
    const vtt = buildWebVtt([
      { id: "a", text: "One. Two.", startSec: 0, durationSec: 4 },
    ]);
    expect(vtt.startsWith("WEBVTT")).toBe(true);
    expect(vtt).toContain("-->");
    expect(parseVttDuration(vtt)).toBeCloseTo(4, 1);
  });

  it("formats timestamps", () => {
    expect(formatVttTimestamp(3661.5)).toBe("01:01:01.500");
  });

  it("builds clickable chapter metadata from section timings", () => {
    expect(humanizeSectionId("key-action")).toBe("Key Action");
    expect(formatChapterTimestamp(65)).toBe("1:05");
    expect(formatChapterTimestamp(3661)).toBe("1:01:01");
    expect(defaultChaptersRelativePath("public/demo/a.vtt")).toBe(
      "public/demo/a.chapters.json",
    );
    const chapters = buildChapters([
      { id: "welcome", text: "Hi.", startSec: 0, durationSec: 2 },
      { id: "home", text: "Home.", startSec: 2, durationSec: 3 },
    ]);
    expect(chapters).toEqual([
      { id: "welcome", label: "Welcome", startSec: 0 },
      { id: "home", label: "Home", startSec: 2 },
    ]);
  });
});
