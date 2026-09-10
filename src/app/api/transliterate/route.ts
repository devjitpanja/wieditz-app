import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SARVAM_API_KEY not configured" }, { status: 500 });
  }

  let texts: string[];
  let sourceLanguage: string;
  try {
    const body = await req.json();
    texts = body.texts;
    sourceLanguage = body.sourceLanguage ?? "hi-IN";
    if (!Array.isArray(texts)) throw new Error("texts must be an array");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Process in parallel, fall back to original text on any per-item error
  const results = await Promise.all(
    texts.map(async (text) => {
      if (!text || !text.trim()) return text;
      try {
        const res = await fetch("https://api.sarvam.ai/transliterate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": apiKey,
          },
          body: JSON.stringify({
            input: text,
            source_language_code: sourceLanguage,
            target_language_code: "en-IN",
            numerals_format: "international",
          }),
        });

        if (!res.ok) return text;
        const data = await res.json();
        return (data.transliterated_text as string) ?? text;
      } catch {
        return text;
      }
    })
  );

  return NextResponse.json({ results });
}
