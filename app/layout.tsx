import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sentinel微排版｜公众号 + 小红书排版工作台",
  description:
    "一篇 Markdown 母稿，同时产出公众号富文本与小红书图文海报。智能排版、合规校验、6 套主题、IP 专属配色。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="flex min-h-full flex-col antialiased">
        <AppShell />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
