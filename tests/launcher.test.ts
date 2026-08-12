import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");
const EXECUTABLE_MASK = 0o111;

const launchers = ["bin/product-demo", "bin/product-demo-mcp"] as const;

describe("packaged launchers (Cursor Cloud / Linux compatibility)", () => {
  for (const relativePath of launchers) {
    describe(relativePath, () => {
      const fullPath = join(root, relativePath);

      it("is marked executable in the filesystem", () => {
        const mode = statSync(fullPath).mode;
        expect(mode & EXECUTABLE_MASK).not.toBe(0);
      });

      it("does not use CommonJS require() under an ESM package", () => {
        const source = readFileSync(fullPath, "utf8");
        expect(source).not.toMatch(/\brequire\(/);
        expect(source).toMatch(/\bimport\b/);
      });

      it("runs under `node` without an ESM/CommonJS error", () => {
        const result = spawnSync(process.execPath, [fullPath, "--help"], {
          cwd: root,
          encoding: "utf8",
          input: "",
          timeout: 5000,
        });
        expect(result.stderr).not.toMatch(/require is not defined/);
        expect(result.stderr).not.toMatch(/ReferenceError/);
      });

      it("runs when executed directly", () => {
        const result = spawnSync(fullPath, ["--help"], {
          cwd: root,
          encoding: "utf8",
          input: "",
          timeout: 5000,
        });
        expect(result.error).toBeUndefined();
        expect(result.stderr ?? "").not.toMatch(/Permission denied/);
      });
    });
  }
});
