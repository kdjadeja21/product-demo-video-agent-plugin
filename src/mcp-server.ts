#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runBuild, runProbe } from "./pipeline/build.js";
import { runDoctor } from "./pipeline/doctor.js";
import { inspectDemoOutput } from "./pipeline/verify.js";
import { ensureDemoGitignore } from "./services/ensure-demo-gitignore.js";
import { initDemoConfig } from "./services/init-config.js";
import { resolveChaptersForSnippet } from "./services/load-chapters.js";
import { generatePlayerSnippet } from "./services/player-snippet.js";
import { saveBrowserSessionInstructions } from "./services/session-instructions.js";
import {
  loadDemoConfigFile,
  validateDemoConfig,
} from "./services/validate-config.js";

function parseArgs(argv: string[]): { dataDir?: string } {
  const idx = argv.indexOf("--data");
  if (idx === -1) return {};
  return { dataDir: argv[idx + 1] };
}

const { dataDir } = parseArgs(process.argv.slice(2));
const pluginData =
  dataDir ?? process.env.PLUGIN_DATA ?? resolve(process.cwd(), ".product-demo-data");

await mkdir(pluginData, { recursive: true });

function textResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          typeof payload === "string"
            ? payload
            : JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: `${message}\n\nRun the "doctor_product_demo" tool (or \`product-demo doctor\`) to check missing dependencies and fixes.`,
      },
    ],
  };
}

const server = new McpServer({
  name: "product-demo",
  version: "0.1.0",
});

server.tool(
  "doctor_product_demo",
  "Check that Node, ffmpeg, ffprobe, edge-tts, the build output, and Playwright Chromium are ready before running probe/build.",
  {},
  async () => {
    const report = await runDoctor();
    return textResult(report);
  },
);

server.tool(
  "init_demo_config",
  "Create a starter demo.config.json in the target project and ensure product-demo .gitignore rules.",
  {
    projectRoot: z.string().describe("Absolute path to the consumer project"),
    relativePath: z
      .string()
      .optional()
      .describe("Config path relative to project root"),
    force: z.boolean().optional().describe("Overwrite existing config"),
  },
  async ({ projectRoot, relativePath, force }) => {
    const result = await initDemoConfig({
      projectRoot: resolve(projectRoot),
      relativePath,
      force,
    });
    return textResult(result);
  },
);

server.tool(
  "ensure_demo_gitignore",
  "Append idempotent product-demo ignore rules (draft dirs, plugin vendor path, storageState) to the consumer .gitignore.",
  {
    projectRoot: z.string().describe("Absolute path to the consumer project"),
  },
  async ({ projectRoot }) => {
    const result = await ensureDemoGitignore(resolve(projectRoot));
    return textResult(result);
  },
);

server.tool(
  "validate_demo_config",
  "Validate demo.config.json schema, paths, dependencies, and base URL.",
  {
    projectRoot: z.string(),
    configPath: z
      .string()
      .optional()
      .describe("Absolute path or relative to projectRoot"),
    checkBaseUrl: z.boolean().optional(),
  },
  async ({ projectRoot, configPath, checkBaseUrl }) => {
    const root = resolve(projectRoot);
    const resolvedConfig = resolve(root, configPath ?? "demo.config.json");
    const result = await validateDemoConfig({
      projectRoot: root,
      configPath: resolvedConfig,
      checkBaseUrl,
    });
    return textResult(result);
  },
);

server.tool(
  "save_browser_session_instructions",
  "Generate instructions for creating Playwright storageState.json without auth bypasses.",
  {
    projectRoot: z.string(),
    configPath: z.string().optional(),
  },
  async ({ projectRoot, configPath }) => {
    const root = resolve(projectRoot);
    const config = await loadDemoConfigFile(
      root,
      resolve(root, configPath ?? "demo.config.json"),
    );
    return textResult(saveBrowserSessionInstructions(config));
  },
);

server.tool(
  "probe_demo",
  "Run browser capture in probe-only mode and write sample PNGs for review.",
  {
    projectRoot: z.string(),
    configPath: z.string().optional(),
  },
  async ({ projectRoot, configPath }) => {
    try {
      const root = resolve(projectRoot);
      const config = await loadDemoConfigFile(
        root,
        resolve(root, configPath ?? "demo.config.json"),
      );
      const result = await runProbe(config);
      return textResult(result);
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.tool(
  "build_demo_video",
  "Run the full pipeline: TTS, VTT, capture, encode, mux, burn-in captions, and verify. Returns viewingInstructions for embedding the MP4 in the agent window and linking it for audio.",
  {
    projectRoot: z.string(),
    configPath: z.string().optional(),
  },
  async ({ projectRoot, configPath }) => {
    try {
      const root = resolve(projectRoot);
      const config = await loadDemoConfigFile(
        root,
        resolve(root, configPath ?? "demo.config.json"),
      );
      const result = await runBuild(config);
      return textResult(result);
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.tool(
  "inspect_demo_output",
  "Inspect generated MP4/VTT with ffprobe and extract sample frames.",
  {
    projectRoot: z.string(),
    configPath: z.string().optional(),
  },
  async ({ projectRoot, configPath }) => {
    const root = resolve(projectRoot);
    const config = await loadDemoConfigFile(
      root,
      resolve(root, configPath ?? "demo.config.json"),
    );
    const report = await inspectDemoOutput({
      videoPath: config.resolved.video,
      captionsPath: config.resolved.captions,
      draftDir: config.resolved.draftDir,
      expectedWidth: config.video.width,
      expectedHeight: config.video.height,
    });
    return textResult(report);
  },
);

server.tool(
  "generate_player_snippet",
  "Produce optional HTML or React Watch Demo snippets. Prefer the burned-in MP4 embed/link from build_demo_video unless the user asks for an in-app player.",
  {
    format: z.enum(["html", "react"]).optional(),
    videoSrc: z.string().optional(),
    captionsSrc: z.string().optional(),
    playPauseFlash: z.boolean().optional(),
    watchDemoButton: z
      .boolean()
      .optional()
      .describe("Include Watch Demo button + dialog (default true)"),
    projectRoot: z
      .string()
      .optional()
      .describe("Consumer project root — used to load built chapters JSON"),
    configPath: z.string().optional(),
    chapters: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          startSec: z.number(),
        }),
      )
      .optional()
      .describe("Chapter list; if omitted, loaded from the project chapters file when projectRoot is set"),
  },
  async ({
    format,
    videoSrc,
    captionsSrc,
    playPauseFlash,
    watchDemoButton,
    projectRoot,
    configPath,
    chapters,
  }) => {
    const resolvedChapters = await resolveChaptersForSnippet({
      chapters,
      projectRoot: projectRoot ? resolve(projectRoot) : undefined,
      configPath: projectRoot
        ? resolve(projectRoot, configPath ?? "demo.config.json")
        : undefined,
    });
    const snippet = generatePlayerSnippet({
      format: format ?? "html",
      videoSrc: videoSrc ?? "/demo/product-demo.mp4",
      captionsSrc: captionsSrc ?? "/demo/product-demo.vtt",
      playPauseFlash,
      watchDemoButton,
      chapters: resolvedChapters,
    });
    return textResult(snippet);
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
