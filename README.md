# WiEditz — AI Auto-Captioning for Videos

WiEditz is a browser-based video captioning tool powered by **Sarvam AI**'s speech-to-text engine. Upload any video, get accurate captions in seconds, edit them in a timeline editor, and export a captioned video or subtitle file — all without uploading your video to any server.

---

## Features

- **Automatic transcription** — powered by Sarvam `saaras:v3`, optimized for Indian languages
- **Multi-language support** — Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, Marathi, Gujarati, Odia, Punjabi, and English
- **Hinglish transliteration** — converts Devanagari text to Roman script
- **Client-side audio extraction** — FFmpeg.wasm processes audio entirely in your browser; your video never leaves your device
- **Timeline editor** — edit caption text, timing, and styling directly
- **Export options** — render a captioned video (MP4), or download subtitles as `.srt` or `.vtt`
- **Session persistence** — your work is saved in the browser so you can pick up where you left off

---

## Getting a Sarvam AI API Key

WiEditz uses the [Sarvam AI](https://www.sarvam.ai/) API for speech-to-text transcription. You need your own API key to run the app.

1. Go to [https://www.sarvam.ai/](https://www.sarvam.ai/) and create a free account
2. Navigate to the **API Keys** section in your dashboard
3. Generate a new API key and copy it

---

## Setup

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm

### Installation

```bash
git clone https://github.com/devjitpanja/wieditz-app.git
cd wieditz-app
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then open `.env.local` and add your Sarvam AI API key:

```env
SARVAM_API_KEY=your_sarvam_api_key_here
```

> **Important:** Never commit your `.env.local` file. It is already listed in `.gitignore`.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

---

## Deployment

When deploying (e.g., to [Vercel](https://vercel.com/)), set `SARVAM_API_KEY` as an environment variable in your hosting provider's dashboard — do not hardcode it or commit it to the repository.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 |
| Audio/Video processing | FFmpeg.wasm (client-side) |
| Speech-to-text | Sarvam AI `saaras:v3` |
| UI primitives | Radix UI, Lucide React |

---

## License

MIT
