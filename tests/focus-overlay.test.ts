import { describe, expect, it } from "vitest";
import {
  buildLiveFocusCss,
  buildOfflineFocusSvg,
  expandRect,
} from "../src/pipeline/focus-overlay.js";

describe("focus overlay", () => {
  it("expands rect with padding inside bounds", () => {
    const expanded = expandRect(
      { x: 10, y: 10, width: 20, height: 20 },
      5,
      { x: 0, y: 0, width: 100, height: 100 },
    );
    expect(expanded).toEqual({ x: 5, y: 5, width: 30, height: 30 });
  });

  it("live CSS dims outside and outlines target", () => {
    const css = buildLiveFocusCss("[data-demo-focus='cta']");
    expect(css).toContain("product-demo-focus-active");
    expect(css).toContain("[data-demo-focus='cta']");
    expect(css).toContain("outline:");
    expect(css).not.toContain("scale(");
  });

  it("offline SVG uses mask hole without transforms", () => {
    const svg = buildOfflineFocusSvg(
      { x: 0, y: 0, width: 1920, height: 1080 },
      { x: 100, y: 200, width: 300, height: 80 },
    );
    expect(svg).toContain("<svg");
    expect(svg).toContain('mask id="hole"');
    expect(svg).not.toContain("translate");
  });
});
