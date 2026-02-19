import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "devflow.fm — music for developers",
  description: "Curated music streams for coding. Lo-fi, ambient, synthwave, and more.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} font-mono bg-[#0a0a0a] text-green-400 antialiased`}>
        {children}
      </body>
    </html>
  );
}
