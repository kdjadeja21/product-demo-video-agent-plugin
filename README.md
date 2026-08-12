# product-demo

Generic **Agent Plugin** that turns a project’s `demo.config.json` into a narrated 1080p product demo: browser capture, TTS audio, WebVTT captions, focus highlights, and verification.

Works with **any** web UI you can open in Playwright. No product-specific routes or branding are baked into the plugin.

## Requirements

- Node.js 20+
- [ffmpeg](https://ffmpeg.org/) + `ffprobe` on `PATH`
- [`edge-tts`](https://github.com/rany2/edge-tts) on `PATH` (`pip install edge-tts`)
- Playwright Chromium (`npx playwright install chromium`)

## Install (local plugin)

```bash
npm install
npm run build
npx playwright install chromium
```

Point your Agent Plugins–compatible client at this directory (`plugin.json` + `mcp.json` + `skills/`).

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
