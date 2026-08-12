import { isAbsolute, normalize, relative, resolve, sep } from "node:path";

export class PathSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathSafetyError";
  }
}

/**
 * Resolve a user-supplied path under projectRoot.
 * Rejects absolute paths and `..` escapes unless allowEscape is true (tests only).
 */
export function resolveSafePath(
  projectRoot: string,
  userPath: string,
  options: { allowEscape?: boolean } = {},
): string {
  if (!userPath || typeof userPath !== "string") {
    throw new PathSafetyError("Path must be a non-empty string");
  }
  const trimmed = userPath.trim();
  if (!trimmed) {
    throw new PathSafetyError("Path must be a non-empty string");
  }
  if (isAbsolute(trimmed) && !options.allowEscape) {
    throw new PathSafetyError(`Absolute paths are not allowed: ${trimmed}`);
  }
  const root = resolve(projectRoot);
  const resolved = resolve(root, trimmed);
  const rel = relative(root, resolved);
  if (
    !options.allowEscape &&
    (rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel))
  ) {
    throw new PathSafetyError(
      `Path escapes project root: ${trimmed} -> ${resolved}`,
    );
  }
  return resolved;
}

export function ensureUnderRoot(
  projectRoot: string,
  absolutePath: string,
  options: { allowEscape?: boolean } = {},
): string {
  const root = resolve(projectRoot);
  const normalized = normalize(resolve(absolutePath));
  const rel = relative(root, normalized);
  if (
    !options.allowEscape &&
    (rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel))
  ) {
    throw new PathSafetyError(`Path escapes project root: ${absolutePath}`);
  }
  return normalized;
}

export function toPosixRelative(from: string, to: string): string {
  return relative(from, to).split(sep).join("/");
}
