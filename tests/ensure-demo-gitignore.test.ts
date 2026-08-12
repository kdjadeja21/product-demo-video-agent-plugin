import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEMO_GITIGNORE_MARKER,
  ensureDemoGitignore,
} from "../src/services/ensure-demo-gitignore.js";

describe("ensureDemoGitignore", () => {
  it("creates .gitignore with the managed block", async () => {
    const dir = await mkdtemp(join(tmpdir(), "product-demo-gi-"));
    const result = await ensureDemoGitignore(dir);
    expect(result.created).toBe(true);
    expect(result.updated).toBe(false);
    expect(result.alreadyPresent).toBe(false);
    const body = await readFile(result.path, "utf8");
    expect(body).toContain(DEMO_GITIGNORE_MARKER);
    expect(body).toContain("**/demo/draft/");
    expect(body).toContain(".cursor-plugins/product-demo/");
    expect(body).toContain("storageState.json");
  });

  it("is idempotent when the managed block already exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "product-demo-gi-"));
    const first = await ensureDemoGitignore(dir);
    const before = await readFile(first.path, "utf8");
    const second = await ensureDemoGitignore(dir);
    expect(second.alreadyPresent).toBe(true);
    expect(second.created).toBe(false);
    expect(second.updated).toBe(false);
    const after = await readFile(second.path, "utf8");
    expect(after).toBe(before);
  });

  it("appends the managed block to an existing .gitignore", async () => {
    const dir = await mkdtemp(join(tmpdir(), "product-demo-gi-"));
    const path = join(dir, ".gitignore");
    await writeFile(path, "node_modules/\n", "utf8");
    const result = await ensureDemoGitignore(dir);
    expect(result.created).toBe(false);
    expect(result.updated).toBe(true);
    const body = await readFile(path, "utf8");
    expect(body).toContain("node_modules/");
    expect(body).toContain(DEMO_GITIGNORE_MARKER);
  });
});
