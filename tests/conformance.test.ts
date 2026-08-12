import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

const PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const MCP_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";

const ALLOWED_MANIFEST_FIELDS = new Set([
  "$schema",
  "name",
  "version",
  "description",
  "author",
  "homepage",
  "repository",
  "license",
  "keywords",
  "extensions",
]);

const PLUGIN_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-.]*[a-z0-9])?$/;

interface StdioServerConfig {
  type: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

interface McpConfig {
  $schema: string;
  mcpServers: Record<string, StdioServerConfig>;
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(root, relativePath), "utf8")) as T;
}

function schemaVersion(schemaUrl: string): string | undefined {
  return schemaUrl.match(/\/schemas\/([^/]+)\//)?.[1];
}

describe("Agent Plugin conformance (agent-plugins.org v1.0.0)", () => {
  describe("plugin.json manifest", () => {
    const plugin = readJson<Record<string, unknown>>("plugin.json");

    it("uses the canonical plugin schema identifier", () => {
      expect(plugin.$schema).toBe(PLUGIN_SCHEMA);
    });

    it("declares only closed top-level manifest fields", () => {
      for (const key of Object.keys(plugin)) {
        expect(ALLOWED_MANIFEST_FIELDS.has(key)).toBe(true);
      }
    });

    it("has required fields with correct types", () => {
      expect(typeof plugin.$schema).toBe("string");
      expect(typeof plugin.name).toBe("string");
    });

    it("has a name matching the plugin name constraints", () => {
      const name = plugin.name as string;
      expect(name.length).toBeGreaterThanOrEqual(1);
      expect(name.length).toBeLessThanOrEqual(64);
      expect(name).toMatch(PLUGIN_NAME_PATTERN);
      expect(name).not.toMatch(/--|\.\./);
    });

    it("does not embed secrets in manifest metadata", () => {
      const blob = JSON.stringify(plugin);
      expect(blob).not.toMatch(/api[_-]?key/i);
      expect(blob).not.toMatch(/secret/i);
      expect(blob).not.toMatch(/password/i);
    });
  });

  describe("mcp.json configuration", () => {
    const mcp = readJson<McpConfig>("mcp.json");
    const plugin = readJson<Record<string, unknown>>("plugin.json");

    it("uses the canonical MCP schema identifier", () => {
      expect(mcp.$schema).toBe(MCP_SCHEMA);
    });

    it("declares only $schema and mcpServers at the top level", () => {
      expect(Object.keys(mcp).sort()).toEqual(["$schema", "mcpServers"]);
    });

    it("targets the same Agent Plugins version as plugin.json", () => {
      expect(schemaVersion(mcp.$schema)).toBe(
        schemaVersion(plugin.$schema as string),
      );
    });

    it("every stdio server uses a single bare or plugin-relative command token", () => {
      for (const server of Object.values(mcp.mcpServers)) {
        expect(server.type).toBe("stdio");
        expect(server.command).not.toMatch(/\s/);
        expect(server.command.startsWith("./") || !server.command.includes("/")).toBe(
          true,
        );
        expect(server.command).not.toMatch(/\$\{PLUGIN_(ROOT|DATA)\}/);
      }
    });

    it("cwd only uses plugin-relative or placeholder-rooted forms", () => {
      for (const server of Object.values(mcp.mcpServers)) {
        if (server.cwd === undefined) continue;
        const validCwd =
          server.cwd.startsWith("./") ||
          server.cwd === "${PLUGIN_ROOT}" ||
          server.cwd.startsWith("${PLUGIN_ROOT}/") ||
          server.cwd === "${PLUGIN_DATA}" ||
          server.cwd.startsWith("${PLUGIN_DATA}/");
        expect(validCwd).toBe(true);
      }
    });

    it("args and env only use ${PLUGIN_ROOT} / ${PLUGIN_DATA} placeholders", () => {
      const placeholderFree = (value: string) =>
        value.replace(/\$\{PLUGIN_ROOT\}/g, "").replace(/\$\{PLUGIN_DATA\}/g, "");
      for (const server of Object.values(mcp.mcpServers)) {
        for (const arg of server.args ?? []) {
          expect(placeholderFree(arg)).not.toMatch(/\$\{[A-Z_]+\}/);
        }
        for (const value of Object.values(server.env ?? {})) {
          expect(placeholderFree(value)).not.toMatch(/\$\{[A-Z_]+\}/);
        }
      }
    });

    it("env does not reassign the reserved PLUGIN_ROOT/PLUGIN_DATA names", () => {
      for (const server of Object.values(mcp.mcpServers)) {
        const envKeys = Object.keys(server.env ?? {});
        expect(envKeys).not.toContain("PLUGIN_ROOT");
        expect(envKeys).not.toContain("PLUGIN_DATA");
      }
    });

    it("does not embed secrets in server configuration", () => {
      const blob = JSON.stringify(mcp);
      expect(blob).not.toMatch(/api[_-]?key/i);
      expect(blob).not.toMatch(/secret/i);
      expect(blob).not.toMatch(/password/i);
    });
  });

  describe("skills/ component discovery", () => {
    it("skill frontmatter is present with required fields", () => {
      const skill = readFileSync(
        join(root, "skills", "product-demo", "SKILL.md"),
        "utf8",
      );
      expect(skill.startsWith("---")).toBe(true);
      expect(skill).toContain("name: product-demo");
      expect(skill).toContain("description:");
    });
  });
});
