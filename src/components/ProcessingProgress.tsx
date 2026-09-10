"use client";

import { Loader2, CheckCircle2, AlertCircle, Wand2 } from "lucide-react";
import { ProcessingProgress as ProgressType } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  progress: ProgressType;
}

export default function ProcessingProgress({ progress }: Props) {
  const pct =
    progress.totalChunks > 0
      ? Math.round((progress.currentChunk / progress.totalChunks) * 100)
      : 0;

  const steps = [
    { label: "Extract Audio", key: "extracting" },
    { label: "Transcribe", key: "transcribing" },
    { label: "Done", key: "done" },
  ];

  const statusIndex = {
    idle: -1,
    extracting: 0,
    transcribing: 1,
    done: 2,
    error: -1,
  }[progress.status];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Steps */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, i) => {
          const done = i < statusIndex;
          const active = i === statusIndex;
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                    done && "bg-violet-500 text-white",
                    active && "bg-violet-500/20 border-2 border-violet-500 text-violet-400",
                    !done && !active && "bg-white/10 text-white/30"
                  )}
                >
                  {done || (active && step.key === "done") ? <CheckCircle2 className="w-4 h-4" /> : active ? <Loader2 className="w-4 h-4 animate-spin" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs",
                    done || active ? "text-white/80" : "text-white/30"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mx-3 mb-5 transition-colors",
                    i < statusIndex ? "bg-violet-500" : "bg-white/10"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar (shown during transcribing) */}
      {progress.status === "transcribing" && progress.totalChunks > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/50 mb-1.5">
            <span>
              Chunk {progress.currentChunk} of {progress.totalChunks}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Status message */}
      <div
        className={cn(
          "flex items-center gap-2 text-sm px-4 py-3 rounded-xl",
          progress.status === "error"
            ? "bg-red-500/10 text-red-400"
            : progress.status === "done"
            ? "bg-green-500/10 text-green-400"
            : "bg-white/5 text-white/60"
        )}
      >
        {progress.status === "error" && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
        {progress.status === "done" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
        {progress.status !== "error" && progress.status !== "done" && (
          <Wand2 className="w-4 h-4 flex-shrink-0 animate-pulse" />
        )}
        <span>{progress.error ?? progress.message}</span>
      </div>
    </div>
  );
}
