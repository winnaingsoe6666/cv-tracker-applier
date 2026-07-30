import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareerForge — Job Tracker, Matcher & Applier",
  description:
    "Premium career workstation: ATS scoring, JD matching, tailored cover letters and a conversion-focused application pipeline for TH, MY, SG and remote roles.",
  manifest: "/manifest.json",
  themeColor: "#0f1117",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CareerForge" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))" }} />
        {children}
      </body>
    </html>
  );
}
