import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

describe("Agent Plugin conformance", () => {
  it("plugin.json matches schema identity", () => {
    const plugin = JSON.parse(
      readFileSync(join(root, "plugin.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(plugin.$schema).toBe(
      "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    );
    expect(plugin.name).toBe("product-demo");
    expect(plugin.license).toBe("MIT");
  });

  it("mcp.json is stdio with plugin-relative command", () => {
    const mcp = JSON.parse(
      readFileSync(join(root, "mcp.json"), "utf8"),
    ) as {
      $schema: string;
      mcpServers: Record<
        string,
        { type: string; command: string; cwd?: string; args?: string[] }
      >;
    };
    expect(mcp.$schema).toBe(
      "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
    );
    const server = mcp.mcpServers["product-demo"];
    expect(server?.type).toBe("stdio");
    expect(server?.command).toBe("./bin/product-demo-mcp");
    expect(server?.cwd).toBe("${PLUGIN_ROOT}");
    expect(server?.args).toEqual(["--data", "${PLUGIN_DATA}"]);
    const blob = JSON.stringify(mcp);
    expect(blob).not.toMatch(/api[_-]?key/i);
    expect(blob).not.toMatch(/secret/i);
  });

  it("skill frontmatter is present", () => {
    const skill = readFileSync(
      join(root, "skills", "product-demo", "SKILL.md"),
      "utf8",
    );
    expect(skill.startsWith("---")).toBe(true);
    expect(skill).toContain("name: product-demo");
    expect(skill).toContain("description:");
  });
});
