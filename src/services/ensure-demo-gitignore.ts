import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const DEMO_GITIGNORE_MARKER = "# product-demo (managed)";

export const DEMO_GITIGNORE_BLOCK = `${DEMO_GITIGNORE_MARKER}
**/demo/draft/
public/demo/draft/
.cursor-plugins/product-demo/
storageState.json
`;

export interface EnsureDemoGitignoreResult {
  path: string;
  created: boolean;
  updated: boolean;
  alreadyPresent: boolean;
}

export async function ensureDemoGitignore(
  projectRoot: string,
): Promise<EnsureDemoGitignoreResult> {
  const path = join(projectRoot, ".gitignore");
  let existing = "";
  let fileExists = false;
  try {
    await access(path);
    fileExists = true;
    existing = await readFile(path, "utf8");
  } catch {
    fileExists = false;
  }

  if (existing.includes(DEMO_GITIGNORE_MARKER)) {
    return {
      path,
      created: false,
      updated: false,
      alreadyPresent: true,
    };
  }

  const next =
    existing.length === 0
      ? DEMO_GITIGNORE_BLOCK
      : `${existing.replace(/\s*$/, "")}\n\n${DEMO_GITIGNORE_BLOCK}`;
  await writeFile(path, next.endsWith("\n") ? next : `${next}\n`, "utf8");
  return {
    path,
    created: !fileExists,
    updated: fileExists,
    alreadyPresent: false,
  };
}
