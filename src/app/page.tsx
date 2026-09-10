import VideoUpload from "@/components/VideoUpload";
import ContinueSession from "@/components/ContinueSession";
import { Captions, Zap, Globe } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3 h-3" />
          Powered by Sarvam AI
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          Wi<span className="text-violet-400">Editz</span>
        </h1>
        <p className="text-lg text-white/50 max-w-md mx-auto leading-relaxed">
          Drop your video and get perfectly synced captions in seconds. No editing required.
        </p>
      </div>

      {/* Upload */}
      <VideoUpload />

      {/* Resume previous session if available */}
      <ContinueSession />

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
        {[
          {
            icon: Zap,
            title: "Instant Transcription",
            desc: "Client-side audio extraction + Sarvam STT for fast, accurate results",
          },
          {
            icon: Captions,
            title: "Synced Captions",
            desc: "Every caption aligned to speech timing, frame-perfect overlay",
          },
          {
            icon: Globe,
            title: "Indian Language Support",
            desc: "Hindi, Tamil, Telugu, Bengali & more — Sarvam is built for India",
          },
        ].map((f) => (
          <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <f.icon className="w-5 h-5 text-violet-400 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
