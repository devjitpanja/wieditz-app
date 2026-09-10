"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Film, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { saveVideoToIDB } from "@/lib/persistence";

const ACCEPTED_TYPES = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
  "video/x-matroska": [".mkv"],
};

const MAX_SIZE_MB = 500;

export default function VideoUpload() {
  const { setVideo } = useStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File too large. Max size is ${MAX_SIZE_MB}MB.`);
        return;
      }

      const url = URL.createObjectURL(file);
      setVideo(file, url);
      // Persist video to IndexedDB for session recovery on refresh
      saveVideoToIDB(file).catch(() => {});
      router.push("/editor");
    },
    [setVideo, router]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    onDropRejected: (files) => {
      const err = files[0]?.errors[0];
      if (err?.code === "file-invalid-type") setError("Unsupported format. Use MP4, WebM, MOV, AVI, or MKV.");
      else if (err?.code === "too-many-files") setError("Please upload one video at a time.");
      else setError("Could not accept file.");
    },
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200",
          "hover:border-violet-500 hover:bg-violet-500/5",
          isDragActive && !isDragReject && "border-violet-500 bg-violet-500/10 scale-[1.01]",
          isDragReject && "border-red-500 bg-red-500/10",
          !isDragActive && "border-white/20 bg-white/5"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-5">
          <div
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center transition-colors",
              isDragActive && !isDragReject ? "bg-violet-500/20" : "bg-white/10"
            )}
          >
            {isDragActive && !isDragReject ? (
              <Film className="w-10 h-10 text-violet-400" />
            ) : (
              <Upload className="w-10 h-10 text-white/60" />
            )}
          </div>

          <div>
            <p className="text-xl font-semibold text-white mb-2">
              {isDragActive && !isDragReject
                ? "Drop your video here"
                : "Drop your video here"}
            </p>
            <p className="text-white/50 text-sm">
              or{" "}
              <span className="text-violet-400 underline underline-offset-2">
                browse your files
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/30">
            <span>MP4</span>
            <span>·</span>
            <span>WebM</span>
            <span>·</span>
            <span>MOV</span>
            <span>·</span>
            <span>AVI</span>
            <span>·</span>
            <span>MKV</span>
            <span>·</span>
            <span>Up to {MAX_SIZE_MB}MB</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
