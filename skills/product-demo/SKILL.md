---
name: product-demo
description: Create or rebuild narrated product demo videos with browser capture, WebVTT captions, focus highlights, and optional HTML/React player snippets for any web app via demo.config.json.
---

# Product Demo Video

Use this skill when the user asks to create, rebuild, or update a product demo video, walkthrough, subtitles/captions, focus highlights, or an embed/player snippet.

This plugin is **product-agnostic**. Adapt routes, narration, and focus selectors to the **current** project. Never assume a specific app’s branding or URLs.

## Workflow

1. **Config**
   - Look for `demo.config.json` in the project root (or path the user specifies).
   - If missing, call `init_demo_config`, then edit sections for this product.
   - Read `references/config-reference.md` for the schema.

2. **Prerequisites**
   - Call `doctor_product_demo` first (or run `product-demo doctor`) to confirm Node, `ffmpeg`, `ffprobe`, `edge-tts`, the build output, and Playwright Chromium are all ready. Fix anything reported missing before continuing.
   - App reachable at `baseUrl`.
   - If pages need login: create Playwright `storageState.json` using normal app login — see `save_browser_session_instructions`. **Do not** add auth bypasses.

3. **Validate**
   - Call `validate_demo_config` and fix errors before capture.

4. **Probe first**
   - Call `probe_demo` and review PNGs under `output.draftDir/probe`.
   - Never ship a demo without checking key frames (first, focused, last).

5. **Build**
   - Call `build_demo_video` only after probes look correct.
   - Prefer **one focus target** per busy narration beat.
   - Use **border/dim** focus (default). Do not zoom or crop UI.

6. **Verify**
   - Call `inspect_demo_output` (or rely on build report).
   - Confirm 1920×1080 (or configured size), A/V present, VTT duration close to video.

7. **Optional player**
   - `generate_player_snippet` for native `<video>` + WebVTT (not burned-in captions).

## Quality defaults

- Static sections → high-res PNG holds; interactive sections → short video.
- Encode with scale + pad (never crop).
- Captions: external WebVTT, sentence-weighted timing.
- Keep draft/archive folders out of commits unless the user asks.

See `references/quality-checklist.md` and `references/troubleshooting.md`.

## Safety

- No secrets in config, skill files, or MCP args.
- No auth bypass code in the consumer app for demos.
- Structured config parsing only; tools spawn ffmpeg/edge-tts with argv arrays (no shell string concatenation).
