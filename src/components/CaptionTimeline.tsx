"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { CaptionEntry } from "@/types";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, Film } from "lucide-react";

interface Props {
  captions: CaptionEntry[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateTiming: (id: string, start: number, end: number) => void;
  onSelectCaption?: (id: string) => void;
}

const BLOCK_COLORS = [
  "#7c3aed", "#2563eb", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#7c3aed", "#9333ea",
];

const MIN_ZOOM = 15;
const MAX_ZOOM = 300;
const RULER_OFFSET = 48; // px left padding for labels

export default function CaptionTimeline({
  captions,
  duration,
  currentTime,
  onSeek,
  onUpdateTiming,
  onSelectCaption,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pxPerSec, setPxPerSec] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dragRef = useRef<{
    id: string;
    type: "move" | "resize-left" | "resize-right";
    startX: number;
    origStart: number;
    origEnd: number;
  } | null>(null);

  const totalWidth = duration * pxPerSec + RULER_OFFSET * 2;

  // Fit-to-width on mount or duration change
  useEffect(() => {
    const container = containerRef.current;
    if (!container || duration === 0) return;
    const available = container.clientWidth - RULER_OFFSET * 2;
    const fitZoom = Math.max(MIN_ZOOM, available / duration);
    setPxPerSec(Math.min(MAX_ZOOM, fitZoom));
  }, [duration]);

  // Auto-scroll to keep playhead in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container || duration === 0) return;
    const playheadX = currentTime * pxPerSec + RULER_OFFSET;
    const { scrollLeft, clientWidth } = container;
    if (playheadX < scrollLeft + 24 || playheadX > scrollLeft + clientWidth - 24) {
      container.scrollLeft = Math.max(0, playheadX - clientWidth / 2);
    }
  }, [currentTime, pxPerSec, duration]);

  const timeFromEvent = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + (containerRef.current?.scrollLeft ?? 0) - RULER_OFFSET;
      return Math.max(0, Math.min(duration, x / pxPerSec));
    },
    [pxPerSec, duration]
  );

  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onSeek(timeFromEvent(e));
    },
    [timeFromEvent, onSeek]
  );

  const startDrag = useCallback(
    (
      e: React.MouseEvent,
      id: string,
      type: "move" | "resize-left" | "resize-right",
      origStart: number,
      origEnd: number
    ) => {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current = { id, type, startX: e.clientX, origStart, origEnd };
      setSelectedId(id);
      onSelectCaption?.(id);

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dt = dx / pxPerSec;
        const { type: t, origStart: os, origEnd: oe, id: dragId } = dragRef.current;

        let ns = os;
        let ne = oe;

        if (t === "move") {
          ns = Math.max(0, Math.min(duration - (oe - os), os + dt));
          ne = ns + (oe - os);
        } else if (t === "resize-left") {
          ns = Math.max(0, Math.min(oe - 0.1, os + dt));
        } else {
          ne = Math.min(duration, Math.max(os + 0.1, oe + dt));
        }

        onUpdateTiming(dragId, ns, ne);
      };

      const onMouseUp = () => {
        dragRef.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [pxPerSec, duration, onUpdateTiming, onSelectCaption]
  );

  // Time ruler ticks
  const tickInterval =
    pxPerSec >= 150 ? 0.5 :
    pxPerSec >= 80  ? 1 :
    pxPerSec >= 40  ? 2 :
    pxPerSec >= 20  ? 5 : 10;

  const ticks: number[] = [];
  for (let t = 0; t <= duration + tickInterval; t += tickInterval) {
    if (t <= duration) ticks.push(t);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec % 1 === 0
      ? `${m}:${String(Math.floor(sec)).padStart(2, "0")}`
      : `${m}:${sec.toFixed(1)}`;
  };

  if (duration === 0) return null;

  return (
    <div className="border-t border-white/10 bg-[#080809] flex flex-col flex-shrink-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-white/[0.07]">
        <Film className="w-3.5 h-3.5 text-white/30" />
        <span className="text-xs text-white/40 font-medium">Timeline</span>
        <div className="flex-1" />
        <span className="text-xs text-white/25 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setPxPerSec((v) => Math.max(MIN_ZOOM, v / 1.4))}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPxPerSec((v) => Math.min(MAX_ZOOM, v * 1.4))}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable track area */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-hidden custom-scroll relative"
        style={{ height: "116px" }}
      >
        <div
          className="relative"
          style={{ width: `${totalWidth}px`, height: "116px" }}
        >
          {/* Ruler row */}
          <div
            className="absolute top-0 left-0 h-7 cursor-pointer select-none"
            style={{ width: `${totalWidth}px` }}
            onClick={handleRulerClick}
          >
            {/* Ruler background */}
            <div className="absolute inset-0 bg-[#0d0d0f]" />
            {ticks.map((t) => {
              const x = t * pxPerSec + RULER_OFFSET;
              const isMajor = t % (tickInterval * 5) === 0 || tickInterval >= 2;
              return (
                <div
                  key={t}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: `${x}px` }}
                >
                  <div
                    className={cn(
                      "w-px",
                      isMajor ? "h-3 bg-white/25" : "h-2 bg-white/12"
                    )}
                  />
                  {isMajor && (
                    <span className="text-[9px] text-white/25 tabular-nums mt-0.5 -translate-x-1/2 whitespace-nowrap">
                      {formatTime(t)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Video/audio track bar */}
          <div
            className="absolute cursor-pointer"
            style={{ top: "28px", left: `${RULER_OFFSET}px`, width: `${duration * pxPerSec}px`, height: "16px" }}
            onClick={handleRulerClick}
          >
            <div className="w-full h-full rounded-sm bg-gradient-to-r from-white/[0.06] to-white/[0.04] border border-white/[0.08]" />
          </div>

          {/* Caption track */}
          <div
            className="absolute"
            style={{ top: "50px", left: 0, right: 0, height: "58px" }}
          >
            {captions.map((cap, i) => {
              const left = cap.start * pxPerSec + RULER_OFFSET;
              const width = Math.max(4, (cap.end - cap.start) * pxPerSec);
              const color = BLOCK_COLORS[i % BLOCK_COLORS.length];
              const isSelected = selectedId === cap.id;

              return (
                <div
                  key={cap.id}
                  className="absolute top-1 group"
                  style={{ left: `${left}px`, width: `${width}px`, height: "48px" }}
                >
                  {/* Block body */}
                  <div
                    className={cn(
                      "w-full h-full rounded overflow-hidden cursor-grab active:cursor-grabbing flex items-center px-1.5 select-none",
                      isSelected && "ring-1 ring-white/40"
                    )}
                    style={{
                      backgroundColor: `${color}bb`,
                      border: `1.5px solid ${color}`,
                      boxShadow: isSelected ? `0 0 0 1px ${color}80` : undefined,
                    }}
                    onMouseDown={(e) => startDrag(e, cap.id, "move", cap.start, cap.end)}
                    onDoubleClick={() => onSeek(cap.start)}
                    title={cap.text}
                  >
                    {width > 30 && (
                      <span className="text-[10px] text-white/90 font-medium truncate leading-tight">
                        {cap.text}
                      </span>
                    )}
                  </div>

                  {/* Left resize handle */}
                  <div
                    className="absolute left-0 top-0 w-2 h-full cursor-w-resize rounded-l opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: color }}
                    onMouseDown={(e) => startDrag(e, cap.id, "resize-left", cap.start, cap.end)}
                  />

                  {/* Right resize handle */}
                  <div
                    className="absolute right-0 top-0 w-2 h-full cursor-e-resize rounded-r opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: color }}
                    onMouseDown={(e) => startDrag(e, cap.id, "resize-right", cap.start, cap.end)}
                  />

                  {/* Time tooltip on hover */}
                  <div className="absolute -top-5 left-0 hidden group-hover:flex items-center gap-1 whitespace-nowrap pointer-events-none z-20">
                    <span className="text-[9px] bg-black/80 text-white/70 rounded px-1 py-0.5 tabular-nums">
                      {formatTime(cap.start)} – {formatTime(cap.end)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{ left: `${currentTime * pxPerSec + RULER_OFFSET}px` }}
          >
            {/* Head diamond */}
            <div
              className="absolute -top-0.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-violet-400"
              style={{ boxShadow: "0 0 6px #7c3aed" }}
            />
            {/* Line */}
            <div className="w-px h-full bg-violet-400/80" style={{ boxShadow: "0 0 4px #7c3aed66" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
