import { NextRequest, NextResponse } from "next/server";

const SARVAM_API_URL = "https://api.sarvam.ai/speech-to-text";
const SARVAM_API_KEY = process.env.SARVAM_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as File | null;
    const model = (formData.get("model") as string) || "saaras:v3";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (!SARVAM_API_KEY) {
      return NextResponse.json({ error: "Sarvam API key not configured" }, { status: 500 });
    }

    const sarvamForm = new FormData();
    sarvamForm.append("file", audioFile, "audio.wav");
    sarvamForm.append("model", model);
    sarvamForm.append("mode", "transcribe");
    sarvamForm.append("with_timestamps", "true");

    const response = await fetch(SARVAM_API_URL, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: sarvamForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Sarvam API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Transcribe route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
