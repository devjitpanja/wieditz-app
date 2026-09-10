"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CaptionEntry, CaptionStyle, CaptionSplit, ProcessingProgress, RawChunk } from "@/types";

interface AppState {
  videoFile: File | null;
  videoUrl: string | null;
  savedVideoName: string | null;
  captions: CaptionEntry[];
  rawChunks: RawChunk[];       // stored so re-split never re-transcribes
  progress: ProcessingProgress;
  style: CaptionStyle;
  captionSplit: CaptionSplit;

  setVideo: (file: File, url: string) => void;
  restoreVideo: (file: File, url: string) => void;
  setCaptions: (captions: CaptionEntry[]) => void;
  setRawChunks: (chunks: RawChunk[]) => void;
  updateCaption: (id: string, text: string) => void;
  deleteCaption: (id: string) => void;
  setProgress: (progress: Partial<ProcessingProgress>) => void;
  updateStyle: (style: Partial<CaptionStyle>) => void;
  updateCaptionSplit: (split: Partial<CaptionSplit>) => void;
  reset: () => void;
}

const defaultStyle: CaptionStyle = {
  fontSize: 24,
  fontFamily: "Inter, sans-serif",
  color: "#ffffff",
  backgroundColor: "#000000",
  backgroundOpacity: 0.7,
  position: { x: 50, y: 85 },
  bold: false,
  italic: false,
};

const defaultProgress: ProcessingProgress = {
  status: "idle",
  currentChunk: 0,
  totalChunks: 0,
  message: "",
};

const defaultCaptionSplit: CaptionSplit = {
  mode: "words",
  maxWords: 7,
  maxLines: 2,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      videoFile: null,
      videoUrl: null,
      savedVideoName: null,
      captions: [],
      rawChunks: [],
      progress: defaultProgress,
      style: defaultStyle,
      captionSplit: defaultCaptionSplit,

      setVideo: (file, url) =>
        set({
          videoFile: file,
          videoUrl: url,
          savedVideoName: file.name,
          captions: [],
          rawChunks: [],
          progress: defaultProgress,
        }),

      // Restores video without clearing captions — used on page refresh recovery
      restoreVideo: (file, url) =>
        set({ videoFile: file, videoUrl: url }),

      setCaptions: (captions) => set({ captions }),

      setRawChunks: (rawChunks) => set({ rawChunks }),

      updateCaption: (id, text) =>
        set((state) => ({
          captions: state.captions.map((c) => (c.id === id ? { ...c, text } : c)),
        })),

      deleteCaption: (id) =>
        set((state) => ({
          captions: state.captions.filter((c) => c.id !== id),
        })),

      setProgress: (progress) =>
        set((state) => ({ progress: { ...state.progress, ...progress } })),

      updateStyle: (style) =>
        set((state) => ({ style: { ...state.style, ...style } })),

      updateCaptionSplit: (split) =>
        set((state) => ({ captionSplit: { ...state.captionSplit, ...split } })),

      reset: () =>
        set({
          videoFile: null,
          videoUrl: null,
          savedVideoName: null,
          captions: [],
          rawChunks: [],
          progress: defaultProgress,
          style: defaultStyle,
          captionSplit: defaultCaptionSplit,
        }),
    }),
    {
      name: "wieditz-session",
      // Only persist serializable fields — videoFile/videoUrl are runtime-only
      partialize: (state) => ({
        savedVideoName: state.savedVideoName,
        captions: state.captions,
        rawChunks: state.rawChunks,
        style: state.style,
        captionSplit: state.captionSplit,
      }),
    }
  )
);
