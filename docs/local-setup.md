# Local setup

Install and run this plugin on your machine, or point Cursor at this directory.

## Requirements

- Node.js 20+
- [ffmpeg](https://ffmpeg.org/) + `ffprobe` on `PATH`
- [`edge-tts`](https://github.com/rany2/edge-tts) on `PATH` (`pip install edge-tts`)
- Playwright Chromium (`npx playwright install chromium`)

Check everything in one pass:

```bash
npx product-demo doctor
```

The `doctor_product_demo` MCP tool runs the same check.

## Install

```bash
npm install
npm run build
npx playwright install chromium
```

If you skip `npm run build`, the launcher falls back to running from source via `tsx`.

Point your Agent Plugins client (such as Cursor Cloud Agent) at this directory (`plugin.json` + `mcp.json` + `skills/`). Keep it outside the consumer commit set — do not vendor a copy into the app repo.

`mcp.json` launches `./bin/product-demo-mcp` with `${PLUGIN_DATA}` for cache/state. The launcher is already executable and ESM-compatible.

## CLI workflow

1. Start your app (for example `http://localhost:3000`).
2. Initialize config (also ensures `.gitignore` rules):

```bash
npx product-demo init --project /path/to/your-app
```

3. Edit `demo.config.json`: set `baseUrl`, section routes, narration text, and optional `focus` / `settleMs` / `auth.storageState`. Use existing CSS selectors — do not edit the app for demos.
4. Validate and probe:

```bash
npx product-demo validate --project /path/to/your-app
npx product-demo probe --project /path/to/your-app
```

5. Review PNGs under `output.draftDir/probe`, then build:

```bash
npx product-demo build --project /path/to/your-app
npx product-demo inspect --project /path/to/your-app
```

6. By default, link the final video (`output.video`) directly in the PR description and in the agent's chat response — no app changes needed. Only if you explicitly want an embedded player on the landing page, generate the Watch Demo snippet and add it to the app:

```bash
npx product-demo snippet --format react --project /path/to/your-app
```

The snippet includes a **Watch Demo** button/dialog, native `<video controls>` (including mute), and chapter seek buttons. Closing the dialog pauses and resets the video.

## MCP tools

Typical agent order: `init_demo_config` → `validate_demo_config` → `probe_demo` → `build_demo_video` → `inspect_demo_output`. See [`skills/product-demo/SKILL.md`](../skills/product-demo/SKILL.md).

| Tool | Purpose |
| --- | --- |
| `doctor_product_demo` | Check Node, ffmpeg, ffprobe, edge-tts, build output, Playwright Chromium |
| `init_demo_config` | Starter `demo.config.json` + gitignore rules |
| `ensure_demo_gitignore` | Idempotent product-demo `.gitignore` block |
| `validate_demo_config` | Schema, paths, deps, base URL |
| `save_browser_session_instructions` | Playwright `storageState` guidance (no auth bypass) |
| `probe_demo` | Capture-only review frames |
| `build_demo_video` | Full pipeline |
| `inspect_demo_output` | ffprobe + sample frames |
| `generate_player_snippet` | HTML/React Watch Demo + native video controls + WebVTT + chapter buttons |

## Config sketch

```json
{
  "baseUrl": "http://localhost:3000",
  "output": {
    "video": "public/demo/product-demo.mp4",
    "captions": "public/demo/product-demo.vtt",
    "chapters": "public/demo/product-demo.chapters.json",
    "draftDir": "public/demo/draft"
  },
  "sections": [
    { "id": "welcome", "kind": "title", "text": "Welcome to the product demo." },
    {
      "id": "home",
      "route": "/",
      "waitForText": ["Welcome"],
      "text": "This is the home screen."
    }
  ]
}
```

Full schema: [`skills/product-demo/references/config-reference.md`](../skills/product-demo/references/config-reference.md). Examples: [`skills/product-demo/examples/`](../skills/product-demo/examples/).

## Design defaults

- Still PNG holds for static beats; short video only when interacting
- Focus = rounded border + light dim (no zoom/crop); prefer existing selectors
- Encode = scale + pad to 1920×1080; interactive clips use temporal `tpad`
- Captions = external WebVTT (not burned-in)
- Chapters = seek buttons under the native video player
- Default CTA = final video linked in the PR description and in the chat response; landing-page Watch Demo button is opt-in
- Playwright `reducedMotion: "reduce"` during capture
