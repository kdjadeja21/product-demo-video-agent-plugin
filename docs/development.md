# Development

Notes for people changing this plugin, not for generating a demo in an app.

## Scripts

```bash
npm install
npm test
npm run build
npm run dev    # CLI via tsx
npm run mcp    # MCP server via tsx
```

Integration probe tests skip when ffmpeg/ffprobe are unavailable.

## Repo map

| Path | Role |
| --- | --- |
| [`src/cli.ts`](../src/cli.ts) | `product-demo` CLI commands |
| [`src/mcp-server.ts`](../src/mcp-server.ts) | MCP tools (`doctor_product_demo`, `probe_demo`, …) |
| [`src/pipeline/`](../src/pipeline/) | Capture, TTS, encode, captions, doctor, verify |
| [`src/services/`](../src/services/) | Config init/validate, gitignore, player snippet |
| [`src/config-schema.ts`](../src/config-schema.ts) | `demo.config.json` schema |
| [`plugin.json`](../plugin.json) / [`mcp.json`](../mcp.json) | Agent plugin + MCP launcher |
| [`skills/product-demo/`](../skills/product-demo/) | Agent skill, config reference, examples |

`npm run build` compiles TypeScript to `dist/` and copies player templates.

## Consumer rules

Hygiene for apps that *use* the plugin (do not vendor it, do not change UI for capture, commit config + final media + Watch Demo CTA) lives in [`skills/product-demo/SKILL.md`](../skills/product-demo/SKILL.md). Keep that in sync with the commit list in [`README.md`](../README.md).

User-facing docs: [`README.md`](../README.md). Install and CLI: [`local-setup.md`](local-setup.md).
