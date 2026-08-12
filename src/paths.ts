import { isAbsolute, normalize, relative, resolve, sep } from "node:path";

export class PathSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathSafetyError";
  }
}

const WINDOWS_ABSOLUTE_PATH = /^(?:[a-zA-Z]:[\\/]|[\\/]{2})/;

/**
 * Detects an absolute path on either POSIX or Windows conventions, regardless
 * of the host platform. `node:path`'s `isAbsolute` only recognizes the
 * current platform's convention, so a Windows-style path like `C:/foo` is
 * not flagged as absolute when running on Linux (and vice versa).
 */
function isAbsoluteAnyPlatform(value: string): boolean {
  return isAbsolute(value) || WINDOWS_ABSOLUTE_PATH.test(value);
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
  if (isAbsoluteAnyPlatform(trimmed) && !options.allowEscape) {
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
