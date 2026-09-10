"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { loadVideoFromIDB } from "@/lib/persistence";
import { Film, ArrowRight, X, Loader2 } from "lucide-react";

export default function ContinueSession() {
  const { savedVideoName, captions, restoreVideo } = useStore();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Only show if there's a saved session with captions
  useEffect(() => {
    if (savedVideoName && captions.length > 0) {
      setVisible(true);
    }
  }, [savedVideoName, captions.length]);

  if (!visible) return null;

  const handleContinue = async () => {
    setLoading(true);
    try {
      const file = await loadVideoFromIDB();
      if (file) {
        const url = URL.createObjectURL(file);
        restoreVideo(file, url);
        router.push("/editor");
      } else {
        // IDB has no video (e.g. different device/browser) — clear and hide
        setVisible(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
      <Film className="w-4 h-4 text-violet-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 truncate">
          Continue editing <span className="text-violet-300 font-medium">{savedVideoName}</span>
        </p>
        <p className="text-xs text-white/40">{captions.length} caption{captions.length !== 1 ? "s" : ""} saved</p>
      </div>
      <button
        onClick={handleContinue}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-400 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60 flex-shrink-0"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
        {loading ? "Restoring…" : "Continue"}
      </button>
      <button
        onClick={() => setVisible(false)}
        className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
