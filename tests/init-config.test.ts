import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEMO_GITIGNORE_MARKER } from "../src/services/ensure-demo-gitignore.js";
import { initDemoConfig } from "../src/services/init-config.js";

const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("initDemoConfig", () => {
  it("writes a template that uses localhost and ensures gitignore", async () => {
    const dir = await mkdtemp(join(tmpdir(), "product-demo-init-"));
    const result = await initDemoConfig({ projectRoot: dir });
    expect(result.created).toBe(true);
    const config = await readFile(result.configPath, "utf8");
    expect(config).toContain("http://localhost:3000");
    expect(config).not.toContain("127.0.0.1");
    expect(result.gitignore.alreadyPresent || result.gitignore.created).toBe(
      true,
    );
    const gi = await readFile(result.gitignore.path, "utf8");
    expect(gi).toContain(DEMO_GITIGNORE_MARKER);
  });

  it("still ensures gitignore when config already exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "product-demo-init-"));
    await initDemoConfig({ projectRoot: dir });
    const again = await initDemoConfig({ projectRoot: dir });
    expect(again.created).toBe(false);
    expect(again.gitignore.alreadyPresent).toBe(true);
  });

  it("ships an example template that uses localhost", async () => {
    const template = await readFile(
      join(pluginRoot, "src", "templates", "demo.config.example.json"),
      "utf8",
    );
    expect(template).toContain('"baseUrl": "http://localhost:3000"');
  });
});
