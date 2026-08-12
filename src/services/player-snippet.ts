import {
  formatChapterTimestamp,
  formatPlaybackClock,
  type DemoChapter,
} from "../pipeline/captions.js";

export type PlayerSnippetFormat = "html" | "react";

export interface PlayerSnippetOptions {
  format: PlayerSnippetFormat;
  videoSrc: string;
  captionsSrc: string;
  chapters?: DemoChapter[];
  /** Include a Watch Demo button that opens the player in a dialog. Default true. */
  watchDemoButton?: boolean;
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
  const flash = options.playPauseFlash !== false;
  const watchDemoButton = options.watchDemoButton !== false;
  const chapters = options.chapters ?? [];
  if (options.format === "react") {
    return reactSnippet(
      escapeJsStringLiteral(options.videoSrc),
      escapeJsStringLiteral(options.captionsSrc),
      chapters,
      watchDemoButton,
      flash,
    );
  }
  return htmlSnippet(
    escapeHtmlAttribute(options.videoSrc),
    escapeHtmlAttribute(options.captionsSrc),
    chapters,
    watchDemoButton,
    flash,
  );
}

function htmlChapterButtons(chapters: DemoChapter[]): string {
  if (chapters.length === 0) return "";
  const items = chapters
    .map((chapter) => {
      const start = Number(chapter.startSec.toFixed(3));
      const stamp = formatChapterTimestamp(chapter.startSec);
      const label = escapeHtmlText(chapter.label);
      return `        <li>
          <button type="button" class="pd-chapter" data-pd-start="${start}" data-pd-chapter="${escapeHtmlAttribute(chapter.id)}">
            <span class="pd-chapter-time">${stamp}</span>
            <span class="pd-chapter-label">${label}</span>
          </button>
        </li>`;
    })
    .join("\n");
  return `
      <nav class="pd-chapters" aria-label="Demo chapters">
        <ol class="pd-chapter-list">
${items}
        </ol>
      </nav>`;
}

function htmlPlayerMarkup(
  videoSrc: string,
  captionsSrc: string,
  chapters: DemoChapter[],
  flash: boolean,
): string {
  return `<div class="pd-player" data-pd-root>
      <div class="pd-video-wrap">
        <video class="pd-video" controls playsinline preload="metadata">
          <source src="${videoSrc}" type="video/mp4" />
          <track kind="captions" src="${captionsSrc}" srclang="en" label="English" default />
        </video>
        <div class="pd-time" data-pd-time>${formatPlaybackClock(0, 0)}</div>
        ${flash ? `<div class="pd-flash" data-pd-flash aria-hidden="true"></div>` : ""}
      </div>
      ${htmlChapterButtons(chapters)}
    </div>`;
}

