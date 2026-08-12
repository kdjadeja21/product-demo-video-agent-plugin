import { describe, expect, it } from "vitest";
import {
  allocateSentenceTimings,
  buildWebVtt,
  formatVttTimestamp,
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
});
