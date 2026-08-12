# Troubleshooting

## Run the doctor check first

Before debugging anything else, call `doctor_product_demo` (or run `product-demo doctor`). It reports Node version, build output, `ffmpeg`, `ffprobe`, `edge-tts`, and Playwright Chromium in one pass with the exact fix command for anything missing.

## baseUrl not reachable

Start the app locally and confirm the URL in `demo.config.json`. Validation warns when fetch fails.

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

Confirm the selector is unique and visible after waits. Prefer stable `data-demo-focus` attributes in the app when you control the markup.

## Title card fonts missing

Title PNGs use ffmpeg `drawtext`. On some systems a default font must be available; if title render fails, switch that section to a route still or install a basic font package.
