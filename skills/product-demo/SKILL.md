---
name: product-demo
description: Create or rebuild narrated product demo videos with browser capture, WebVTT captions, focus highlights, and chapter seek buttons via demo.config.json. Defaults to linking the final video in the PR and in the chat response; an optional landing-page Watch Demo button is available on request.
---

# Product Demo Video

Use this skill when the user asks to create, rebuild, or update a product demo video, walkthrough, subtitles/captions, focus highlights, chapter timestamps, or an embed/player snippet.

This plugin is **product-agnostic**. Adapt routes, narration, and focus selectors to the **current** project. Never assume a specific app’s branding or URLs.

## Hard rules (consumer hygiene)

- Do **not** vendor this plugin into the consumer git tree (no copies under `.cursor-plugins/product-demo/`, no committed clones/`node_modules`/`dist` of this plugin).
- Do **not** modify consumer UI, CSS, or Next/Vite config **for capture** (no `?demo=1`, no capture-only CSS classes, no `data-demo-focus` attributes, no `allowedDevOrigins` edits). Capture uses `reducedMotion`, optional `settleMs`, and existing selectors.
- **Default deliverable — link the video, don’t modify the app:** After a successful build, **do not** add a Watch Demo button/dialog to the product’s landing page by default. Instead, share the final video as a direct, clickable link: (1) in the PR description, and (2) in your own chat response/summary to the user — both referencing the same final MP4 file path so the reviewer/user can view or download it with one click. Do not touch consumer UI for this.
- **Opt-in — Watch Demo CTA:** Only if the user **explicitly asks** for an embedded player on the landing page, add a **Watch Demo** button on the product’s **default landing page** (route `/` / homepage) using `generate_player_snippet`. That player uses native `<video controls>` (play, seek, mute/volume, captions, fullscreen) plus chapter seek buttons under the video. Closing the dialog pauses and resets playback. Prefer React (`WatchDemoButton`) when the app is React/Next; otherwise paste the HTML fragment. Keep the change minimal and match existing page styles where practical.
- After a successful build, commit:
  1. `demo.config.json`
  2. Final MP4 (`output.video`)
  3. Final WebVTT (`output.captions`)
  4. Chapters JSON (`output.chapters`, or the default path beside captions)
  5. (Only if explicitly requested) the minimal Watch Demo landing-page integration (button/modal/player files touched for the CTA)
- Never commit draft dirs, encode/TTS intermediates, `storageState.json`, or plugin copies.
- Prefer `http://localhost:…` for `baseUrl` (especially in Cloud Agent environments), not `127.0.0.1`.
- On init, ensure gitignore rules via `ensure_demo_gitignore` / `product-demo gitignore` (also run automatically by `init_demo_config`).

## Workflow

0. **Clarify before you build**
   - Before creating or editing `demo.config.json`, ask the user this auth question (linking the final video in the PR and in your chat response is the **default** deliverable — do not ask whether to do that; only ask about a landing-page Watch Demo button if the user brings it up):
     - **Auth:** "Do any of the screens/routes you want covered require login? If so, I'll need you to sign in once so I can capture a Playwright `storageState.json` (via `save_browser_session_instructions`) — no auth bypass will be added."
   - If auth is needed, run `save_browser_session_instructions` before `probe_demo` and set `auth.storageState` in the config (see `references/config-reference.md`).
   - Plan to link the final video in the PR description and in your chat response in step 7. Only plan to call `generate_player_snippet` and wire a **Watch Demo** button onto the landing page if the user explicitly asks for it.

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
   - Build writes MP4, WebVTT captions, and a chapters JSON (section start times) for the player.

6. **Verify**
   - Call `inspect_demo_output` (or rely on build report).
   - Confirm 1920×1080 (or configured size), A/V present, VTT duration close to video.

7. **Link the video in the PR and in your response (default)**
   - Reference the final MP4 (`output.video`) as a clickable link both in the PR description and in your own chat summary/response to the user, so either place lets them view or download the video with one click.
   - Commit the final media + config (see hard rules). No app changes are needed for this step.

   **Optional — Watch Demo on the landing page (only if explicitly requested)**
   - Call `generate_player_snippet` with `projectRoot` so chapters load from the built chapters JSON (native `<video controls>` + WebVTT + **chapter seek buttons**, not burned-in captions and not a custom transport bar).
   - Detect the app stack: React/Next → `format: "react"` and mount `WatchDemoButton` on the homepage; otherwise use the HTML fragment.
   - Place the CTA on the **default landing page** (`/`) so users can open the demo and jump by chapter on the player.
   - Commit the CTA files together with config + final media (see hard rules).

## Quality defaults

- Static sections → high-res PNG holds; interactive sections → short video.
- Encode with scale + pad (never crop); interactive clips use temporal `tpad` so short webms match narration length.
- Captions: external WebVTT, sentence-weighted timing.
- Chapters: one seek button per section (label from section id) under the native Watch Demo player.
- Keep draft/archive folders out of commits; rely on the managed gitignore block.

See `references/quality-checklist.md` and `references/troubleshooting.md`.

## Safety

- No secrets in config, skill files, or MCP args.
- No auth bypass code in the consumer app for demos.
- Structured config parsing only; tools spawn ffmpeg/edge-tts with argv arrays (no shell string concatenation).
