"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import VideoPlayer from "@/components/VideoPlayer";
import ProcessingProgress from "@/components/ProcessingProgress";
import CaptionStyler from "@/components/CaptionStyler";
import CaptionList from "@/components/CaptionList";
import CaptionSegmentSettings from "@/components/CaptionSegmentSettings";
import { extractAndChunkAudio, AudioChunk } from "@/lib/ffmpeg";
import { buildCaptionsFromChunks, exportSRT, exportVTT } from "@/lib/captions";
import { TranscribeResponse, RawChunk } from "@/types";
import { loadVideoFromIDB } from "@/lib/persistence";
import {
  ArrowLeft,
  Wand2,
  Download,
  Film,
  Subtitles,
  Palette,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "captions" | "style";

interface LogEntry {
  level: "info" | "success" | "error" | "warn";
  msg: string;
  ts: number;
}

function addLog(
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  level: LogEntry["level"],
  msg: string
) {
  const entry: LogEntry = { level, msg, ts: Date.now() };
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    `[WiEditz ${level.toUpperCase()}]`,
    msg
  );
  setLogs((prev) => [...prev, entry]);
}

export default function EditorPage() {
  const router = useRouter();
  const {
    videoFile,
    videoUrl,
    savedVideoName,
    captions,
    rawChunks,
    progress,
    style,
    captionSplit,
    setCaptions,
    setRawChunks,
    setProgress,
    updateCaption,
    deleteCaption,
    updateStyle,
    updateCaptionSplit,
    restoreVideo,
    reset,
  } = useStore();

  const [tab, setTab] = useState<Tab>("captions");
  const [currentTime] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [restoredSession, setRestoredSession] = useState(false);
  const processingRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const restoreAttempted = useRef(false);

  // Guard: if no video in memory, try to restore from IndexedDB; otherwise redirect home
  useEffect(() => {
    if (videoFile && videoUrl) return;
    if (restoreAttempted.current) return;
    restoreAttempted.current = true;

    if (savedVideoName) {
      loadVideoFromIDB().then((file) => {
        if (file) {
          const url = URL.createObjectURL(file);
          restoreVideo(file, url);
          setRestoredSession(true);
        } else {
          router.replace("/");
        }
      });
    } else {
      router.replace("/");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showLogs) logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, showLogs]);

  // Re-split when captionSplit settings change (no re-transcription)
  useEffect(() => {
    if (rawChunks.length > 0) {
      const rebuilt = buildCaptionsFromChunks(rawChunks, captionSplit);
      setCaptions(rebuilt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captionSplit, rawChunks]);

  const log = (level: LogEntry["level"], msg: string) =>
    addLog(setLogs, level, msg);

  const startTranscription = async () => {
    if (!videoFile || processingRef.current) return;
    processingRef.current = true;
    setCaptions([]);
    setRawChunks([]);
    setLogs([]);
    setShowLogs(true);

    try {
      // ── Step 1: Extract audio ──────────────────────────────────────────
      setProgress({ status: "extracting", message: "Loading FFmpeg engine…", currentChunk: 0, totalChunks: 0 });
      log("info", `Video: "${videoFile.name}" (${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`);
      log("info", "Loading FFmpeg.wasm (first load may take ~5s)…");

      let chunks: AudioChunk[] = [];
      try {
        chunks = await extractAndChunkAudio(videoFile, (msg) => {
          setProgress({ message: msg });
          log("info", msg);
        });
      } catch (ffErr) {
        const msg = ffErr instanceof Error ? ffErr.message : String(ffErr);
        log("error", `FFmpeg extraction failed: ${msg}`);
        setProgress({ status: "error", message: "", error: `Audio extraction failed: ${msg}` });
        return;
      }

      log("success", `Audio extracted → ${chunks.length} chunk(s)`);
      chunks.forEach((c, i) =>
        log("info", `  Chunk ${i + 1}: ${c.startTime.toFixed(1)}s – ${c.endTime.toFixed(1)}s  (${(c.data.byteLength / 1024).toFixed(0)} KB)`)
      );

      // ── Step 2: Transcribe each chunk ─────────────────────────────────
      setProgress({
        status: "transcribing",
        message: `Transcribing ${chunks.length} chunk(s)…`,
        currentChunk: 0,
        totalChunks: chunks.length,
      });

      const rawResults: RawChunk[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setProgress({ currentChunk: i + 1, message: `Transcribing chunk ${i + 1} / ${chunks.length}…` });
        log("info", `→ Sending chunk ${i + 1}/${chunks.length} to Sarvam API (model: saaras:v3)…`);

        const blob = new Blob([chunk.data.buffer as ArrayBuffer], { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", blob, `chunk_${i}.wav`);
        formData.append("model", "saaras:v3");

        let transcript = "";
        let words = undefined;

        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          const rawText = await res.text();
          log(res.ok ? "info" : "warn", `  API status: ${res.status} ${res.statusText}`);

          if (res.ok) {
            let data: TranscribeResponse;
            try {
              data = JSON.parse(rawText);
            } catch {
              log("error", `  Failed to parse JSON response: ${rawText.slice(0, 200)}`);
              continue;
            }

            transcript = data.transcript ?? "";
            words = data.timestamps?.words ?? data.word_timestamps;

            log(
              transcript.trim() ? "success" : "warn",
              `  Transcript: ${transcript.trim() ? `"${transcript.slice(0, 120)}${transcript.length > 120 ? "…" : ""}"` : "(empty — no speech detected)"}`
            );
            if (words && words.length > 0) {
              log("info", `  Word timestamps: ${words.length} words received`);
            } else {
              log("info", "  Word timestamps: not available — using proportional timing");
            }
            if (data.language_code) log("info", `  Detected language: ${data.language_code}`);
          } else {
            log("error", `  Sarvam API error response: ${rawText.slice(0, 300)}`);
          }
        } catch (fetchErr) {
          const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          log("error", `  Network error for chunk ${i + 1}: ${msg}`);
        }

        if (transcript.trim()) {
          rawResults.push({
            transcript,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            words,
          });
        }
      }

      // ── Step 3: Store raw + build captions with current split settings ──
      log("info", `Building captions (mode: ${captionSplit.mode}, maxWords: ${captionSplit.maxWords})…`);
      setRawChunks(rawResults);
      const built = buildCaptionsFromChunks(rawResults, captionSplit);
      setCaptions(built);

      if (built.length > 0) {
        log("success", `Done! Generated ${built.length} caption(s).`);
      } else {
        log("warn", "No captions generated. Possible causes: silence, wrong language, API error above.");
      }

      setProgress({
        status: "done",
        message: built.length > 0
          ? `Generated ${built.length} caption(s).`
          : "Done — but no speech was detected. Check the log below.",
        currentChunk: chunks.length,
        totalChunks: chunks.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log("error", `Unhandled error: ${message}`);
      setProgress({ status: "error", message: "", error: message });
    } finally {
      processingRef.current = false;
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isProcessing = progress.status === "extracting" || progress.status === "transcribing";
  const baseName = videoFile?.name.replace(/\.[^/.]+$/, "") ?? "video";

  if (!videoFile || !videoUrl) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0f]">
      {/* Session restored banner */}
      {restoredSession && (
        <div className="bg-violet-500/15 border-b border-violet-500/20 px-6 py-2 flex items-center justify-between text-xs text-violet-300">
          <span>Session restored — your captions and settings were recovered from your last visit.</span>
          <button onClick={() => setRestoredSession(false)} className="text-violet-400/60 hover:text-violet-300 ml-4">✕</button>
        </div>
      )}
      {/* Top nav */}
      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { reset(); router.push("/"); }}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Film className="w-4 h-4" />
            <span className="truncate max-w-xs">{videoFile.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {captions.length > 0 && (
            <>
              <button
                onClick={() => downloadFile(exportSRT(captions), `${baseName}.srt`, "text/plain")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/70 hover:text-white transition-all"
              >
                <Download className="w-3.5 h-3.5" /> SRT
              </button>
              <button
                onClick={() => downloadFile(exportVTT(captions), `${baseName}.vtt`, "text/vtt")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/70 hover:text-white transition-all"
              >
                <Download className="w-3.5 h-3.5" /> VTT
              </button>
            </>
          )}
          <button
            onClick={startTranscription}
            disabled={isProcessing}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
              isProcessing
                ? "bg-violet-500/30 text-violet-400 cursor-not-allowed"
                : captions.length > 0
                ? "bg-white/10 hover:bg-white/15 text-white/80"
                : "bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/20"
            )}
          >
            {isProcessing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isProcessing ? "Processing…" : captions.length > 0 ? "Regenerate" : "Generate Captions"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video + log area */}
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto custom-scroll">
          <div className="w-full max-w-3xl mx-auto">
            <VideoPlayer
              videoUrl={videoUrl}
              captions={captions}
              style={style}
              maxLines={captionSplit.maxLines}
              onCaptionPositionChange={(pos) => updateStyle({ position: pos })}
            />
          </div>

          {/* Progress */}
          {progress.status !== "idle" && (
            <div className="w-full max-w-md mx-auto">
              <ProcessingProgress progress={progress} />
            </div>
          )}

          {/* Empty CTA */}
          {progress.status === "idle" && captions.length === 0 && (
            <p className="text-center text-white/30 text-sm">
              Click <strong className="text-white/50">"Generate Captions"</strong> to auto-transcribe this video
            </p>
          )}

          {/* ── Live Log Panel ─────────────────────────────────────── */}
          {logs.length > 0 && (
            <div className="w-full max-w-3xl mx-auto bg-[#111114] border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowLogs((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Processing Log
                  {isProcessing && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                  <span className="text-white/30">({logs.length} entries)</span>
                </span>
                {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showLogs && (
                <div className="max-h-64 overflow-y-auto custom-scroll font-mono text-xs px-4 py-3 space-y-1 border-t border-white/10">
                  {logs.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-white/20 tabular-nums flex-shrink-0 w-[72px]">
                        {new Date(entry.ts).toLocaleTimeString("en", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span className="flex-shrink-0 mt-px">
                        {entry.level === "success" && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                        {entry.level === "error" && <XCircle className="w-3 h-3 text-red-400" />}
                        {entry.level === "warn" && <span className="text-yellow-400">⚠</span>}
                        {entry.level === "info" && <span className="text-white/30">·</span>}
                      </span>
                      <span
                        className={cn(
                          "leading-relaxed break-all",
                          entry.level === "success" && "text-green-300",
                          entry.level === "error" && "text-red-300",
                          entry.level === "warn" && "text-yellow-300",
                          entry.level === "info" && "text-white/60"
                        )}
                      >
                        {entry.msg}
                      </span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className="w-80 border-l border-white/10 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex border-b border-white/10">
            {(["captions", "style"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                  tab === t
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-white/40 hover:text-white/70"
                )}
              >
                {t === "captions" ? (
                  <><Subtitles className="w-4 h-4" /> Captions</>
                ) : (
                  <><Palette className="w-4 h-4" /> Style</>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scroll">
            {tab === "captions" ? (
              <>
                <CaptionSegmentSettings
                  split={captionSplit}
                  captionCount={captions.length}
                  hasRawChunks={rawChunks.length > 0}
                  onChange={updateCaptionSplit}
                />
                <CaptionList
                  captions={captions}
                  onUpdate={updateCaption}
                  onDelete={deleteCaption}
                  currentTime={currentTime}
                />
              </>
            ) : (
              <CaptionStyler style={style} onChange={updateStyle} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
