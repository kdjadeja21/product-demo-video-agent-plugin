import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadChaptersFile,
  resolveChaptersForSnippet,
} from "../src/services/load-chapters.js";

describe("loadChaptersFile", () => {
  it("loads { chapters: [...] } JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pd-chapters-"));
    const path = join(dir, "chapters.json");
    await writeFile(
      path,
      JSON.stringify({
        chapters: [{ id: "home", label: "Home", startSec: 1.5 }],
      }),
      "utf8",
    );
    await expect(loadChaptersFile(path)).resolves.toEqual([
      { id: "home", label: "Home", startSec: 1.5 },
    ]);
  });

  it("prefers explicit chapters over file lookup", async () => {
    const chapters = await resolveChaptersForSnippet({
      chapters: [{ id: "a", label: "A", startSec: 0 }],
      chaptersPath: "/missing.json",
    });
    expect(chapters).toEqual([{ id: "a", label: "A", startSec: 0 }]);
  });
});
