export type PlayerSnippetFormat = "html" | "react";

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
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

export function generatePlayerSnippet(options: {
  format: PlayerSnippetFormat;
  videoSrc: string;
  captionsSrc: string;
  playPauseFlash?: boolean;
}): string {
  const flash = options.playPauseFlash !== false;
  if (options.format === "react") {
    return reactSnippet(
      escapeJsStringLiteral(options.videoSrc),
      escapeJsStringLiteral(options.captionsSrc),
      flash,
    );
  }
  return htmlSnippet(
    escapeHtmlAttribute(options.videoSrc),
    escapeHtmlAttribute(options.captionsSrc),
    flash,
  );
}

function htmlSnippet(
  videoSrc: string,
  captionsSrc: string,
  flash: boolean,
): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Product demo</title>
    <style>
      .demo-player { position: relative; max-width: 960px; margin: 2rem auto; }
      .demo-player video { width: 100%; display: block; background: #111; }
      .demo-flash {
        position: absolute; inset: 0; display: grid; place-items: center;
        pointer-events: none; opacity: 0; transition: opacity 160ms ease;
        font: 600 1.25rem/1 system-ui, sans-serif; color: #fff;
        text-shadow: 0 1px 8px rgba(0,0,0,.6);
      }
      .demo-flash.is-on { opacity: 1; }
    </style>
  </head>
  <body>
    <div class="demo-player">
      <video id="demo" controls playsinline>
        <source src="${videoSrc}" type="video/mp4" />
        <track kind="captions" src="${captionsSrc}" srclang="en" label="English" default />
      </video>
      ${flash ? `<div class="demo-flash" id="flash" aria-hidden="true"></div>` : ""}
    </div>
    ${
      flash
        ? `<script>
      const video = document.getElementById("demo");
      const flash = document.getElementById("flash");
      let timer;
      function pulse(label) {
        flash.textContent = label;
        flash.classList.add("is-on");
        clearTimeout(timer);
        timer = setTimeout(() => flash.classList.remove("is-on"), 350);
      }
      video.addEventListener("play", () => pulse("Play"));
      video.addEventListener("pause", () => pulse("Pause"));
    </script>`
        : ""
    }
  </body>
</html>
`;
}

function reactSnippet(
  videoSrc: string,
  captionsSrc: string,
  flash: boolean,
): string {
  return `import { useRef, useState } from "react";

export function ProductDemoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [flash, setFlash] = useState<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function pulse(label: string) {
    ${flash ? `setFlash(label);
    clearTimeout(timer);
    timer = setTimeout(() => setFlash(null), 350);` : ""}
  }

  return (
    <div style={{ position: "relative", maxWidth: 960, margin: "2rem auto" }}>
      <video
        ref={videoRef}
        controls
        playsInline
        style={{ width: "100%", display: "block", background: "#111" }}
        onPlay={() => pulse("Play")}
        onPause={() => pulse("Pause")}
      >
        <source src="${videoSrc}" type="video/mp4" />
        <track kind="captions" src="${captionsSrc}" srcLang="en" label="English" default />
      </video>
      ${
        flash
          ? `{flash ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            color: "#fff",
            fontWeight: 600,
            textShadow: "0 1px 8px rgba(0,0,0,.6)",
          }}
        >
          {flash}
        </div>
      ) : null}`
          : ""
      }
    </div>
  );
}
`;
}
