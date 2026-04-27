import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jyotish Darshan — AI Vedic Kundli",
  description: "Generate and interpret your Vedic birth chart with AI-powered Jyotish analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
