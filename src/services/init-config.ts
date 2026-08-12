import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSafePath } from "../paths.js";
import { ensureDemoGitignore } from "./ensure-demo-gitignore.js";

const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function initDemoConfig(options: {
  projectRoot: string;
  relativePath?: string;
  force?: boolean;
}): Promise<{
  configPath: string;
  created: boolean;
  gitignore: Awaited<ReturnType<typeof ensureDemoGitignore>>;
}> {
  const relativePath = options.relativePath ?? "demo.config.json";
  const configPath = resolveSafePath(options.projectRoot, relativePath);
  let exists = false;
  try {
    await access(configPath);
    exists = true;
  } catch {
    exists = false;
  }

  let created = false;
  if (!exists || options.force) {
    await mkdir(dirname(configPath), { recursive: true });
    const candidates = [
      join(pluginRoot, "src", "templates", "demo.config.example.json"),
      join(pluginRoot, "dist", "templates", "demo.config.example.json"),
    ];
    let wrote = false;
    for (const templatePath of candidates) {
      try {
        await copyFile(templatePath, configPath);
        wrote = true;
        break;
      } catch {
        // try next
      }
    }
    if (!wrote) {
      await writeFile(configPath, DEFAULT_CONFIG, "utf8");
    }
    created = true;
  }

  const gitignore = await ensureDemoGitignore(options.projectRoot);
  return { configPath, created, gitignore };
}

const DEFAULT_CONFIG = `{
  "baseUrl": "http://localhost:3000",
  "output": {
    "video": "public/demo/product-demo.mp4",
    "captions": "public/demo/product-demo.vtt",
    "draftDir": "public/demo/draft"
  },
  "video": {
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "fit": "pad",
    "background": "#1E1033"
  },
  "branding": {
    "title": "Product Demo",
    "subtitle": "A guided walkthrough"
  },
  "tts": {
    "provider": "edge-tts",
    "voice": "en-US-AvaNeural",
    "rate": "+0%"
  },
  "sections": [
    {
      "id": "welcome",
      "kind": "title",
      "text": "Welcome to the product demo."
    },
    {
      "id": "home",
      "route": "/",
      "waitForText": ["Welcome"],
      "text": "This is the home screen of your application."
    }
  ]
}
`;
