import { CaptionEntry, RawChunk, CaptionSplit, WordTimestamp } from "@/types";
import { generateId } from "./utils";

// ─── Sentence boundary regex (Latin + Devanagari danda ।) ─────────────────────
const SENTENCE_BREAK = /(?<=[.!?।])\s+/;

export function buildCaptionsFromChunks(
  chunks: RawChunk[],
  split: CaptionSplit
): CaptionEntry[] {
  const entries: CaptionEntry[] = [];

  for (const chunk of chunks) {
    if (!chunk.transcript.trim()) continue;

    if (split.mode === "none") {
      entries.push({
        id: generateId(),
        start: chunk.startTime,
        end: chunk.endTime,
        text: chunk.transcript.trim(),
      });
      continue;
    }

    const words = resolveWords(chunk);

    if (split.mode === "sentences") {
      entries.push(...splitBySentences(chunk, words, split.maxWords));
    } else {
      // mode === "words"
      entries.push(...splitByWords(words, chunk.startTime, split.maxWords));
    }
  }

  return entries;
}

// ─── Resolve word list ─────────────────────────────────────────────────────────
// Uses Sarvam word timestamps only when they look valid, otherwise distributes proportionally.
function resolveWords(chunk: RawChunk): WordTimestamp[] {
  const apiWords =
    chunk.words ??
    (chunk as unknown as { timestamps?: { words?: WordTimestamp[] } }).timestamps?.words;

  const transcriptTokens = chunk.transcript.trim().split(/\s+/).filter(Boolean);

  // Validate: need valid numeric timing AND enough words to cover the transcript
  const isValid =
    Array.isArray(apiWords) &&
    apiWords.length >= 2 &&
    apiWords.length >= transcriptTokens.length * 0.4 &&
    apiWords.every(
      (w) =>
        typeof w.start === "number" &&
        typeof w.end === "number" &&
        !isNaN(w.start) &&
        !isNaN(w.end)
    );

  if (isValid) return apiWords!;

  // Proportional fallback: split text evenly across duration
  if (!transcriptTokens.length) return [];
  const duration = chunk.endTime - chunk.startTime;
  const timePerWord = duration / transcriptTokens.length;
  return transcriptTokens.map((word, i) => ({
    word,
    start: i * timePerWord,
    end: (i + 1) * timePerWord,
  }));
}

// ─── Split by N words ─────────────────────────────────────────────────────────
function splitByWords(
  words: WordTimestamp[],
  chunkStart: number,
  maxWords: number
): CaptionEntry[] {
  const entries: CaptionEntry[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    const group = words.slice(i, i + maxWords);
    entries.push({
      id: generateId(),
      start: chunkStart + group[0].start,
      end: chunkStart + group[group.length - 1].end,
      text: group.map((w) => w.word).join(" "),
    });
  }
  return entries;
}

// ─── Split by sentences ───────────────────────────────────────────────────────
// Uses sentence breaks for text, then maps to proportional timing from words.
function splitBySentences(
  chunk: RawChunk,
  words: WordTimestamp[],
  maxWordsPerSentence: number
): CaptionEntry[] {
  const sentences = chunk.transcript.trim().split(SENTENCE_BREAK).filter(Boolean);

  // If only one sentence or no breaks found, fall back to word splitting
  if (sentences.length <= 1) {
    return splitByWords(words, chunk.startTime, maxWordsPerSentence);
  }

  const totalChars = chunk.transcript.trim().length;
  const totalDuration = chunk.endTime - chunk.startTime;
  const entries: CaptionEntry[] = [];
  let charCursor = 0;

  for (const sentence of sentences) {
    const startFrac = charCursor / totalChars;
    charCursor += sentence.length + 1; // +1 for the split space
    const endFrac = Math.min(charCursor / totalChars, 1);

    entries.push({
      id: generateId(),
      start: chunk.startTime + startFrac * totalDuration,
      end: chunk.startTime + endFrac * totalDuration,
      text: sentence.trim(),
    });
  }

  return entries;
}

// ─── Playback helper ──────────────────────────────────────────────────────────
export function getCurrentCaption(
  captions: CaptionEntry[],
  currentTime: number
): CaptionEntry | null {
  return (
    captions.find((c) => currentTime >= c.start && currentTime <= c.end) ?? null
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function exportSRT(captions: CaptionEntry[]): string {
  return captions
    .map((c, i) => `${i + 1}\n${toSRTTime(c.start)} --> ${toSRTTime(c.end)}\n${c.text}`)
    .join("\n\n");
}

export function exportVTT(captions: CaptionEntry[]): string {
  const body = captions
    .map((c) => `${toVTTTime(c.start)} --> ${toVTTTime(c.end)}\n${c.text}`)
    .join("\n\n");
  return `WEBVTT\n\n${body}`;
}

function toSRTTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms, 3)}`;
}

function toVTTTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(sec)}.${pad(ms, 3)}`;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}
