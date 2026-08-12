import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { checkDependencies, type DependencyReport } from "./deps.js";

const pluginRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

export interface DoctorReport {
  ok: boolean;
  checks: DoctorCheck[];
  dependencies: DependencyReport;
}

const MIN_NODE_MAJOR = 20;

function checkNodeVersion(): DoctorCheck {
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  const ok = major >= MIN_NODE_MAJOR;
  return {
    name: "node",
    ok,
    detail: `Node.js ${process.version}`,
    fix: ok ? undefined : `Install Node.js ${MIN_NODE_MAJOR}+ (current: ${process.version}).`,
  };
}

function checkBuiltJs(): DoctorCheck {
  const distEntry = join(pluginRoot, "dist", "mcp-server.js");
  const srcEntry = join(pluginRoot, "src", "mcp-server.ts");
  const built = existsSync(distEntry);
  const runnableFromSource = existsSync(srcEntry);
  const ok = built || runnableFromSource;
  return {
    name: "build",
    ok,
    detail: built
      ? "Compiled output found in dist/"
      : runnableFromSource
        ? "Running from source via tsx (no dist/ build yet)"
        : "No dist/ build and no src/ available",
    fix: ok ? undefined : "Run `npm install && npm run build` in the plugin root.",
  };
}

function checkPlaywrightChromium(): DoctorCheck {
  let executablePath: string | undefined;
  try {
    executablePath = chromium.executablePath();
  } catch {
    executablePath = undefined;
  }
  const ok = Boolean(executablePath && existsSync(executablePath));
  return {
    name: "playwright-chromium",
    ok,
    detail: ok
      ? `Chromium found at ${executablePath}`
      : "Playwright Chromium browser is not installed",
    fix: ok ? undefined : "Run `npx playwright install chromium`.",
  };
}

function dependencyChecks(dependencies: DependencyReport): DoctorCheck[] {
  return [
    {
      name: "ffmpeg",
      ok: dependencies.ffmpeg,
      detail: dependencies.ffmpeg ? "ffmpeg found on PATH" : "ffmpeg not found on PATH",
      fix: dependencies.ffmpeg
        ? undefined
        : "Install ffmpeg and ensure it is on PATH (e.g. `apt-get install ffmpeg`).",
    },
    {
      name: "ffprobe",
      ok: dependencies.ffprobe,
      detail: dependencies.ffprobe ? "ffprobe found on PATH" : "ffprobe not found on PATH",
      fix: dependencies.ffprobe
        ? undefined
        : "Install ffmpeg (bundles ffprobe) and ensure it is on PATH.",
    },
    {
      name: "edge-tts",
      ok: dependencies.edgeTts,
      detail: dependencies.edgeTts ? "edge-tts found on PATH" : "edge-tts not found on PATH",
      fix: dependencies.edgeTts ? undefined : "Run `pip install edge-tts`.",
    },
  ];
}

export async function runDoctor(): Promise<DoctorReport> {
  const dependencies = await checkDependencies();
  const checks: DoctorCheck[] = [
    checkNodeVersion(),
    checkBuiltJs(),
    ...dependencyChecks(dependencies),
    checkPlaywrightChromium(),
  ];
  return {
    ok: checks.every((check) => check.ok),
    checks,
    dependencies,
  };
}

export function formatDoctorReport(report: DoctorReport): string {
  const lines = report.checks.map((check) => {
    const status = check.ok ? "OK" : "MISSING";
    const suffix = check.ok || !check.fix ? "" : ` -> ${check.fix}`;
    return `[${status}] ${check.name}: ${check.detail}${suffix}`;
  });
  lines.push(report.ok ? "\nAll checks passed." : "\nSome checks failed; see fixes above.");
  return lines.join("\n");
}
