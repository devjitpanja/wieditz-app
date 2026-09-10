"use client";

import { CaptionSplit, SplitMode } from "@/types";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

interface Props {
  split: CaptionSplit;
  captionCount: number;
  hasRawChunks: boolean;
  onChange: (split: Partial<CaptionSplit>) => void;
}

const MODES: { value: SplitMode; label: string; desc: string }[] = [
  { value: "words", label: "By Words", desc: "N words per card" },
  { value: "sentences", label: "By Sentence", desc: "Split on punctuation" },
  { value: "none", label: "Full Chunk", desc: "One card per audio chunk" },
];

export default function CaptionSegmentSettings({ split, captionCount, hasRawChunks, onChange }: Props) {
  return (
    <div className="space-y-4 pb-4 mb-4 border-b border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Segmentation</h3>
        {captionCount > 0 && (
          <span className="text-xs text-violet-400 tabular-nums">{captionCount} captions</span>
        )}
      </div>

      {!hasRawChunks && (
        <p className="text-xs text-white/30 italic">Generate captions first to enable segmentation.</p>
      )}

      {/* Split mode */}
      <div>
        <label className="text-xs text-white/50 block mb-1.5">Split Mode</label>
        <div className="grid grid-cols-3 gap-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              disabled={!hasRawChunks}
              onClick={() => onChange({ mode: m.value })}
              title={m.desc}
              className={cn(
                "px-2 py-2 rounded-lg text-xs font-medium transition-all",
                !hasRawChunks && "opacity-40 cursor-not-allowed",
                split.mode === m.value
                  ? "bg-violet-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Max words — only visible in words mode */}
      {split.mode === "words" && (
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-xs text-white/50">Words per Caption</label>
            <span className="text-xs text-white/70 tabular-nums font-medium">{split.maxWords}</span>
          </div>
          <input
            type="range"
            min={2}
            max={15}
            step={1}
            value={split.maxWords}
            disabled={!hasRawChunks}
            onChange={(e) => onChange({ maxWords: Number(e.target.value) })}
            className="w-full h-1 accent-violet-500 cursor-pointer disabled:opacity-40"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/20">2 (fast)</span>
            <span className="text-[10px] text-white/20">15 (slow)</span>
          </div>
        </div>
      )}

      {/* Max lines */}
      <div>
        <label className="text-xs text-white/50 block mb-1.5">Lines per Caption</label>
        <div className="flex gap-1.5">
          {[1, 2].map((n) => (
            <button
              key={n}
              disabled={!hasRawChunks}
              onClick={() => onChange({ maxLines: n })}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                !hasRawChunks && "opacity-40 cursor-not-allowed",
                split.maxLines === n
                  ? "bg-violet-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {n} {n === 1 ? "line" : "lines"}
            </button>
          ))}
        </div>
      </div>

      {/* Hinglish toggle */}
      <div>
        <button
          disabled={!hasRawChunks}
          onClick={() => onChange({ hinglish: !split.hinglish })}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-sm",
            !hasRawChunks && "opacity-40 cursor-not-allowed",
            split.hinglish
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
              : "bg-white/5 border-white/10 text-white/50 hover:bg-white/8 hover:text-white/70"
          )}
        >
          <Languages className="w-4 h-4 flex-shrink-0" />
          <div className="text-left flex-1">
            <div className="font-medium leading-none mb-0.5">Hinglish Captions</div>
            <div className="text-[10px] opacity-70">Romanize Hindi → Latin script</div>
          </div>
          <div
            className={cn(
              "w-8 h-4 rounded-full flex-shrink-0 transition-all relative",
              split.hinglish ? "bg-amber-500" : "bg-white/20"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                split.hinglish ? "left-4" : "left-0.5"
              )}
            />
          </div>
        </button>
        {split.hinglish && (
          <p className="text-[10px] text-amber-400/70 mt-1.5 px-1">
            Hindi text will be converted to Hinglish (e.g. "नमस्ते" → "Namaste"). Requires re-generating captions.
          </p>
        )}
      </div>
    </div>
  );
}
