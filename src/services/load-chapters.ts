import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { DemoChapter } from "../pipeline/captions.js";
import { loadDemoConfigFile } from "./validate-config.js";

function isDemoChapter(value: unknown): value is DemoChapter {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.label === "string" &&
    typeof record.startSec === "number" &&
    Number.isFinite(record.startSec)
  );
}

export async function loadChaptersFile(
  chaptersPath: string,
): Promise<DemoChapter[]> {
  const raw = JSON.parse(await readFile(chaptersPath, "utf8")) as unknown;
  if (Array.isArray(raw)) {
    return raw.filter(isDemoChapter);
  }
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as { chapters?: unknown }).chapters)
  ) {
    return ((raw as { chapters: unknown[] }).chapters).filter(isDemoChapter);
  }
  throw new Error(
    `Invalid chapters file ${chaptersPath}: expected { chapters: [...] }`,
  );
}

export async function resolveChaptersForSnippet(options: {
  chapters?: DemoChapter[];
  chaptersPath?: string;
  projectRoot?: string;
  configPath?: string;
}): Promise<DemoChapter[]> {
  if (options.chapters && options.chapters.length > 0) {
    return options.chapters;
  }
  if (options.chaptersPath) {
    try {
      await access(options.chaptersPath);
      return loadChaptersFile(options.chaptersPath);
    } catch {
      return [];
    }
  }
  if (options.projectRoot) {
    try {
      const config = await loadDemoConfigFile(
        options.projectRoot,
        options.configPath ?? join(options.projectRoot, "demo.config.json"),
      );
      await access(config.resolved.chapters);
      return loadChaptersFile(config.resolved.chapters);
    } catch {
      return [];
    }
  }
  return [];
}
