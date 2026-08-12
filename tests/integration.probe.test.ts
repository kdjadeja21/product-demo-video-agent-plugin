import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseDemoConfig } from "../src/config-schema.js";
import { commandExists } from "../src/pipeline/process.js";
import { runProbe } from "../src/pipeline/build.js";

const root = join(import.meta.dirname, "..");
const artifactRoot = join(root, "tests", "artifacts", "probe-run");

const hasFfmpeg = await commandExists("ffmpeg");
const hasFfprobe = await commandExists("ffprobe");

describe.runIf(hasFfmpeg && hasFfprobe)("integration probe", () => {
  let port = 0;
  let server: ReturnType<typeof createServer>;

  beforeAll(async () => {
    const html = await readFile(
      join(root, "tests", "fixtures", "app", "index.html"),
      "utf8",
    );
    server = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    port = addr.port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("captures probe PNGs from fixture app", async () => {
    const config = parseDemoConfig(
      {
        baseUrl: `http://127.0.0.1:${port}`,
        output: {
          video: "out/demo.mp4",
          captions: "out/demo.vtt",
          draftDir: "draft",
        },
        branding: { title: "Fixture", subtitle: "Probe" },
        sections: [
          {
            id: "welcome",
            kind: "title",
            text: "Welcome to the fixture demo.",
          },
          {
            id: "home",
            route: "/",
            waitForText: ["Welcome"],
            text: "Home screen of the fixture app.",
          },
        ],
      },
      artifactRoot,
      { allowEscape: true },
    );

    const result = await runProbe(config);
    expect(result.artifacts.length).toBeGreaterThanOrEqual(2);
    expect(result.artifacts.some((a) => a.kind === "png")).toBe(true);
  }, 120_000);
});
