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
  metadataBase: new URL("https://pdfconvert-web.vercel.app"),
  title: "여행가J의 PPT, PDF convert",
  description:
    "Claude · Gemini · GPT 골라서. PPT·PDF 를 마크다운으로 변환하는 무료 오픈소스 웹서비스. BYO API Key, 클라이언트 사이드 처리.",
  keywords: [
    "PDF to Markdown",
    "PDF 마크다운 변환",
    "PPTX 마크다운",
    "Claude Vision",
    "Gemini OCR",
    "GPT-4o PDF",
    "무료 PDF 변환",
    "여행가J",
  ],
  authors: [{ name: "여행가J", url: "https://litt.ly/jkwon" }],
  openGraph: {
    title: "여행가J의 PPT, PDF convert",
    description: "PPT, PDF를 마크다운으로. Claude · Gemini · GPT. 무료 · 오픈소스.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "여행가J의 PPT, PDF convert",
    description: "PPT, PDF를 마크다운으로. Claude · Gemini · GPT. 무료 · 오픈소스.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
