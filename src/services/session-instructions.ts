import type { ResolvedDemoConfig } from "../config-schema.js";

export function saveBrowserSessionInstructions(
  config: ResolvedDemoConfig,
): string {
  const storage =
    config.auth?.storageState ?? "scripts/demo/storageState.json";
  const baseUrl = config.baseUrl;

  return `# Save a Playwright browser session (no auth bypass)

Use your app's normal login. Do not add demo-only auth shortcuts or secret credentials to the demo config.

## Goal

Create \`${storage}\` so the product-demo plugin can open authenticated pages during capture.

## Steps

1. Ensure the app is running at \`${baseUrl}\`.
2. From the project root, run a one-off Playwright script (or codegen) that:
   - Opens Chromium headed
   - Navigates to your login page
   - Lets you sign in manually (or uses env-provided test credentials at runtime — never commit them)
   - Calls \`context.storageState({ path: '${storage}' })\`
3. Confirm \`${storage}\` exists and is gitignored if it contains session cookies.
4. Set \`auth.storageState\` in \`demo.config.json\` to \`${storage}\`.
5. Run \`validate_demo_config\` / \`probe_demo\` again.

## Minimal script sketch

\`\`\`ts
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto("${baseUrl}");
// Complete login in the browser window, then press Enter in the terminal.
await new Promise((r) => process.stdin.once("data", r));
await context.storageState({ path: "${storage}" });
await browser.close();
\`\`\`

## Safety

- Do not store passwords or API keys in \`demo.config.json\`.
- Do not commit \`${storage}\` unless it is a disposable sandbox session and your security policy allows it.
- Prefer environment variables for any automation credentials.
`;
}
