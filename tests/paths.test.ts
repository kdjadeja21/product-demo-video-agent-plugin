import { describe, expect, it } from "vitest";
import { PathSafetyError, resolveSafePath } from "../src/paths.js";

describe("resolveSafePath", () => {
  const root = "C:/projects/app";

  it("resolves relative paths under root", () => {
    const resolved = resolveSafePath(root, "public/demo/out.mp4");
    expect(resolved.replace(/\\/g, "/")).toContain("public/demo/out.mp4");
  });

  it("rejects path traversal", () => {
    expect(() => resolveSafePath(root, "../secrets.txt")).toThrow(
      PathSafetyError,
    );
  });

  it("rejects absolute paths by default", () => {
    expect(() => resolveSafePath(root, "C:/Windows/system32")).toThrow(
      PathSafetyError,
    );
  });

  it("allows escape when opted in", () => {
    const resolved = resolveSafePath(root, "../outside.txt", {
      allowEscape: true,
    });
    expect(resolved).toBeTruthy();
  });
});
