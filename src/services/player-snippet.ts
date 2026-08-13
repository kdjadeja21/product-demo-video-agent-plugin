import { type DemoChapter } from "../pipeline/captions.js";

export type PlayerSnippetFormat = "html" | "react";

export interface PlayerSnippetOptions {
  format: PlayerSnippetFormat;
  videoSrc: string;
  captionsSrc: string;
  chapters?: DemoChapter[];
  /** Include a Watch Demo button that opens the player in a dialog. Default true. */
  watchDemoButton?: boolean;
  /** Accepted for CLI/MCP compatibility; native controls do not use a play/pause flash. */
  playPauseFlash?: boolean;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeJsStringLiteral(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

export function generatePlayerSnippet(options: PlayerSnippetOptions): string {
  const watchDemoButton = options.watchDemoButton !== false;
  const chapters = options.chapters ?? [];
  if (options.format === "react") {
    return reactSnippet(
      escapeJsStringLiteral(options.videoSrc),
      escapeJsStringLiteral(options.captionsSrc),
      chapters,
      watchDemoButton,
    );
  }
  return htmlSnippet(
    escapeHtmlAttribute(options.videoSrc),
    escapeHtmlAttribute(options.captionsSrc),
    chapters,
    watchDemoButton,
  );
}

function htmlChapterButtons(chapters: DemoChapter[]): string {
  if (chapters.length === 0) return "";
  const items = chapters
    .map((chapter) => {
      const start = Number(chapter.startSec.toFixed(3));
      const label = escapeHtmlText(chapter.label);
      return `        <button type="button" class="pd-chapter" data-pd-start="${start}" data-pd-chapter="${escapeHtmlAttribute(chapter.id)}">${label}</button>`;
    })
    .join("\n");
  return `      <div class="pd-chapters" data-pd-chapters aria-label="Demo chapters">
${items}
      </div>`;
}

function htmlPlayerMarkup(
  videoSrc: string,
  captionsSrc: string,
  chapters: DemoChapter[],
): string {
  const chapterRow = htmlChapterButtons(chapters);
  return `<div class="pd-player" data-pd-root>
      <video class="pd-video" controls playsinline preload="metadata">
        <source src="${videoSrc}" type="video/mp4" />
        <track kind="captions" src="${captionsSrc}" srclang="en" label="English" />
      </video>
${chapterRow}
    </div>`;
}

function htmlSnippet(
  videoSrc: string,
  captionsSrc: string,
  chapters: DemoChapter[],
  watchDemoButton: boolean,
): string {
  const playerInner = htmlPlayerMarkup(videoSrc, captionsSrc, chapters);
  const openControl = watchDemoButton
    ? `<button type="button" class="pd-watch-demo" data-pd-open>Watch Demo</button>
<dialog class="pd-demo-dialog" data-pd-dialog>
  ${playerInner}
  <form method="dialog">
    <button type="submit" class="pd-close">Close</button>
  </form>
</dialog>`
    : playerInner;

  const rootBoot = watchDemoButton
    ? `  const dialog = document.querySelector("[data-pd-dialog]");
  const root = dialog || document;
  const openBtn = document.querySelector("[data-pd-open]");`
    : `  const root = document.querySelector("[data-pd-root]") || document;`;

  return `<!-- product-demo: optional in-app player; default share path is the burned-in MP4 embed/link -->
<style>
  ${
    watchDemoButton
      ? `.pd-watch-demo {
    font: 600 1rem/1.2 system-ui, sans-serif;
    padding: 0.65rem 1.1rem;
    border: 0;
    border-radius: 0.4rem;
    background: #1e1033;
    color: #fff;
    cursor: pointer;
  }
  .pd-demo-dialog {
    border: 0;
    padding: 1rem;
    width: min(960px, 96vw);
    max-width: 96vw;
    border-radius: 0.5rem;
  }
  .pd-demo-dialog::backdrop { background: rgba(0, 0, 0, 0.55); }
  .pd-close {
    margin-top: 0.75rem; font: 500 0.95rem/1.2 system-ui, sans-serif;
    padding: 0.45rem 0.8rem; border: 1px solid #ccc; border-radius: 0.35rem;
    background: #f7f7f7; cursor: pointer;
  }`
      : ""
  }
  .pd-player { width: 100%; }
  .pd-player video {
    width: 100%; display: block; background: #111;
  }
  .pd-chapters {
    display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.65rem;
  }
  .pd-chapter {
    font: 500 0.8rem/1.2 system-ui, sans-serif;
    padding: 0.35rem 0.6rem; border: 1px solid #ccc; border-radius: 0.35rem;
    background: #f7f7f7; cursor: pointer;
  }
</style>
${openControl}
<script>
(() => {
${rootBoot}
  const video = root.querySelector(".pd-video");
  function stopPlayback() {
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }
  ${
    watchDemoButton
      ? `openBtn?.addEventListener("click", () => { dialog?.showModal(); });
  dialog?.addEventListener("close", stopPlayback);`
      : ""
  }
  root.querySelectorAll("[data-pd-start]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!video) return;
      video.currentTime = Number(btn.getAttribute("data-pd-start") || 0);
      video.play?.();
    });
  });
})();
</script>
`;
}

function reactChaptersLiteral(chapters: DemoChapter[]): string {
  if (chapters.length === 0) return "[]";
  const rows = chapters.map((chapter) => {
    const start = Number(chapter.startSec.toFixed(3));
    return `  { id: "${escapeJsStringLiteral(chapter.id)}", label: "${escapeJsStringLiteral(chapter.label)}", startSec: ${start} }`;
  });
  return `[\n${rows.join(",\n")}\n]`;
}

function reactSnippet(
  videoSrc: string,
  captionsSrc: string,
  chapters: DemoChapter[],
  watchDemoButton: boolean,
): string {
  const chaptersLit = reactChaptersLiteral(chapters);

  const playerComponent = `export function ProductDemoPlayer({
  chapters = PRODUCT_DEMO_CHAPTERS,
}: {
  chapters?: DemoChapter[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function seekTo(startSec: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = startSec;
    void video.play();
  }

  return (
    <div data-pd-root style={{ width: "100%" }}>
      <video
        ref={videoRef}
        className="pd-video"
        controls
        playsInline
        preload="metadata"
        style={{ width: "100%", display: "block", background: "#111" }}
      >
        <source src="${videoSrc}" type="video/mp4" />
        <track kind="captions" src="${captionsSrc}" srcLang="en" label="English" />
      </video>
      {chapters.length > 0 ? (
        <div
          aria-label="Demo chapters"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.65rem" }}
        >
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              data-pd-start={chapter.startSec}
              onClick={() => seekTo(chapter.startSec)}
              style={{
                font: "500 0.8rem/1.2 system-ui, sans-serif",
                padding: "0.35rem 0.6rem",
                border: "1px solid #ccc",
                borderRadius: "0.35rem",
                background: "#f7f7f7",
                cursor: "pointer",
              }}
            >
              {chapter.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}`;

  const watchComponent = watchDemoButton
    ? `
export function WatchDemoButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function stopPlayback() {
    const video = dialogRef.current?.querySelector("video");
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        style={{
          font: "600 1rem/1.2 system-ui, sans-serif",
          padding: "0.65rem 1.1rem",
          border: 0,
          borderRadius: "0.4rem",
          background: "#1e1033",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Watch Demo
      </button>
      <dialog
        ref={dialogRef}
        onClose={stopPlayback}
        style={{
          border: 0,
          padding: "1rem",
          width: "min(960px, 96vw)",
          maxWidth: "96vw",
          borderRadius: "0.5rem",
        }}
      >
        <ProductDemoPlayer />
        <form method="dialog">
          <button
            type="submit"
            style={{
              marginTop: "0.75rem",
              font: "500 0.95rem/1.2 system-ui, sans-serif",
              padding: "0.45rem 0.8rem",
              border: "1px solid #ccc",
              borderRadius: "0.35rem",
              background: "#f7f7f7",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </form>
      </dialog>
    </>
  );
}
`
    : "";

  return `import { useRef } from "react";

export type DemoChapter = { id: string; label: string; startSec: number };

export const PRODUCT_DEMO_CHAPTERS: DemoChapter[] = ${chaptersLit};

${playerComponent}
${watchComponent}`;
}
