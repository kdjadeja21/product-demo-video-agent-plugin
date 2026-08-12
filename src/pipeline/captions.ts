export interface CaptionSentence {
  text: string;
  startSec: number;
  endSec: number;
}

export interface SectionTiming {
  id: string;
  text: string;
  startSec: number;
  durationSec: number;
}

/** Split narration into sentences; keep punctuation on the sentence. */
export function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!parts) return [cleaned];
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Allocate subtitle cue timing by character weight inside a section duration.
 */
export function allocateSentenceTimings(
  text: string,
  startSec: number,
  durationSec: number,
): CaptionSentence[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];
  const weights = sentences.map((s) => Math.max(s.length, 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let cursor = startSec;
  const end = startSec + durationSec;
  return sentences.map((sentence, index) => {
    const share = (weights[index]! / total) * durationSec;
    const cueStart = cursor;
    const cueEnd =
      index === sentences.length - 1 ? end : Math.min(end, cursor + share);
    cursor = cueEnd;
    return { text: sentence, startSec: cueStart, endSec: cueEnd };
  });
}

export function formatVttTimestamp(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  const whole = Math.floor(secs);
  const millis = Math.round((secs - whole) * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(whole)}.${pad(millis, 3)}`;
}

export function buildWebVtt(sections: SectionTiming[]): string {
  const lines = ["WEBVTT", ""];
  let cueIndex = 1;
  for (const section of sections) {
    const cues = allocateSentenceTimings(
      section.text,
      section.startSec,
      section.durationSec,
    );
    for (const cue of cues) {
      if (cue.endSec <= cue.startSec) continue;
      lines.push(String(cueIndex++));
      lines.push(
        `${formatVttTimestamp(cue.startSec)} --> ${formatVttTimestamp(cue.endSec)}`,
      );
      lines.push(cue.text);
      lines.push("");
    }
  }
  return lines.join("\n");
}

export function parseVttDuration(vtt: string): number {
  const times = [...vtt.matchAll(/-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/g)].map(
    (m) => parseVttTimestamp(m[1]!),
  );
  return times.length ? Math.max(...times) : 0;
}

export function parseVttTimestamp(ts: string): number {
  const [h, m, rest] = ts.split(":");
  const [s, ms] = rest!.split(".");
  return (
    Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000
  );
}
