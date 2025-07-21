import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Freja AI - Voice Companion",
  description: "Advanced AI voice companion powered by Hume AI for natural conversations",
  keywords: ["AI", "voice", "companion", "Hume AI", "chat", "conversation"],
};

/**
 * Root layout component for the Freja AI application
 * Provides the base HTML structure and font configuration
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-black text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
