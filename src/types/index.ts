export interface CaptionEntry {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

export interface CaptionPosition {
  x: number; // percentage (0–100) from left, center of caption
  y: number; // percentage (0–100) from top, center of caption
}

export interface CaptionStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: CaptionPosition;
  bold: boolean;
  italic: boolean;
}

export type ProcessingStatus =
  | "idle"
  | "extracting"
  | "transcribing"
  | "done"
  | "error";

export interface ProcessingProgress {
  status: ProcessingStatus;
  currentChunk: number;
  totalChunks: number;
  message: string;
  error?: string;
}

export interface WordTimestamp {
  word: string;
  start: number; // seconds, relative to chunk start
  end: number;
}

export interface TranscribeResponse {
  transcript: string;
  language_code: string;
  // Sarvam returns timestamps when with_timestamps=true
  timestamps?: { words?: WordTimestamp[] };
  word_timestamps?: WordTimestamp[];
}

export type SplitMode = "words" | "sentences" | "none";

export interface CaptionSplit {
  mode: SplitMode;
  maxWords: number;  // words per caption card (mode=words)
  maxLines: number;  // 1 or 2 display lines per card
}

export interface RawChunk {
  transcript: string;
  startTime: number;
  endTime: number;
  words?: WordTimestamp[];
}
