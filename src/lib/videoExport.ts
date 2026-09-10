import { CaptionEntry, CaptionStyle } from "@/types";

export async function exportVideoWithCaptions(
  videoUrl: string,
  captions: CaptionEntry[],
  style: CaptionStyle,
  onProgress: (pct: number) => void
): Promise<Blob> {
  if (typeof window === "undefined") throw new Error("Must run in browser");

  const video = document.createElement("video");
  video.src = videoUrl;
  video.preload = "auto";
  video.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Video failed to load for export"));
  });

  const { videoWidth, videoHeight, duration } = video;
  const w = videoWidth || 1280;
  const h = videoHeight || 720;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: false })!;

  // Build stream: canvas video track + original audio track
  const canvasStream = canvas.captureStream(30);
  try {
    // captureStream on <video> gives us the audio track
    const videoStream: MediaStream | undefined =
      (video as unknown as { captureStream?: () => MediaStream }).captureStream?.() ??
      (video as unknown as { mozCaptureStream?: () => MediaStream }).mozCaptureStream?.();
    if (videoStream) {
      for (const track of videoStream.getAudioTracks()) {
        canvasStream.addTrack(track);
      }
    }
  } catch {
    // Audio capture not available; exported video will be silent
  }

  const mimeType =
    ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported(m)
    ) ?? "video/webm";

  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    recorder.onerror = () => reject(new Error("MediaRecorder error"));

    recorder.start(200);

    let rafId: number;

    const drawFrame = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, w, h);
      drawCaptionOnCanvas(ctx, video.currentTime, captions, style, w, h);
      onProgress(Math.min(1, video.currentTime / duration));
      rafId = requestAnimationFrame(drawFrame);
    };

    video.onplay = () => {
      rafId = requestAnimationFrame(drawFrame);
    };

    video.onended = () => {
      cancelAnimationFrame(rafId);
      // Draw final frame
      ctx.drawImage(video, 0, 0, w, h);
      setTimeout(() => recorder.stop(), 300);
    };

    video.onerror = () => {
      cancelAnimationFrame(rafId);
      reject(new Error("Video playback error during export"));
    };

    video.play().catch(reject);
  });
}

function drawCaptionOnCanvas(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  captions: CaptionEntry[],
  style: CaptionStyle,
  w: number,
  h: number
) {
  const cap = captions.find((c) => currentTime >= c.start && currentTime <= c.end);
  if (!cap || !cap.text.trim()) return;

  // Scale font relative to a 1920-wide reference frame
  const scale = w / 1920;
  const fontSize = Math.round(style.fontSize * scale * 3);
  const fontParts = [
    style.bold ? "bold" : "",
    style.italic ? "italic" : "",
    `${fontSize}px`,
    style.fontFamily.split(",")[0].trim().replace(/['"]/g, "") || "sans-serif",
  ]
    .filter(Boolean)
    .join(" ");

  ctx.save();
  ctx.font = fontParts;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const x = (style.position.x / 100) * w;
  const y = (style.position.y / 100) * h;
  const padding = fontSize * 0.45;

  const lines = cap.text.split("\n");
  const lineHeight = fontSize * 1.35;
  const totalTextH = lines.length * lineHeight;
  const maxLineW = Math.max(...lines.map((l) => ctx.measureText(l).width));

  // Background
  if (style.backgroundOpacity > 0) {
    ctx.globalAlpha = style.backgroundOpacity;
    ctx.fillStyle = style.backgroundColor;
    const bgW = maxLineW + padding * 2;
    const bgH = totalTextH + padding * 0.8;
    const r = Math.min(8 * scale, bgH / 2);
    roundedRect(ctx, x - bgW / 2, y - bgH / 2, bgW, bgH, r);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Text shadow
  if (style.textShadow) {
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = fontSize * 0.15;
    ctx.shadowOffsetX = fontSize * 0.05;
    ctx.shadowOffsetY = fontSize * 0.05;
  }

  ctx.fillStyle = style.color;
  lines.forEach((line, i) => {
    const lineY = y - totalTextH / 2 + i * lineHeight + lineHeight / 2;
    ctx.fillText(line, x, lineY);
  });

  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
