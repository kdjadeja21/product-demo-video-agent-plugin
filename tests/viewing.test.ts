import { describe, expect, it } from "vitest";
import {
  buildViewingInstructions,
  guessServedMediaUrl,
} from "../src/services/viewing.js";

describe("guessServedMediaUrl", () => {
  it("maps public/ paths onto baseUrl", () => {
    expect(
      guessServedMediaUrl("http://localhost:3000", "public/demo/product-demo.mp4"),
    ).toBe("http://localhost:3000/demo/product-demo.mp4");
  });

  it("maps static/ paths onto baseUrl", () => {
    expect(
      guessServedMediaUrl("http://localhost:5173/", "static/demo/a.mp4"),
    ).toBe("http://localhost:5173/demo/a.mp4");
  });

  it("returns undefined when the file is not under a served folder", () => {
    expect(guessServedMediaUrl("http://localhost:3000", "out/demo.mp4")).toBe(
      undefined,
    );
  });
});

describe("buildViewingInstructions", () => {
  it("tells the agent to embed the MP4 and link it, not add Watch Demo", () => {
    const text = buildViewingInstructions({
      videoPath: "/app/public/demo/product-demo.mp4",
      playUrl: "http://localhost:3000/demo/product-demo.mp4",
      captionsBurnedIn: true,
    });
    expect(text).toContain("do not add a Watch Demo");
    expect(text).toContain("<video src=\"/app/public/demo/product-demo.mp4\" controls>");
    expect(text).toContain("burned into the picture");
    expect(text).toContain("http://localhost:3000/demo/product-demo.mp4");
    expect(text).toContain("markdown link");
  });
});
