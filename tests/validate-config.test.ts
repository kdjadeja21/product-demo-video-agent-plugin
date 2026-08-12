import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateDemoConfig } from "../src/services/validate-config.js";

describe("validateDemoConfig hygiene nudges", () => {
  it("warns about minimal commits and gitignore", async () => {
    const dir = await mkdtemp(join(tmpdir(), "product-demo-val-"));
    const configPath = join(dir, "demo.config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        baseUrl: "http://localhost:3000",
        output: {
          video: "public/demo/a.mp4",
          captions: "public/demo/a.vtt",
          draftDir: "public/demo/draft",
        },
        sections: [{ id: "welcome", kind: "title", text: "Hello." }],
      }),
      "utf8",
    );
    const result = await validateDemoConfig({
      projectRoot: dir,
      configPath,
      checkBaseUrl: false,
    });
    expect(result.ok).toBe(true);
    expect(
      result.warnings.some((w) => w.includes("Commit only demo.config.json")),
    ).toBe(true);
    expect(
      result.warnings.some((w) => w.includes("ensure_demo_gitignore")),
    ).toBe(true);
  });

  it("warns when baseUrl uses 127.0.0.1", async () => {
    const dir = await mkdtemp(join(tmpdir(), "product-demo-val-"));
    const configPath = join(dir, "demo.config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        baseUrl: "http://127.0.0.1:3000",
        output: {
          video: "public/demo/a.mp4",
          captions: "public/demo/a.vtt",
          draftDir: "public/demo/draft",
        },
        sections: [{ id: "welcome", kind: "title", text: "Hello." }],
      }),
      "utf8",
    );
    const result = await validateDemoConfig({
      projectRoot: dir,
      configPath,
      checkBaseUrl: false,
    });
    expect(
      result.warnings.some((w) => w.includes("Prefer http://localhost")),
    ).toBe(true);
  });
});
