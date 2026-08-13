---
name: product-demo
description: Create or rebuild narrated product demo videos with browser capture, burned-in captions, WebVTT, focus highlights, and a clickable MP4 (agent-window embed + share link) via demo.config.json.
---

# Product Demo Video

Use this skill when the user asks to create, rebuild, or update a product demo video, walkthrough, subtitles/captions, focus highlights, chapter timestamps, or an embed/player snippet.

This plugin is **product-agnostic**. Adapt routes, narration, and focus selectors to the **current** project. Never assume a specific app’s branding or URLs.

## Hard rules (consumer hygiene)

- Do **not** vendor this plugin into the consumer git tree (no copies under `.cursor-plugins/product-demo/`, no committed clones/`node_modules`/`dist` of this plugin).
- Do **not** modify consumer UI, CSS, or Next/Vite config **for capture** (no `?demo=1`, no capture-only CSS classes, no `data-demo-focus` attributes, no `allowedDevOrigins` edits). Capture uses `reducedMotion`, optional `settleMs`, and existing selectors.
- **Do not add a Watch Demo button (or any landing-page player) unless the user explicitly asks.** The default viewing path is the built MP4 itself: captions are burned into the picture, audio is in the file. Embed it in the agent walkthrough and add a markdown link to the same file.
- After a successful build, commit:
  1. `demo.config.json`
  2. Final MP4 (`output.video`) — this is the file to watch (audio + burned-in captions)
  3. Final WebVTT (`output.captions`) — sidecar, still useful for optional players
  4. Chapters JSON (`output.chapters`, or the default path beside captions)
- Never commit draft dirs, encode/TTS intermediates, `storageState.json`, or plugin copies.
- Prefer `http://localhost:…` for `baseUrl` (especially in Cloud Agent environments), not `127.0.0.1`.
- On init, ensure gitignore rules via `ensure_demo_gitignore` / `product-demo gitignore` (also run automatically by `init_demo_config`).

## Workflow

0. **Clarify before you build**
   - Before creating or editing `demo.config.json`, ask the user this auth question:
     - **Auth:** "Do any of the screens/routes you want covered require login? If so, I'll need you to sign in once so I can capture a Playwright `storageState.json` (via `save_browser_session_instructions`) — no auth bypass will be added."
   - If auth is needed, run `save_browser_session_instructions` before `probe_demo` and set `auth.storageState` in the config (see `references/config-reference.md`).
   - Do **not** plan a landing-page Watch Demo unless the user asked for one.

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
   - Build writes MP4 (captions burned into the picture), sidecar WebVTT, and a chapters JSON.

6. **Verify**
   - Call `inspect_demo_output` (or rely on build report).
   - Confirm 1920×1080 (or configured size), A/V present, VTT duration close to video.
   - Confirm `captionsBurnedIn: true` on the build result. If it is false, say so — the agent-window preview will not show captions.

7. **Share the video (default — no in-app player)**
   - Follow `viewingInstructions` from `build_demo_video`.
   - **Agent window:** copy the final MP4 to the walkthrough artifacts and embed `<video src="…" controls></video>` so it is visible in the agent window. Burned-in captions show even if the preview is muted.
   - **Click for audio:** add a markdown link to the committed MP4 (and `playUrl` from the build result when the app is serving `public/` or `static/`). Opening that link uses a real browser/OS player — volume, narration audio, and burned-in captions. One click, no extra UI.
   - Only call `generate_player_snippet` if the user explicitly wants a Watch Demo control in the product.

## Quality defaults

- Static sections → high-res PNG holds; interactive sections → short video.
- Encode with scale + pad (never crop); interactive clips use temporal `tpad` so short webms match narration length.
- Captions: burned into the MP4 for agent-window / file-link viewing; sidecar WebVTT still written.
- Chapters: written beside captions for optional players (not required for the default share path).
- Keep draft/archive folders out of commits; rely on the managed gitignore block.

See `references/quality-checklist.md` and `references/troubleshooting.md`.

## Safety

- No secrets in config, skill files, or MCP args.
- No auth bypass code in the consumer app for demos.
- Structured config parsing only; tools spawn ffmpeg/edge-tts with argv arrays (no shell string concatenation).
