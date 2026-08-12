import { describe, expect, it } from "vitest";
import { formatDoctorReport, runDoctor } from "../src/pipeline/doctor.js";

describe("runDoctor", () => {
  it("reports node, build, dependency, and playwright checks", async () => {
    const report = await runDoctor();
    const names = report.checks.map((check) => check.name);
    expect(names).toEqual([
      "node",
      "build",
      "ffmpeg",
      "ffprobe",
      "edge-tts",
      "playwright-chromium",
    ]);
    expect(report.ok).toBe(
      report.checks.every((check) => check.ok),
    );
  });

  it("includes a fix suggestion for every failing check", async () => {
    const report = await runDoctor();
    for (const check of report.checks) {
      if (!check.ok) {
        expect(check.fix).toBeTruthy();
      }
    }
  });
});

describe("formatDoctorReport", () => {
  it("renders OK/MISSING lines with fixes for failures", () => {
    const text = formatDoctorReport({
      ok: false,
      dependencies: {
        ffmpeg: true,
        ffprobe: true,
        edgeTts: false,
        ok: false,
        missing: ["edge-tts"],
      },
      checks: [
        { name: "node", ok: true, detail: "Node.js v20.0.0" },
        {
          name: "edge-tts",
          ok: false,
          detail: "edge-tts not found on PATH",
          fix: "Run `pip install edge-tts`.",
        },
      ],
    });
    expect(text).toContain("[OK] node: Node.js v20.0.0");
    expect(text).toContain(
      "[MISSING] edge-tts: edge-tts not found on PATH -> Run `pip install edge-tts`.",
    );
    expect(text).toContain("Some checks failed");
  });

  it("renders a success message when every check passes", () => {
    const text = formatDoctorReport({
      ok: true,
      dependencies: {
        ffmpeg: true,
        ffprobe: true,
        edgeTts: true,
        ok: true,
        missing: [],
      },
      checks: [{ name: "node", ok: true, detail: "Node.js v20.0.0" }],
    });
    expect(text).toContain("All checks passed.");
  });
});
