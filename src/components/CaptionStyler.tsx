"use client";

import { CaptionStyle } from "@/types";
import { cn } from "@/lib/utils";
import { Bold, Italic, AlignVerticalJustifyEnd, AlignVerticalJustifyCenter, AlignVerticalJustifyStart, Move } from "lucide-react";

interface Props {
  style: CaptionStyle;
  onChange: (style: Partial<CaptionStyle>) => void;
}

const FONT_FAMILIES = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier", value: "Courier New, monospace" },
  { label: "Impact", value: "Impact, sans-serif" },
];

const PRESET_COLORS = ["#ffffff", "#ffff00", "#00ff00", "#00ffff", "#ff6b6b", "#ffd93d"];
const PRESET_BG = ["#000000", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560"];

const POSITION_PRESETS = [
  { label: "Top", icon: AlignVerticalJustifyStart, x: 50, y: 10 },
  { label: "Middle", icon: AlignVerticalJustifyCenter, x: 50, y: 50 },
  { label: "Bottom", icon: AlignVerticalJustifyEnd, x: 50, y: 85 },
];

export default function CaptionStyler({ style, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Caption Style</h3>

      {/* Font size */}
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-xs text-white/50">Font Size</label>
          <span className="text-xs text-white/70 tabular-nums">{style.fontSize}px</span>
        </div>
        <input
          type="range"
          min={14}
          max={56}
          value={style.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          className="w-full h-1 accent-violet-500 cursor-pointer"
        />
      </div>

      {/* Font family */}
      <div>
        <label className="text-xs text-white/50 block mb-1.5">Font Family</label>
        <div className="grid grid-cols-2 gap-1.5">
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange({ fontFamily: f.value })}
              className={cn(
                "px-3 py-2 rounded-lg text-xs transition-all",
                style.fontFamily === f.value
                  ? "bg-violet-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text style */}
      <div>
        <label className="text-xs text-white/50 block mb-1.5">Text Style</label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ bold: !style.bold })}
            className={cn(
              "flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all",
              style.bold ? "bg-violet-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            <Bold className="w-3.5 h-3.5" /> Bold
          </button>
          <button
            onClick={() => onChange({ italic: !style.italic })}
            className={cn(
              "flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all",
              style.italic ? "bg-violet-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            <Italic className="w-3.5 h-3.5" /> Italic
          </button>
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="text-xs text-white/50 block mb-1.5">Position</label>
        <div className="flex items-center gap-1.5 mb-2 text-xs text-white/30 bg-white/5 rounded-lg px-2.5 py-2">
          <Move className="w-3 h-3 flex-shrink-0" />
          <span>Drag the caption on the video to reposition it freely</span>
        </div>
        <div className="flex gap-1.5">
          {POSITION_PRESETS.map(({ label, icon: Icon, x, y }) => (
            <button
              key={label}
              onClick={() => onChange({ position: { x, y } })}
              className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 text-xs bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Text color */}
      <div>
        <label className="text-xs text-white/50 block mb-1.5">Text Color</label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onChange({ color })}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all",
                  style.color === color ? "border-violet-400 scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <input
            type="color"
            value={style.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-7 h-7 rounded-full border-2 border-white/20 cursor-pointer bg-transparent"
          />
        </div>
      </div>

      {/* Background color */}
      <div>
        <label className="text-xs text-white/50 block mb-1.5">Background Color</label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_BG.map((color) => (
              <button
                key={color}
                onClick={() => onChange({ backgroundColor: color })}
                className={cn(
                  "w-7 h-7 rounded-full border-2 transition-all",
                  style.backgroundColor === color ? "border-violet-400 scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <input
            type="color"
            value={style.backgroundColor}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="w-7 h-7 rounded-full border-2 border-white/20 cursor-pointer bg-transparent"
          />
        </div>
      </div>

      {/* Background opacity */}
      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-xs text-white/50">Background Opacity</label>
          <span className="text-xs text-white/70 tabular-nums">
            {Math.round(style.backgroundOpacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={style.backgroundOpacity}
          onChange={(e) => onChange({ backgroundOpacity: Number(e.target.value) })}
          className="w-full h-1 accent-violet-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
