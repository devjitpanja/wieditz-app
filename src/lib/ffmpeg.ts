"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loaded = false;

export async function loadFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  if (ffmpeg && loaded) return ffmpeg;

  ffmpeg = new FFmpeg();

  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  loaded = true;
  return ffmpeg;
}

export interface AudioChunk {
  data: Uint8Array;
  startTime: number;
  endTime: number;
  index: number;
}

const CHUNK_DURATION = 25; // seconds per chunk (Sarvam REST limit is 30s)

export async function extractAndChunkAudio(
  videoFile: File,
  onProgress?: (msg: string, pct: number) => void
): Promise<AudioChunk[]> {
  const ff = await loadFFmpeg((p) => onProgress?.(`Loading FFmpeg… ${p}%`, p * 0.2));

  onProgress?.("Extracting audio from video…", 20);

  // Write the video file into FFmpeg's virtual FS
  await ff.writeFile("input.mp4", await fetchFile(videoFile));

  // Get video duration by extracting audio to a temp WAV and checking its length
  // We'll extract full audio first, then split it
  await ff.exec([
    "-i", "input.mp4",
    "-vn",                    // no video
    "-acodec", "pcm_s16le",   // 16-bit PCM
    "-ar", "16000",           // 16kHz sample rate
    "-ac", "1",               // mono
    "full_audio.wav",
  ]);

  onProgress?.("Splitting audio into chunks…", 40);

  // Get duration from the extracted WAV using ffprobe-style approach
  // We'll compute duration from file size: bytes / (16000 * 2) = seconds
  const fullAudioData = await ff.readFile("full_audio.wav") as Uint8Array;

  // WAV header is 44 bytes; data = total - 44 bytes; duration = data / (sampleRate * channels * bytesPerSample)
  const dataSizeBytes = fullAudioData.length - 44;
  const sampleRate = 16000;
  const bytesPerSample = 2;
  const channels = 1;
  const totalDuration = dataSizeBytes / (sampleRate * channels * bytesPerSample);

  const numChunks = Math.ceil(totalDuration / CHUNK_DURATION);
  const chunks: AudioChunk[] = [];

  for (let i = 0; i < numChunks; i++) {
    const startTime = i * CHUNK_DURATION;
    const endTime = Math.min(startTime + CHUNK_DURATION, totalDuration);
    const chunkFile = `chunk_${i}.wav`;

    await ff.exec([
      "-i", "full_audio.wav",
      "-ss", String(startTime),
      "-to", String(endTime),
      "-acodec", "pcm_s16le",
      "-ar", "16000",
      "-ac", "1",
      chunkFile,
    ]);

    const chunkData = await ff.readFile(chunkFile) as Uint8Array;
    chunks.push({ data: chunkData, startTime, endTime, index: i });

    const pct = 40 + Math.round(((i + 1) / numChunks) * 50);
    onProgress?.(
      `Split chunk ${i + 1} of ${numChunks} (${startTime.toFixed(1)}s – ${endTime.toFixed(1)}s)`,
      pct
    );

    // Clean up chunk file
    await ff.deleteFile(chunkFile);
  }

  // Clean up
  await ff.deleteFile("input.mp4");
  await ff.deleteFile("full_audio.wav");

  return chunks;
}
