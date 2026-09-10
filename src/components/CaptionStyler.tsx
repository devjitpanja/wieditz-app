"use client";

import { CaptionStyle, CaptionAnimation } from "@/types";
import { cn } from "@/lib/utils";
import { Bold, Italic, AlignVerticalJustifyEnd, AlignVerticalJustifyCenter, AlignVerticalJustifyStart, Move, Sparkles } from "lucide-react";

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

const ANIMATIONS: { value: CaptionAnimation; label: string; emoji: string }[] = [
  { value: "none", label: "None", emoji: "—" },
  { value: "fade", label: "Fade", emoji: "✨" },
  { value: "pop", label: "Pop", emoji: "💥" },
  { value: "slide-up", label: "Slide Up", emoji: "⬆️" },
  { value: "word-pop", label: "Word Pop", emoji: "🔤" },
];

interface StylePreset {
  name: string;
  style: Partial<CaptionStyle>;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    name: "Bold Yellow",
    style: {
      fontSize: 30,
      fontFamily: "Impact, sans-serif",
      color: "#ffff00",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      bold: true,
      italic: false,
      animation: "pop",
      textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
    },
  },
  {
    name: "Clean White",
    style: {
      fontSize: 24,
      fontFamily: "Inter, sans-serif",
      color: "#ffffff",
      backgroundColor: "#000000",
      backgroundOpacity: 0.75,
      bold: true,
      italic: false,
      animation: "fade",
      textShadow: undefined,
    },
  },
  {
    name: "Neon Green",
    style: {
      fontSize: 26,
      fontFamily: "Inter, sans-serif",
      color: "#00ff88",
      backgroundColor: "#000000",
      backgroundOpacity: 0.6,
      bold: true,
      italic: false,
      animation: "pop",
      textShadow: "0 0 8px #00ff88, 0 0 20px #00ff8866",
    },
  },
  {
    name: "Word Pop",
    style: {
      fontSize: 28,
      fontFamily: "Inter, sans-serif",
      color: "#ffffff",
      backgroundColor: "#7c3aed",
      backgroundOpacity: 0.85,
      bold: true,
      italic: false,
      animation: "word-pop",
      textShadow: undefined,
    },
  },
  {
    name: "Minimal",
    style: {
      fontSize: 20,
      fontFamily: "Inter, sans-serif",
      color: "#ffffff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      bold: false,
      italic: false,
      animation: "slide-up",
      textShadow: "1px 1px 4px rgba(0,0,0,0.9), -1px -1px 4px rgba(0,0,0,0.9)",
    },
  },
  {
    name: "Reels Bold",
    style: {
      fontSize: 32,
      fontFamily: "Impact, sans-serif",
      color: "#ffffff",
      backgroundColor: "#000000",
      backgroundOpacity: 0,
      bold: false,
      italic: false,
      animation: "word-pop",
      textShadow: "3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000",
    },
  },
];

export default function CaptionStyler({ style, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Caption Style</h3>

      {/* High-engagement presets */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <label className="text-xs text-white/50">Style Presets</label>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(preset.style)}
              className="px-2.5 py-2 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-left truncate"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Animation */}
      <div>
        <label className="text-xs text-white/50 block mb-1.5">Animation</label>
        <div className="grid grid-cols-5 gap-1">
          {ANIMATIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => onChange({ animation: a.value })}
              title={a.label}
              className={cn(
                "py-2 rounded-lg flex flex-col items-center gap-0.5 text-[10px] transition-all",
                style.animation === a.value
                  ? "bg-violet-500 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              )}
            >
              <span className="text-sm leading-none">{a.emoji}</span>
              <span className="leading-none">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

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
          <span>Drag the caption on the video to reposition it</span>
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
