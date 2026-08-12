import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";
import {
  sectionCaptureMode,
  sectionKind,
  type DemoSection,
  type ResolvedDemoConfig,
} from "../config-schema.js";
import { renderTitleCardPng } from "./encode.js";
import {
  buildLiveFocusCss,
  DEFAULT_FOCUS_STYLE,
} from "./focus-overlay.js";

export interface CaptureArtifact {
  sectionId: string;
  kind: "png" | "webm";
  path: string;
  focusApplied: boolean;
}

export interface ProbeResult {
  artifacts: CaptureArtifact[];
  draftDir: string;
}

async function waitForSection(page: Page, section: DemoSection): Promise<void> {
  if (section.waitForSelector) {
    for (const selector of section.waitForSelector) {
      await page.waitForSelector(selector, {
        state: "visible",
        timeout: 30_000,
      });
    }
  }
  if (section.waitForText) {
    for (const text of section.waitForText) {
      await page.getByText(text, { exact: false }).first().waitFor({
        state: "visible",
        timeout: 30_000,
      });
    }
  }
  if (section.failOnSelector) {
    for (const selector of section.failOnSelector) {
      const hit = await page
        .locator(selector)
        .first()
        .isVisible()
        .catch(() => false);
      if (hit) {
        throw new Error(
          `Section "${section.id}" failed: forbidden selector visible: ${selector}`,
        );
      }
    }
  }
}

async function applyFocus(page: Page, section: DemoSection): Promise<boolean> {
  if (!section.focus?.selector) return false;
  const style = {
    ...DEFAULT_FOCUS_STYLE,
    padding: section.focus.padding ?? DEFAULT_FOCUS_STYLE.padding,
  };
  const css = buildLiveFocusCss(section.focus.selector, style);
  await page.addStyleTag({ content: css });
  await page.evaluate(`document.documentElement.classList.add("product-demo-focus-active")`);
  await page.waitForSelector(section.focus.selector, {
    state: "visible",
    timeout: 15_000,
  });
  return true;
}

async function runInteraction(page: Page, section: DemoSection): Promise<void> {
  const interaction = section.interaction;
  if (!interaction) return;
  switch (interaction.type) {
    case "click":
      await page.click(interaction.selector);
      break;
    case "type":
      await page.fill(interaction.selector, interaction.text);
      break;
    case "press":
      await page.keyboard.press(interaction.key);
      break;
    default: {
      const _exhaustive: never = interaction;
      throw new Error(`Unhandled interaction type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

async function captureTitleCard(
  section: DemoSection,
  config: ResolvedDemoConfig,
  outDir: string,
): Promise<CaptureArtifact> {
  const path = join(outDir, `${section.id}.png`);
  await renderTitleCardPng({
    outputPath: path,
    title: config.branding?.title ?? "Product Demo",
    subtitle: config.branding?.subtitle ?? section.text,
    width: config.video.width,
    height: config.video.height,
    background: config.video.background,
  });
  return {
    sectionId: section.id,
    kind: "png",
    path,
    focusApplied: false,
  };
}

async function captureRouteSection(
  context: BrowserContext,
  section: DemoSection,
  config: ResolvedDemoConfig,
  outDir: string,
): Promise<CaptureArtifact> {
  const mode = sectionCaptureMode(section);
  const page = await context.newPage();
  try {
    const url = new URL(section.route!, config.baseUrl).toString();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await waitForSection(page, section);
    const focusApplied = await applyFocus(page, section);

    if (mode === "video") {
      await runInteraction(page, section);
      await page.waitForTimeout(1000);
      const video = page.video();
      const webmPath = join(outDir, `${section.id}.webm`);
      await page.close();
      if (video) {
        const rawPath = await video.path();
        await copyFile(rawPath, webmPath);
        return {
          sectionId: section.id,
          kind: "webm",
          path: webmPath,
          focusApplied,
        };
      }
      // Should not happen when recordVideo is enabled; keep a clear error.
      throw new Error(
        `Section "${section.id}" requested video capture but Playwright video was unavailable`,
      );
    }

    const path = join(outDir, `${section.id}.png`);
    await page.screenshot({ path, fullPage: false });
    return { sectionId: section.id, kind: "png", path, focusApplied };
  } finally {
    if (!page.isClosed()) await page.close();
  }
}

async function withBrowserContext<T>(
  config: ResolvedDemoConfig,
  videoDir: string,
  fn: (context: BrowserContext) => Promise<T>,
): Promise<T> {
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: {
        width: config.video.width,
        height: config.video.height,
      },
      deviceScaleFactor: 1,
      storageState: config.resolved.storageState,
      recordVideo: {
        dir: videoDir,
        size: {
          width: config.video.width,
          height: config.video.height,
        },
      },
    });
    try {
      return await fn(context);
    } finally {
      await context.close();
    }
  } finally {
    await browser?.close();
  }
}

export async function probeDemo(
  config: ResolvedDemoConfig,
): Promise<ProbeResult> {
  const draftDir = config.resolved.draftDir;
  const captureDir = join(draftDir, "probe");
  await mkdir(captureDir, { recursive: true });
  await mkdir(join(captureDir, "raw-video"), { recursive: true });

  const artifacts: CaptureArtifact[] = [];
  const needsBrowser = config.sections.some((s) => sectionKind(s) !== "title");

  if (!needsBrowser) {
    for (const section of config.sections) {
      artifacts.push(await captureTitleCard(section, config, captureDir));
    }
  } else {
    await withBrowserContext(
      config,
      join(captureDir, "raw-video"),
      async (context) => {
        for (const section of config.sections) {
          if (sectionKind(section) === "title") {
            artifacts.push(
              await captureTitleCard(section, config, captureDir),
            );
          } else {
            artifacts.push(
              await captureRouteSection(context, section, config, captureDir),
            );
          }
        }
      },
    );
  }

  await writeFile(
    join(captureDir, "manifest.json"),
    JSON.stringify({ artifacts }, null, 2),
    "utf8",
  );
  return { artifacts, draftDir };
}

export async function captureForBuild(
  config: ResolvedDemoConfig,
): Promise<CaptureArtifact[]> {
  const result = await probeDemo(config);
  const captureDir = join(config.resolved.draftDir, "capture");
  await mkdir(captureDir, { recursive: true });
  const moved: CaptureArtifact[] = [];
  for (const artifact of result.artifacts) {
    const dest = join(
      captureDir,
      `${artifact.sectionId}.${artifact.kind === "png" ? "png" : "webm"}`,
    );
    await copyFile(artifact.path, dest);
    moved.push({ ...artifact, path: dest });
  }
  return moved;
}
