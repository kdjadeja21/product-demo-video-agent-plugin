const PUBLIC_PREFIXES = ["public/", "static/"] as const;

/**
 * If the output file is under `public/` or `static/`, guess the URL the running
 * app will serve (Next/Vite `public/`, older `static/`).
 */
export function guessServedMediaUrl(
  baseUrl: string,
  outputRelativePath: string,
): string | undefined {
  const posix = outputRelativePath
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
  const prefix = PUBLIC_PREFIXES.find((p) => posix.startsWith(p));
  if (!prefix) return undefined;
  let servedPath = posix.slice(prefix.length - 1); // keep leading slash
  if (!servedPath.startsWith("/")) servedPath = `/${servedPath}`;
  try {
    const origin = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return new URL(servedPath, origin).href;
  } catch {
    return undefined;
  }
}

export function buildViewingInstructions(options: {
  videoPath: string;
  playUrl?: string;
  captionsBurnedIn: boolean;
}): string {
  const captions = options.captionsBurnedIn
    ? "Captions are burned into the picture, so they show in the agent window and in any player."
    : "Captions are in the sidecar VTT only and will not show in the agent-window preview.";
  const lines = [
    "How to watch (do not add a Watch Demo landing-page button unless the user asks):",
    `1. Embed the MP4 in the agent walkthrough so it appears in the agent window: <video src="${options.videoPath}" controls></video> ${captions}`,
    "2. Agent-window previews often start muted. Add a markdown link to the same MP4. Clicking that link opens a real browser or OS player with volume, audio, and the burned-in captions — no extra player UI to build.",
  ];
  if (options.playUrl) {
    lines.push(
      `3. While the app is running, this URL serves the file: ${options.playUrl}`,
    );
  }
  return lines.join("\n");
}
