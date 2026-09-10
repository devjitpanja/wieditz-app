import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WiEditz – AI Auto-Captioning",
  description: "Upload a video, get AI-generated captions synced with your speech. Powered by Sarvam AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0d0d0f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
