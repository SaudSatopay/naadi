import type { Metadata } from "next";
import { Archivo, Fraunces, Spline_Sans_Mono } from "next/font/google";
import CommandK from "@/components/CommandK";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://naadi-kappa.vercel.app"),
  title: {
    default: "NAADI — the financial pulse of MSMEs",
    template: "%s",
  },
  description:
    "AI-native MSME Financial Health Card and agentic underwriting copilot. IDBI Innovate 2026, Track 03.",
  openGraph: {
    title: "NAADI — the financial pulse of MSMEs",
    description:
      "GST · UPI · Account Aggregator · EPFO — fused into an explainable Health Card, a decision, and a memo.",
    url: "https://naadi-kappa.vercel.app",
    siteName: "NAADI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NAADI — the financial pulse of MSMEs",
    description:
      "An AI-native MSME Financial Health Card + agentic underwriting copilot.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${archivo.variable} ${splineMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CommandK />
      </body>
    </html>
  );
}
