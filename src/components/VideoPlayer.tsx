"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from "lucide-react";
import { CaptionEntry, CaptionStyle, CaptionPosition } from "@/types";
import { getCurrentCaption } from "@/lib/captions";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  captions: CaptionEntry[];
  style: CaptionStyle;
  maxLines?: number;
  onCaptionPositionChange?: (position: CaptionPosition) => void;
}

export default function VideoPlayer({
  videoUrl,
  captions,
  style,
  maxLines = 2,
  onCaptionPositionChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentCaption, setCurrentCaption] = useState<CaptionEntry | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isPortrait, setIsPortrait] = useState(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Holds drag start state: mouse coords + caption position at drag start
  const dragRef = useRef<{ startX: number; startY: number; captionX: number; captionY: number } | null>(null);

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setShowControls(true);
    controlsTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  }, [playing]);

  useEffect(() => {
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setCurrentCaption(getCurrentCaption(captions, video.currentTime));
    };
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      // Detect portrait (9:16) vs landscape (16:9) video
      setIsPortrait(video.videoHeight > video.videoWidth);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => { setPlaying(false); setShowControls(true); };
    const onEnded = () => { setPlaying(false); setShowControls(true); };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [captions]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.pause();
    else video.play();
    hideControlsAfterDelay();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const t = Number(e.target.value);
    video.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Number(e.target.value);
    video.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // Caption drag — mouse
  const onCaptionMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const container = containerRef.current;
      if (!container || !onCaptionPositionChange) return;
      const rect = container.getBoundingClientRect();

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        captionX: style.position.x,
        captionY: style.position.y,
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ((ev.clientX - dragRef.current.startX) / rect.width) * 100;
        const dy = ((ev.clientY - dragRef.current.startY) / rect.height) * 100;
        onCaptionPositionChange({
          x: Math.min(90, Math.max(10, dragRef.current.captionX + dx)),
          y: Math.min(95, Math.max(5, dragRef.current.captionY + dy)),
        });
      };

      const onMouseUp = () => {
        dragRef.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [style.position, onCaptionPositionChange]
  );

  // Caption drag — touch
  const onCaptionTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const container = containerRef.current;
      if (!container || !onCaptionPositionChange || e.touches.length === 0) return;
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];

      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        captionX: style.position.x,
        captionY: style.position.y,
      };

      const onTouchMove = (ev: TouchEvent) => {
        if (!dragRef.current || ev.touches.length === 0) return;
        ev.preventDefault();
        const t = ev.touches[0];
        const dx = ((t.clientX - dragRef.current.startX) / rect.width) * 100;
        const dy = ((t.clientY - dragRef.current.startY) / rect.height) * 100;
        onCaptionPositionChange({
          x: Math.min(90, Math.max(10, dragRef.current.captionX + dx)),
          y: Math.min(95, Math.max(5, dragRef.current.captionY + dy)),
        });
      };

      const onTouchEnd = () => {
        dragRef.current = null;
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      };

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [style.position, onCaptionPositionChange]
  );

  const captionStyle: React.CSSProperties = {
    fontSize: `${style.fontSize}px`,
    fontFamily: style.fontFamily,
    color: style.color,
    backgroundColor: `${style.backgroundColor}${Math.round(style.backgroundOpacity * 255).toString(16).padStart(2, "0")}`,
    fontWeight: style.bold ? "bold" : "normal",
    fontStyle: style.italic ? "italic" : "normal",
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-xl overflow-hidden group select-none",
        isPortrait
          ? "aspect-[9/16] max-h-[70vh] w-auto mx-auto"
          : "w-full aspect-video"
      )}
      onMouseMove={hideControlsAfterDelay}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Caption overlay — draggable, constrained within the video frame */}
      {currentCaption && (
        <div
          className={cn(
            "absolute pointer-events-auto",
            onCaptionPositionChange ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          )}
          style={{
            left: `${style.position.x}%`,
            top: `${style.position.y}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            maxWidth: "80%",
          }}
          onMouseDown={onCaptionPositionChange ? onCaptionMouseDown : undefined}
          onTouchStart={onCaptionPositionChange ? onCaptionTouchStart : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="inline-block text-center px-3 py-1.5 rounded-md"
            style={{
              ...captionStyle,
              display: "-webkit-box",
              WebkitLineClamp: maxLines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "1.4",
            }}
          >
            {currentCaption.text}
          </span>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 accent-violet-500 cursor-pointer mb-3"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-violet-400 transition-colors">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={restart} className="text-white/60 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="w-20 h-1 accent-violet-500 cursor-pointer"
            />
            <span className="text-white/60 text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Big play/pause icon flash */}
      {!playing && duration > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
