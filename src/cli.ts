#!/usr/bin/env node
import { resolve } from "node:path";
import { runBuild, runProbe } from "./pipeline/build.js";
import { formatDoctorReport, runDoctor } from "./pipeline/doctor.js";
import { inspectDemoOutput } from "./pipeline/verify.js";
import { initDemoConfig } from "./services/init-config.js";
import { generatePlayerSnippet } from "./services/player-snippet.js";
import { saveBrowserSessionInstructions } from "./services/session-instructions.js";
import {
  loadDemoConfigFile,
  validateDemoConfig,
} from "./services/validate-config.js";

function usage(): never {
  console.log(`product-demo <command> [options]

Commands:
  doctor [--json]
  init [--project <dir>] [--config <relpath>] [--force]
  validate [--project <dir>] [--config <relpath>]
  session-instructions [--project <dir>] [--config <relpath>]
  probe [--project <dir>] [--config <relpath>]
  build [--project <dir>] [--config <relpath>]
  inspect [--project <dir>] [--config <relpath>]
  snippet [--format html|react] [--video <src>] [--captions <src>]
`);
  process.exit(1);
}

function getFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command) usage();

  const projectRoot = resolve(getFlag(args, "--project") ?? process.cwd());
  const configRel = getFlag(args, "--config") ?? "demo.config.json";
  const configPath = resolve(projectRoot, configRel);

  switch (command) {
    case "doctor": {
      const report = await runDoctor();
      if (hasFlag(args, "--json")) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatDoctorReport(report));
      }
      if (!report.ok) process.exit(2);
      break;
    }
    case "init": {
      const result = await initDemoConfig({
        projectRoot,
        relativePath: configRel,
        force: hasFlag(args, "--force"),
      });
      console.log(
        result.created
          ? `Created ${result.configPath}`
          : `Already exists (use --force): ${result.configPath}`,
      );
      break;
    }
    case "validate": {
      const result = await validateDemoConfig({ projectRoot, configPath });
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exit(1);
      break;
    }
    case "session-instructions": {
      const config = await loadDemoConfigFile(projectRoot, configPath);
      console.log(saveBrowserSessionInstructions(config));
      break;
    }
    case "probe": {
      const config = await loadDemoConfigFile(projectRoot, configPath);
      const result = await runProbe(config);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "build": {
      const config = await loadDemoConfigFile(projectRoot, configPath);
      const result = await runBuild(config);
      console.log(JSON.stringify(result, null, 2));
      if (!result.inspect.ok) process.exit(2);
      break;
    }
    case "inspect": {
      const config = await loadDemoConfigFile(projectRoot, configPath);
      const report = await inspectDemoOutput({
        videoPath: config.resolved.video,
        captionsPath: config.resolved.captions,
        draftDir: config.resolved.draftDir,
        expectedWidth: config.video.width,
        expectedHeight: config.video.height,
      });
      console.log(JSON.stringify(report, null, 2));
      if (!report.ok) process.exit(2);
      break;
    }
    case "snippet": {
      const format =
        (getFlag(args, "--format") as "html" | "react" | undefined) ?? "html";
      const snippet = generatePlayerSnippet({
        format,
        videoSrc: getFlag(args, "--video") ?? "/demo/product-demo.mp4",
        captionsSrc:
          getFlag(args, "--captions") ?? "/demo/product-demo.vtt",
        playPauseFlash: !hasFlag(args, "--no-flash"),
      });
      console.log(snippet);
      break;
    }
    default:
      usage();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
