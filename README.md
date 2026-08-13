# product-demo

Turns a project’s `demo.config.json` into a narrated 1080p product demo: browser capture, voiceover, captions, and focus highlights. The final video is linked directly in the PR and in the agent's response by default; an optional **Watch Demo** button for your landing page is available on request.

Works with any web UI you can open in a browser. Nothing in this plugin is tied to a specific product.

## Create a demo

Paste this in Cursor Cloud Agent in the project you want to demo. Replace `[...]` with the screens to cover:

> Install the product-demo plugin from https://github.com/kdjadeja21/product-demo-video-agent-plugin, start the app, create a demo.config.json for this project covering [login, dashboard, settings], probe, then build one demo video.

The agent installs the plugin, writes the config, captures the walkthrough, and builds the video.

## What you get

- Narrated MP4 (1080p)
- WebVTT captions
- Chapter seek buttons under the native video player
- A clickable link to the final video in the PR description and in the agent's chat response
- (Optional, on request) a **Watch Demo** button on `/`

## After a successful build, commit

- `demo.config.json`
- The final MP4, captions, and chapters files
- (Only if explicitly requested) the Watch Demo button/player on the landing page

Do **not** copy this plugin into your app repo. Do **not** change your UI or CSS just for capture. Prefer `http://localhost:…` for `baseUrl`.

Init adds gitignore rules for draft folders, plugin copies, and login session files.

## More docs

- [Local setup](docs/local-setup.md) — install, CLI, MCP tools, and config
- [Development](docs/development.md) — contributing to this plugin

## License

MIT
