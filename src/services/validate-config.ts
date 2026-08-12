import { access, readFile } from "node:fs/promises";
import { parseDemoConfig, type ResolvedDemoConfig } from "../config-schema.js";
import { checkDependencies } from "../pipeline/deps.js";

export interface ValidationResult {
  ok: boolean;
  config?: ResolvedDemoConfig;
  errors: string[];
  warnings: string[];
  dependencies: Awaited<ReturnType<typeof checkDependencies>>;
  baseUrlReachable?: boolean;
}

export async function loadDemoConfigFile(
  projectRoot: string,
  configPath: string,
): Promise<ResolvedDemoConfig> {
  const raw = JSON.parse(await readFile(configPath, "utf8")) as unknown;
  return parseDemoConfig(raw, projectRoot);
}

export async function validateDemoConfig(options: {
  projectRoot: string;
  configPath: string;
  checkBaseUrl?: boolean;
}): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const dependencies = await checkDependencies();
  if (!dependencies.ok) {
    warnings.push(`Missing tools: ${dependencies.missing.join(", ")}`);
  }

  let config: ResolvedDemoConfig | undefined;
  try {
    config = await loadDemoConfigFile(options.projectRoot, options.configPath);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
    return { ok: false, errors, warnings, dependencies };
  }

  for (const [label, path] of [
    ["video output dir parent", config.resolved.video],
    ["captions output", config.resolved.captions],
    ["chapters output", config.resolved.chapters],
    ["draft dir", config.resolved.draftDir],
  ] as const) {
    void label;
    void path;
  }

  if (config.resolved.storageState) {
    try {
      await access(config.resolved.storageState);
    } catch {
      warnings.push(
        `Auth storageState not found yet: ${config.auth?.storageState}. Create it before probing authenticated routes.`,
      );
    }
  }

  let baseUrlReachable: boolean | undefined;
  if (options.checkBaseUrl !== false) {
    try {
      const res = await fetch(config.baseUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      baseUrlReachable = res.ok || res.status < 500;
      if (!baseUrlReachable) {
        warnings.push(
          `baseUrl responded with HTTP ${res.status}: ${config.baseUrl}`,
        );
      }
    } catch {
      baseUrlReachable = false;
      warnings.push(
        `baseUrl not reachable (is the app running?): ${config.baseUrl}`,
      );
    }
  }

  const ids = new Set<string>();
  for (const section of config.sections) {
    if (ids.has(section.id)) {
      errors.push(`Duplicate section id: ${section.id}`);
    }
    ids.add(section.id);
  }

  warnings.push(
    "Commit only demo.config.json + final MP4 + final VTT. Do not commit draft dirs, storageState, or a vendored copy of this plugin.",
  );
  warnings.push(
    "Keep draft/plugin paths gitignored (run product-demo gitignore / ensure_demo_gitignore).",
  );
  if (config.baseUrl.includes("127.0.0.1")) {
    warnings.push(
      "Prefer http://localhost for baseUrl (especially in Cloud Agent environments) instead of 127.0.0.1.",
    );
  }

  return {
    ok: errors.length === 0,
    config,
    errors,
    warnings,
    dependencies,
    baseUrlReachable,
  };
}
