export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FocusStyle {
  borderWidth: number;
  borderColor: string;
  ringColor: string;
  ringWidth: number;
  dimOpacity: number;
  borderRadius: number;
  padding: number;
}

export const DEFAULT_FOCUS_STYLE: FocusStyle = {
  borderWidth: 3,
  borderColor: "#FFFFFF",
  ringColor: "rgba(255,255,255,0.35)",
  ringWidth: 6,
  dimOpacity: 0.45,
  borderRadius: 12,
  padding: 8,
};

export function expandRect(rect: Rect, padding: number, bounds: Rect): Rect {
  const x = Math.max(bounds.x, rect.x - padding);
  const y = Math.max(bounds.y, rect.y - padding);
  const right = Math.min(bounds.x + bounds.width, rect.x + rect.width + padding);
  const bottom = Math.min(
    bounds.y + bounds.height,
    rect.y + rect.height + padding,
  );
  return {
    x,
    y,
    width: Math.max(0, right - x),
    height: Math.max(0, bottom - y),
  };
}

/** CSS injected into the live page for border/dim focus (no zoom). */
export function buildLiveFocusCss(
  selector: string,
  style: FocusStyle = DEFAULT_FOCUS_STYLE,
): string {
  const safe = selector.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `
html.product-demo-focus-active body::before {
  content: "";
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,${style.dimOpacity});
  pointer-events: none;
  z-index: 2147483646;
}
html.product-demo-focus-active ${safe} {
  position: relative !important;
  z-index: 2147483647 !important;
  outline: ${style.borderWidth}px solid ${style.borderColor} !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 ${style.ringWidth}px ${style.ringColor} !important;
  border-radius: ${style.borderRadius}px !important;
}
`.trim();
}

/**
 * Offline SVG overlay for a still frame: dim outside, rounded border on target.
 * Geometry only — no crop or Ken Burns transform.
 */
export function buildOfflineFocusSvg(
  frame: Rect,
  target: Rect,
  style: FocusStyle = DEFAULT_FOCUS_STYLE,
): string {
  const padded = expandRect(target, style.padding, frame);
  const { x, y, width, height } = padded;
  const r = style.borderRadius;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${frame.width}" height="${frame.height}" viewBox="0 0 ${frame.width} ${frame.height}">
  <defs>
    <mask id="hole">
      <rect width="100%" height="100%" fill="white"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${r}" ry="${r}" fill="black"/>
    </mask>
  </defs>
  <rect width="100%" height="100%" fill="rgba(0,0,0,${style.dimOpacity})" mask="url(#hole)"/>
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${r}" ry="${r}"
        fill="none" stroke="${style.borderColor}" stroke-width="${style.borderWidth}"/>
  <rect x="${x - style.ringWidth / 2}" y="${y - style.ringWidth / 2}"
        width="${width + style.ringWidth}" height="${height + style.ringWidth}"
        rx="${r + 2}" ry="${r + 2}" fill="none" stroke="${style.ringColor}" stroke-width="${style.ringWidth}"/>
</svg>`;
}
