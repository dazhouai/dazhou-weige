import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "大洲微格 · 公众号智能排版工作台",
  description:
    "不注册、不联网、不上传的公众号智能排版工具。一篇 Markdown 母稿，一键产出合规 HTML，3 分钟搞定排版。",
  keywords: [
    "公众号排版",
    "公众号工具",
    "Markdown",
    "排版工具",
    "AI 工具",
    "大洲微格",
    "跟着大洲学AI",
  ],
  openGraph: {
    title: "大洲微格 · 公众号智能排版工作台",
    description:
      "不注册、不联网、不上传，3 分钟搞定一篇公众号。",
    type: "website",
    locale: "zh_CN",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col antialiased lg:h-screen lg:overflow-hidden">
        <AppShell />
        <main className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">{children}</main>
        <Footer />
        <Toaster theme="light" position="bottom-center" />
      </body>
    </html>
  );
}