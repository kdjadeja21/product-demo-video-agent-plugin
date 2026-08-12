# product-demo

Generic **Agent Plugin** that turns a project’s `demo.config.json` into a narrated 1080p product demo: browser capture, TTS audio, WebVTT captions, focus highlights, and verification.

Works with **any** web UI you can open in Playwright. No product-specific routes or branding are baked into the plugin.

## Cursor Cloud Agent quickstart

This plugin is built and tested primarily for reuse as an **Agent Plugin inside Cursor Cloud Agent** projects — no manual wrapper fixes or client-specific configuration needed.

1. **Add the plugin to your project.** Copy or reference this directory (containing `plugin.json`, `mcp.json`, and `skills/`) so Cursor Cloud Agent can discover it. The bundled `./bin/product-demo-mcp` launcher is already executable and ESM-compatible, and `mcp.json` starts it directly — no path or permission fixes required.

2. **Install once per environment.**

   ```bash
   npm install
   npm run build
   npx playwright install chromium
   ```

   (If you skip `npm run build`, the launcher automatically falls back to running from source via `tsx`.)

3. **Check readiness before doing anything else.**

   ```bash
   npx product-demo doctor
   ```

   This reports Node version, build output, `ffmpeg`/`ffprobe`/`edge-tts`, and Playwright Chromium in one pass, with the exact fix command for anything missing. The `doctor_product_demo` MCP tool exposes the same check to the agent, so it can self-diagnose before calling `probe_demo` or `build_demo_video`.

4. **Let the agent drive the rest of the workflow** through the MCP tools in the table below (`init_demo_config` → `validate_demo_config` → `probe_demo` → `build_demo_video` → `inspect_demo_output`), following [`skills/product-demo/SKILL.md`](skills/product-demo/SKILL.md).

## Requirements

- Node.js 20+
- [ffmpeg](https://ffmpeg.org/) + `ffprobe` on `PATH`
- [`edge-tts`](https://github.com/rany2/edge-tts) on `PATH` (`pip install edge-tts`)
- Playwright Chromium (`npx playwright install chromium`)

Run `npx product-demo doctor` (or call the `doctor_product_demo` MCP tool) at any time to check all of the above in one step.

## Install (local plugin)

```bash
npm install
npm run build
npx playwright install chromium
```

Point your Agent Plugins–compatible client (such as Cursor Cloud Agent) at this directory (`plugin.json` + `mcp.json` + `skills/`).

## Quickstart (any project)

1. Start your app (e.g. `http://127.0.0.1:3000`).
2. Initialize config:

```bash
npx product-demo init --project /path/to/your-app
```

3. Edit `demo.config.json`: set `baseUrl`, section routes, narration text, optional `focus` selectors / `auth.storageState`.
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

6. Optional player snippet:

```bash
npx product-demo snippet --format react
```

## MCP tools

| Tool | Purpose |
| --- | --- |
| `doctor_product_demo` | Check Node, ffmpeg, ffprobe, edge-tts, build output, Playwright Chromium |
| `init_demo_config` | Starter `demo.config.json` |
| `validate_demo_config` | Schema, paths, deps, base URL |
| `save_browser_session_instructions` | Playwright `storageState` guidance (no auth bypass) |
| `probe_demo` | Capture-only review frames |
| `build_demo_video` | Full pipeline |
| `inspect_demo_output` | ffprobe + sample frames |
| `generate_player_snippet` | HTML/React + WebVTT |

`mcp.json` launches `./bin/product-demo-mcp` with `${PLUGIN_DATA}` for cache/state.

## Config sketch

```json
{
  "baseUrl": "http://127.0.0.1:3000",
  "output": {
    "video": "public/demo/product-demo.mp4",
    "captions": "public/demo/product-demo.vtt",
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

See `skills/product-demo/references/config-reference.md` and examples under `skills/product-demo/examples/`.

## Design defaults

- Still PNG holds for static beats; short video only when interacting
- Focus = rounded border + light dim (no zoom/crop)
- Encode = scale + pad to 1920×1080
- Captions = external WebVTT (not burned-in)

## Development

```bash
npm test
npm run build
```

Integration probe tests skip when ffmpeg/ffprobe are unavailable.

## License

MIT
