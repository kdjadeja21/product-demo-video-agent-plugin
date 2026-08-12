import {
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

function htmlChapterSegments(chapters: DemoChapter[]): string {
  if (chapters.length === 0) {
    return `        <div class="pd-progress" data-pd-progress>
          <span class="pd-progress-fill" data-pd-progress-fill></span>
        </div>`;
  }
  const items = chapters
    .map((chapter) => {
      const start = Number(chapter.startSec.toFixed(3));
      const label = escapeHtmlText(chapter.label);
      return `          <button type="button" class="pd-segment" data-pd-start="${start}" data-pd-chapter="${escapeHtmlAttribute(chapter.id)}" aria-label="${escapeHtmlAttribute(chapter.label)}">
            <span class="pd-segment-label">${label}</span>
            <span class="pd-segment-track"><span class="pd-segment-fill"></span></span>
          </button>`;
    })
    .join("\n");
  return `        <div class="pd-segments" data-pd-segments aria-label="Demo chapters">
${items}
        </div>`;
}

function htmlPlayerMarkup(
  videoSrc: string,
  captionsSrc: string,
  chapters: DemoChapter[],
  flash: boolean,
): string {
  return `<div class="pd-player" data-pd-root>
      <div class="pd-video-wrap">
        <video class="pd-video" playsinline preload="metadata">
          <source src="${videoSrc}" type="video/mp4" />
          <track kind="captions" src="${captionsSrc}" srclang="en" label="English" default />
        </video>
        ${flash ? `<div class="pd-flash" data-pd-flash aria-hidden="true"></div>` : ""}
        <div class="pd-chrome">
${htmlChapterSegments(chapters)}
          <div class="pd-transport">
            <button type="button" class="pd-toggle" data-pd-toggle aria-label="Play" data-pd-paused="true">
              <svg data-pd-icon-play viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
              <svg data-pd-icon-pause viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" hidden><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
            </button>
            <div class="pd-time" data-pd-time>${formatPlaybackClock(0, 0)}</div>
          </div>
        </div>
      </div>
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
  openBtn?.addEventListener("click", () => { dialog?.showModal(); syncClock(); syncTimeline(); });
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
  .pd-chrome {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
    padding: 0.4rem 0.75rem 0.55rem;
    background: linear-gradient(transparent, rgba(0,0,0,0.78));
    color: #fff;
  }
  .pd-segments { display: flex; gap: 0.4rem; align-items: flex-end; }
  .pd-segment {
    flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.22rem;
    padding: 0; border: 0; background: transparent; color: inherit;
    cursor: pointer; text-align: left;
  }
  .pd-segment-label {
    font: 500 0.7rem/1.2 system-ui, sans-serif;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    opacity: 0.8;
  }
  .pd-segment[aria-current="true"] .pd-segment-label { opacity: 1; }
  .pd-segment-track, .pd-progress {
    display: block; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.28); overflow: hidden;
  }
  .pd-progress { cursor: pointer; }
  .pd-segment-fill, .pd-progress-fill {
    display: block; height: 100%; width: 0%; background: #fff;
  }
  .pd-transport {
    display: flex; align-items: center; gap: 0.65rem; margin-top: 0.45rem;
  }
  .pd-toggle {
    display: grid; place-items: center;
    width: 1.5rem; height: 1.5rem; padding: 0; border: 0;
    background: transparent; color: #fff; cursor: pointer;
  }
  .pd-time {
    font: 500 0.8125rem/1 system-ui, sans-serif;
    font-variant-numeric: tabular-nums;
  }
  .pd-flash {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    pointer-events: none; opacity: 0; transition: opacity 160ms ease;
    font: 600 1.25rem/1 system-ui, sans-serif; color: #fff;
    text-shadow: 0 1px 8px rgba(0,0,0,.6);
  }
  .pd-flash.is-on { opacity: 1; }
</style>
${openControl}
<script>
(() => {
${dialogBoot}
  const video = root.querySelector(".pd-video");
  const flashEl = root.querySelector("[data-pd-flash]");
  const timeEl = root.querySelector("[data-pd-time]");
  const toggleBtn = root.querySelector("[data-pd-toggle]");
  const progressEl = root.querySelector("[data-pd-progress]");
  const progressFill = root.querySelector("[data-pd-progress-fill]");
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
  function durationOf() {
    return video && Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  }
  function chapterRange(index) {
    const start = Number(chapterButtons[index].getAttribute("data-pd-start") || 0);
    const next = chapterButtons[index + 1];
    const end = next ? Number(next.getAttribute("data-pd-start") || 0) : durationOf();
    return { start, end: Math.max(end, start) };
  }
  function syncClock() {
    if (!video || !timeEl) return;
    timeEl.textContent = formatClock(video.currentTime) + " / " + formatClock(video.duration);
  }
  function syncToggle() {
    if (!toggleBtn || !video) return;
    const paused = video.paused;
    toggleBtn.setAttribute("aria-label", paused ? "Play" : "Pause");
    toggleBtn.setAttribute("data-pd-paused", paused ? "true" : "false");
    const playIcon = toggleBtn.querySelector("[data-pd-icon-play]");
    const pauseIcon = toggleBtn.querySelector("[data-pd-icon-pause]");
    if (playIcon) playIcon.hidden = !paused;
    if (pauseIcon) pauseIcon.hidden = paused;
  }
  function syncTimeline() {
    if (!video) return;
    const t = video.currentTime;
    const duration = durationOf();
    if (progressFill && duration > 0) {
      progressFill.style.width = (100 * t / duration) + "%";
    }
    if (chapterButtons.length === 0) return;
    let active = chapterButtons[0];
    chapterButtons.forEach((btn, index) => {
      const { start, end } = chapterRange(index);
      const span = Math.max(end - start, 0.01);
      btn.style.flexGrow = String(span);
      const fill = btn.querySelector(".pd-segment-fill");
      let ratio = 0;
      if (duration > 0 && t >= end - 0.001) ratio = 1;
      else if (t > start) ratio = Math.min(1, (t - start) / span);
      if (fill) fill.style.width = (ratio * 100) + "%";
      if (start <= t + 0.05) active = btn;
    });
    for (const btn of chapterButtons) {
      btn.setAttribute("aria-current", btn === active ? "true" : "false");
    }
  }
  function seekTo(start) {
    if (!video) return;
    video.currentTime = start;
    video.play?.();
    syncClock();
    syncTimeline();
  }
  function seekFromEvent(el, start, end, event) {
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    seekTo(start + ratio * Math.max(end - start, 0));
  }
  function togglePlay() {
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }
  function showCaptions() {
    const tracks = video?.textTracks;
    if (tracks && tracks[0]) tracks[0].mode = "showing";
  }
  toggleBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePlay();
  });
  video?.addEventListener("click", togglePlay);
  video?.addEventListener("play", () => { pulse("Play"); syncToggle(); });
  video?.addEventListener("pause", () => { pulse("Pause"); syncToggle(); });
  video?.addEventListener("timeupdate", () => { syncClock(); syncTimeline(); });
  video?.addEventListener("loadedmetadata", () => { showCaptions(); syncClock(); syncTimeline(); });
  video?.addEventListener("durationchange", () => { syncClock(); syncTimeline(); });
  video?.addEventListener("seeked", () => { syncClock(); syncTimeline(); });
  progressEl?.addEventListener("click", (event) => {
    seekFromEvent(progressEl, 0, durationOf(), event);
  });
  chapterButtons.forEach((btn, index) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const { start, end } = chapterRange(index);
      seekFromEvent(btn, start, end, event);
    });
  });
  syncClock();
  syncToggle();
  syncTimeline();
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
  const [paused, setPaused] = useState(true);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function pulse(label: string) {
    ${flash ? `setFlashLabel(label);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashLabel(null), 350);` : ""}
  }

  function seekTo(startSec: number, id?: string) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = startSec;
    void video.play();
    setCurrentTime(startSec);
    if (id) setActiveId(id);
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

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  function seekFromEvent(event: { clientX: number; currentTarget: HTMLElement }, start: number, end: number) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    seekTo(start + ratio * Math.max(end - start, 0));
  }

  function onLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    if (video.textTracks[0]) video.textTracks[0].mode = "showing";
    onTimeUpdate();
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative", background: "#111" }}>
        <video
          ref={videoRef}
          playsInline
          preload="metadata"
          style={{ width: "100%", display: "block", background: "#111", colorScheme: "dark" }}
          onClick={togglePlay}
          onPlay={() => { setPaused(false); pulse("Play"); }}
          onPause={() => { setPaused(true); pulse("Pause"); }}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onDurationChange={onTimeUpdate}
        >
          <source src="${videoSrc}" type="video/mp4" />
          <track kind="captions" src="${captionsSrc}" srcLang="en" label="English" default />
        </video>
        ${flashBlock}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            padding: "0.4rem 0.75rem 0.55rem",
            background: "linear-gradient(transparent, rgba(0,0,0,0.78))",
            color: "#fff",
          }}
        >
          {chapters.length > 0 ? (
            <div aria-label="Demo chapters" style={{ display: "flex", gap: "0.4rem", alignItems: "flex-end" }}>
              {chapters.map((chapter, index) => {
                const start = chapter.startSec;
                const end = chapters[index + 1]?.startSec ?? (duration > 0 ? duration : start);
                const span = Math.max(end - start, 0.01);
                let ratio = 0;
                if (duration > 0 && currentTime >= end - 0.001) ratio = 1;
                else if (currentTime > start) ratio = Math.min(1, (currentTime - start) / span);
                const active = chapter.id === activeId;
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    aria-label={chapter.label}
                    aria-current={active ? "true" : undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      seekFromEvent(event, start, end);
                      setActiveId(chapter.id);
                    }}
                    style={{
                      flex: span,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.22rem",
                      padding: 0,
                      border: 0,
                      background: "transparent",
                      color: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        font: "500 0.7rem/1.2 system-ui, sans-serif",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        opacity: active ? 1 : 0.8,
                      }}
                    >
                      {chapter.label}
                    </span>
                    <span
                      style={{
                        display: "block",
                        height: 3,
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.28)",
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          height: "100%",
                          width: \`\${ratio * 100}%\`,
                          background: "#fff",
                        }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              data-pd-progress
              onClick={(event) => seekFromEvent(event, 0, duration)}
              style={{
                height: 3,
                borderRadius: 2,
                background: "rgba(255,255,255,0.28)",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width: duration > 0 ? \`\${(100 * currentTime) / duration}%\` : "0%",
                  background: "#fff",
                }}
              />
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginTop: "0.45rem" }}>
            <button
              type="button"
              aria-label={paused ? "Play" : "Pause"}
              onClick={(event) => {
                event.stopPropagation();
                togglePlay();
              }}
              style={{
                display: "grid",
                placeItems: "center",
                width: "1.5rem",
                height: "1.5rem",
                padding: 0,
                border: 0,
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {paused ? (
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z" />
                </svg>
              )}
            </button>
            <div data-pd-time style={{ font: "500 0.8125rem/1 system-ui, sans-serif", fontVariantNumeric: "tabular-nums" }}>
              {formatPlaybackClock(currentTime, duration)}
            </div>
          </div>
        </div>
      </div>
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
