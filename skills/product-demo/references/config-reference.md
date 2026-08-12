# demo.config.json reference

## Top-level fields

| Field | Required | Description |
| --- | --- | --- |
| `baseUrl` | yes | Origin of the running app (prefer `http://localhost:3000`) |
| `output.video` | yes | Relative path for final MP4 |
| `output.captions` | yes | Relative path for WebVTT |
| `output.chapters` | no | Relative path for chapter timestamp JSON (defaults beside captions as `*.chapters.json`) |
| `output.draftDir` | yes | Working directory for probes, audio, segments |
| `video` | no | Defaults to 1920×1080, 30fps, `fit: "pad"`, background `#1E1033` |
| `branding` | no | Title card title/subtitle/optional logoPath |
| `auth.storageState` | no | Relative path to Playwright storage state |
| `tts` | no | Defaults to `edge-tts` / `en-US-AvaNeural` / `+0%` |
| `sections` | yes | Ordered walkthrough beats |

Paths are resolved under the project root. Absolute paths and `..` escapes are rejected.

## Section fields

| Field | Description |
| --- | --- |
| `id` | Unique alphanumeric / `_` / `-` |
| `kind` | `title` (branding card) or `route` (default) |
| `route` | Required for `route` sections; joined with `baseUrl` |
| `text` | Narration (also drives captions) |
| `waitForText` | Array of visible text strings to wait for |
| `waitForSelector` | Array of selectors that must be visible |
| `failOnSelector` | Fail if any of these (e.g. skeletons) are visible |
| `settleMs` | Optional ms to wait after waits, before focus/screenshot (no app code required) |
| `interaction` | `{ type: "click"|"type"|"press", ... }` |
| `focus` | `{ selector, padding? }` — one target; border/dim; use existing CSS selectors |
| `capture` | `still` or `video`; default `video` only when `interaction` is set |

## Examples

See `../examples/generic-webapp-demo.config.json` and `../examples/nextjs-demo.config.json`.