function htmlSnippet(
  videoSrc: string,
  captionsSrc: string,
  chapters: DemoChapter[],
  watchDemoButton: boolean,
  flash: boolean,
): string {
  const playerInner = htmlPlayerMarkup(videoSrc, captionsSrc, chapters, flash);
  const openControl = watchDemoButton
    ? `<button type="button" class="pd-watch-demo" data-pd-open>Watch Demo</button>
<dialog class="pd-demo-dialog" data-pd-dialog>
  ${playerInner}
  <form method="dialog">
    <button type="submit" class="pd-close">Close</button>
  </form>
</dialog>`
    : playerInner;

  const dialogBoot = watchDemoButton
    ? `  const dialog = document.querySelector("[data-pd-dialog]");
  const root = dialog || document;
  const openBtn = document.querySelector("[data-pd-open]");
  openBtn?.addEventListener("click", () => { dialog?.showModal(); syncClock(); });
  dialog?.addEventListener("close", () => { video?.pause(); });`
    : `  const root = document.querySelector("[data-pd-root]") || document;`;

  return `<!-- product-demo: paste onto the default landing page (route "/") -->
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
  .pd-player { position: relative; width: 100%; }
  .pd-video-wrap { position: relative; background: #111; }
  .pd-player video {
    width: 100%; display: block; background: #111; color-scheme: dark;
  }
  .pd-time {
    position: absolute;
    left: 3.25rem;
    bottom: 0.85rem;
    z-index: 2;
    pointer-events: none;
    color: #fff;
    font: 500 0.8125rem/1 system-ui, sans-serif;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 1px 4px rgba(0,0,0,0.85);
  }
  .pd-player video::-webkit-media-controls-current-time-display,
  .pd-player video::-webkit-media-controls-time-remaining-display {
    display: none;
  }
  .pd-flash {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    pointer-events: none; opacity: 0; transition: opacity 160ms ease;
    font: 600 1.25rem/1 system-ui, sans-serif; color: #fff;
    text-shadow: 0 1px 8px rgba(0,0,0,.6);
  }
  .pd-flash.is-on { opacity: 1; }
  .pd-chapters { margin-top: 0.75rem; }
  .pd-chapter-list {
    list-style: none; margin: 0; padding: 0;
    display: grid; gap: 0.35rem;
  }
  .pd-chapter {
    width: 100%; display: flex; gap: 0.75rem; align-items: baseline;
    text-align: left; font: 500 0.95rem/1.35 system-ui, sans-serif;
    padding: 0.45rem 0.55rem; border: 1px solid #ddd; border-radius: 0.35rem;
    background: #fff; color: #111; cursor: pointer;
  }
  .pd-chapter[aria-current="true"] {
    border-color: #1e1033; background: #f4f0fa;
  }
  .pd-chapter-time {
    font-variant-numeric: tabular-nums; color: #555; min-width: 3rem;
  }
</style>
${openControl}
<script>
(() => {
${dialogBoot}
  const video = root.querySelector(".pd-video");
  const flashEl = root.querySelector("[data-pd-flash]");
  const timeEl = root.querySelector("[data-pd-time]");
  const chapterButtons = [...root.querySelectorAll("[data-pd-start]")];
  let timer;
  function pulse(label) {
    if (!flashEl) return;
    flashEl.textContent = label;
    flashEl.classList.add("is-on");
    clearTimeout(timer);
    timer = setTimeout(() => flashEl.classList.remove("is-on"), 350);
  }
  function formatClock(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const clamped = Math.floor(seconds);
    const hours = Math.floor(clamped / 3600);
    const minutes = Math.floor((clamped % 3600) / 60);
    const secs = clamped % 60;
    const pad = (n) => String(n).padStart(2, "0");
    if (hours > 0) return hours + ":" + pad(minutes) + ":" + pad(secs);
    return minutes + ":" + pad(secs);
  }
  function syncClock() {
    if (!video || !timeEl) return;
    timeEl.textContent = formatClock(video.currentTime) + " / " + formatClock(video.duration);
  }
  function seekTo(start) {
    if (!video) return;
    video.currentTime = start;
    video.play?.();
    syncClock();
  }
  function syncActiveChapter() {
    if (!video || chapterButtons.length === 0) return;
    const t = video.currentTime;
    let active = chapterButtons[0];
    for (const btn of chapterButtons) {
      const start = Number(btn.getAttribute("data-pd-start") || 0);
      if (start <= t + 0.05) active = btn;
    }
    for (const btn of chapterButtons) {
      btn.setAttribute("aria-current", btn === active ? "true" : "false");
    }
  }
  video?.addEventListener("play", () => pulse("Play"));
  video?.addEventListener("pause", () => pulse("Pause"));
  video?.addEventListener("timeupdate", () => { syncClock(); syncActiveChapter(); });
  video?.addEventListener("loadedmetadata", syncClock);
  video?.addEventListener("durationchange", syncClock);
  video?.addEventListener("seeked", syncClock);
  for (const btn of chapterButtons) {
    btn.addEventListener("click", () => {
      seekTo(Number(btn.getAttribute("data-pd-start") || 0));
      syncActiveChapter();
    });
  }
  syncClock();
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
  flash: boolean,
): string {
  const chaptersLit = reactChaptersLiteral(chapters);
  const flashBlock = flash
    ? `{flashLabel ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              color: "#fff",
              fontWeight: 600,
              textShadow: "0 1px 8px rgba(0,0,0,.6)",
            }}
          >
            {flashLabel}
          </div>
        ) : null}`
    : "null";

  const playerComponent = `export function ProductDemoPlayer({
  chapters = PRODUCT_DEMO_CHAPTERS,
}: {
  chapters?: DemoChapter[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [flashLabel, setFlashLabel] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(chapters[0]?.id ?? null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function pulse(label: string) {
    ${flash ? `setFlashLabel(label);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashLabel(null), 350);` : ""}
  }

  function seekTo(startSec: number, id: string) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = startSec;
    void video.play();
    setActiveId(id);
    setCurrentTime(startSec);
  }

  function syncClock(video: HTMLVideoElement) {
    setCurrentTime(video.currentTime);
    if (Number.isFinite(video.duration)) setDuration(video.duration);
  }

  function onTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    syncClock(video);
    if (chapters.length === 0) return;
    let current = chapters[0]!;
    for (const chapter of chapters) {
      if (chapter.startSec <= video.currentTime + 0.05) current = chapter;
    }
    setActiveId(current.id);
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative", background: "#111" }}>
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", display: "block", background: "#111", colorScheme: "dark" }}
          onPlay={() => pulse("Play")}
          onPause={() => pulse("Pause")}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onTimeUpdate}
          onDurationChange={onTimeUpdate}
        >
          <source src="${videoSrc}" type="video/mp4" />
          <track kind="captions" src="${captionsSrc}" srcLang="en" label="English" default />
        </video>
        <div
          data-pd-time
          style={{
            position: "absolute",
            left: "3.25rem",
            bottom: "0.85rem",
            zIndex: 2,
            pointerEvents: "none",
            color: "#fff",
            font: "500 0.8125rem/1 system-ui, sans-serif",
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 1px 4px rgba(0,0,0,0.85)",
          }}
        >
          {formatPlaybackClock(currentTime, duration)}
        </div>
        ${flashBlock}
      </div>
      {chapters.length > 0 ? (
        <nav aria-label="Demo chapters" style={{ marginTop: "0.75rem" }}>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.35rem" }}>
            {chapters.map((chapter) => {
              const stamp = formatChapterTimestamp(chapter.startSec);
              const active = chapter.id === activeId;
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => seekTo(chapter.startSec, chapter.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "baseline",
                      textAlign: "left",
                      font: "500 0.95rem/1.35 system-ui, sans-serif",
                      padding: "0.45rem 0.55rem",
                      border: active ? "1px solid #1e1033" : "1px solid #ddd",
                      borderRadius: "0.35rem",
                      background: active ? "#f4f0fa" : "#fff",
                      color: "#111",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontVariantNumeric: "tabular-nums", color: "#555", minWidth: "3rem" }}>
                      {stamp}
                    </span>
                    <span>{chapter.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}`;

  const watchComponent = watchDemoButton
    ? `
export function WatchDemoButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  return `import { useRef, useState } from "react";

export type DemoChapter = { id: string; label: string; startSec: number };

export const PRODUCT_DEMO_CHAPTERS: DemoChapter[] = ${chaptersLit};

function formatChapterTimestamp(seconds: number): string {
  const clamped = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) return \`\${hours}:\${pad(minutes)}:\${pad(secs)}\`;
  return \`\${minutes}:\${pad(secs)}\`;
}

function formatPlaybackClock(currentSec: number, durationSec: number): string {
  return \`\${formatChapterTimestamp(currentSec)} / \${formatChapterTimestamp(durationSec)}\`;
}

${playerComponent}
${watchComponent}`;
}
