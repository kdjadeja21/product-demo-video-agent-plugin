# Troubleshooting

## Run the doctor check first

Before debugging anything else, call `doctor_product_demo` (or run `product-demo doctor`). It reports Node version, build output, `ffmpeg`, `ffprobe`, `edge-tts`, and Playwright Chromium in one pass with the exact fix command for anything missing.

## baseUrl not reachable

Start the app locally and confirm the URL in `demo.config.json`. Prefer `http://localhost:PORT` (not `127.0.0.1`) — especially in Cloud Agent environments. Validation warns when fetch fails. Do **not** edit Next `allowedDevOrigins` or other app config for demos.

## Animated UI / flaky screenshots

Capture already sets Playwright `reducedMotion: "reduce"`. If the UI still settles slowly, set section `settleMs` (milliseconds) so the pipeline waits after selectors/text before focus or screenshot. Do **not** add `?demo=1` query flags or capture-only CSS classes in the consumer app.

## edge-tts missing

Install: `pip install edge-tts`. Ensure the `edge-tts` executable is on `PATH`.

## ffmpeg / ffprobe missing

Install ffmpeg for your OS and ensure both `ffmpeg` and `ffprobe` are on `PATH`.

## Playwright browser missing

From the plugin directory: `npx playwright install chromium`.

## Auth pages redirect to login

Create `storageState` with a normal login (see `save_browser_session_instructions`). Do not add bypass routes.

## Blurry UI text

Prefer `capture: "still"` for static screens. Encoding uses CRF 18 and scale+pad — avoid low source DPR and avoid cropping.

## Captions out of sync

Rebuild after changing section text. Cue timing is weighted by sentence length within each section’s audio duration.

## Focus highlight missing

Confirm the selector is unique and visible after waits. Prefer existing CSS / Playwright selectors already in the app. Use `waitForSelector` / `waitForText` and optional `settleMs` — do **not** add `data-demo-focus` attributes or other app markup for demos.

## Short interactive clip cuts off before narration ends

Interactive encode uses ffmpeg `tpad` (freeze last frame) plus `-t` so the segment matches narration duration. Rebuild after upgrading the plugin if clips still end early.

## Drafts or plugin copies showing up in git

Run `product-demo gitignore --project <dir>` (or `ensure_demo_gitignore`). Init also applies the managed block. Commit only `demo.config.json` + final mp4 + vtt.

## Title card fonts missing

Title PNGs use ffmpeg `drawtext`. On some systems a default font must be available; if title render fails, switch that section to a route still or install a basic font package.
