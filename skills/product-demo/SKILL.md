---
name: product-demo
description: Create or rebuild narrated product demo videos with browser capture, WebVTT captions, focus highlights, and optional HTML/React player snippets for any web app via demo.config.json.
---

# Product Demo Video

Use this skill when the user asks to create, rebuild, or update a product demo video, walkthrough, subtitles/captions, focus highlights, or an embed/player snippet.

This plugin is **product-agnostic**. Adapt routes, narration, and focus selectors to the **current** project. Never assume a specific app’s branding or URLs.

## Hard rules (consumer hygiene)

- Do **not** vendor this plugin into the consumer git tree (no copies under `.cursor-plugins/product-demo/`, no committed clones/`node_modules`/`dist` of this plugin).
- Do **not** modify consumer UI, CSS, or Next/Vite config for demos. Capture uses `reducedMotion`, optional `settleMs`, and existing selectors — no `?demo=1`, no capture-only CSS classes, no `data-demo-focus` attributes, no `allowedDevOrigins` edits.
- After a successful build, commit **only**:
  1. `demo.config.json`
  2. Final MP4 (`output.video`)
  3. Final WebVTT (`output.captions`)
- Never commit draft dirs, encode/TTS intermediates, `storageState.json`, or plugin copies.
- Prefer `http://localhost:…` for `baseUrl` (especially in Cloud Agent environments), not `127.0.0.1`.
- On init, ensure gitignore rules via `ensure_demo_gitignore` / `product-demo gitignore` (also run automatically by `init_demo_config`).

## Workflow

0. **Clarify before you build**
   - Before creating or editing `demo.config.json`, ask the user these two questions together, in one pass:
     - **Watch Demo integration:** "Once the demo video is built, would you like a **Watch Demo** button/link added to the product (e.g. homepage, README, or docs) that opens the video inline or in a modal, using the `generate_player_snippet` tool? If yes, where should it live, and HTML or React?"
     - **Auth:** "Do any of the screens/routes you want covered require login? If so, I'll need you to sign in once so I can capture a Playwright `storageState.json` (via `save_browser_session_instructions`) — no auth bypass will be added."
   - Use the answers to inform the rest of the workflow:
     - If the user wants a Watch Demo button, plan to call `generate_player_snippet` in step 7 (below) rather than leaving it as an afterthought.
     - If auth is needed, run `save_browser_session_instructions` before `probe_demo` and set `auth.storageState` in the config (see `references/config-reference.md`).

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
   - Focus selectors should target existing CSS / Playwright selectors already in the app.

6. **Verify**
   - Call `inspect_demo_output` (or rely on build report).
   - Confirm 1920×1080 (or configured size), A/V present, VTT duration close to video.

7. **Optional player**
   - If the user asked for a Watch Demo button in step 0, call `generate_player_snippet` now (native `<video>` + WebVTT, not burned-in captions) using their preferred format (HTML or React) and placement.

## Quality defaults

- Static sections → high-res PNG holds; interactive sections → short video.
- Encode with scale + pad (never crop); interactive clips use temporal `tpad` so short webms match narration length.
- Captions: external WebVTT, sentence-weighted timing.
- Keep draft/archive folders out of commits; rely on the managed gitignore block.

See `references/quality-checklist.md` and `references/troubleshooting.md`.

## Safety

- No secrets in config, skill files, or MCP args.
- No auth bypass code in the consumer app for demos.
- Structured config parsing only; tools spawn ffmpeg/edge-tts with argv arrays (no shell string concatenation).
