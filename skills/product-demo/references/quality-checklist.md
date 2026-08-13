# Quality checklist

- [ ] Walkthrough matches the current product (routes, copy, selectors).
- [ ] App is running; authenticated pages have a valid `storageState`.
- [ ] Probe frames reviewed: no blank screens, skeletons, or wrong routes.
- [ ] At most one focus highlight per busy beat; border/dim only (no zoom).
- [ ] Focus uses existing CSS/Playwright selectors (no app markup edits for demos).
- [ ] Narration is clear; voice/rate appropriate.
- [ ] Final MP4 is configured resolution (default 1920×1080) via pad, not crop.
- [ ] Captions are burned into the MP4 (`captionsBurnedIn: true`); sidecar WebVTT still exists and tracks audio length.
- [ ] Inspect sample frames (first / mid / last) look sharp enough for UI text; burned-in captions are readable.
- [ ] Commits include `demo.config.json` + final MP4 + final VTT + chapters JSON.
- [ ] Walkthrough embeds the MP4 and includes a markdown link to the same file (and `playUrl` when present). No landing-page Watch Demo unless the user asked.
- [ ] Draft/plugin paths covered by managed gitignore; plugin not vendored into the app.
- [ ] No secrets or demo auth bypasses introduced.
