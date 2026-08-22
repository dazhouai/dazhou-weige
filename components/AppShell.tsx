"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function AppShell() {
  const [showFollow, setShowFollow] = useState(false);
  const followRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFollow) return;
    function onDocClick(e: MouseEvent) {
      if (followRef.current && !followRef.current.contains(e.target as Node)) {
        setShowFollow(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setShowFollow(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showFollow]);

  return (
    <header className="sticky top-0 z-50 flex h-[64px] items-center justify-between border-b border-[var(--sw-line)] bg-[var(--sw-panel)]/95 px-4 backdrop-blur lg:px-6">
      {/* 左侧：文字 Logo + 副标题 */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="大洲微格"
          className="size-12 shrink-0 rounded-lg object-contain"
        />
        <div className="leading-tight">
          <h1 className="bg-gradient-to-r from-[var(--sw-accent)] via-[#c2410c] to-[var(--sw-accent)] bg-clip-text text-[22px] font-extrabold leading-none tracking-tight text-transparent">
            大洲微格
          </h1>
          <div className="mt-2 sw-folio">把排版交给工具，把时间留给内容</div>
        </div>
      </div>

      {/* 右侧：关注公众号入口（常驻） */}
      <div className="relative" ref={followRef}>
        <button
          type="button"
          onClick={() => setShowFollow((v) => !v)}
          className={cn(
            "group flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-all",
            showFollow
              ? "border-[var(--sw-accent)] bg-[var(--sw-accent)] text-[var(--sw-on-accent)] shadow-md"
              : "border-[var(--sw-line)] bg-gradient-to-r from-amber-50 to-orange-50 text-[var(--sw-text)] hover:border-[var(--sw-accent)] hover:shadow-sm"
          )}
          aria-label="点击关注公众号 跟着大洲学AI"
        >
          <span className="text-base leading-none">📮</span>
          <span>点击关注公众号</span>
          <span className="hidden text-[var(--sw-accent-ink)] sm:inline">· 跟着大洲学AI</span>
        </button>

        {showFollow && (
          <div
            role="dialog"
            aria-label="公众号二维码"
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[300px] overflow-hidden rounded-xl border border-[var(--sw-line)] bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="h-1.5 bg-gradient-to-r from-[var(--sw-accent)] via-[#c2410c] to-amber-400" />
            <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 px-5 pt-5 pb-3 text-center">
              <div className="text-[11px] font-medium tracking-[0.18em] text-[var(--sw-muted)] uppercase">
                FOLLOW THE OFFICIAL ACCOUNT
              </div>
              <div className="mt-1 text-[16px] font-bold text-[var(--sw-text)]">
                跟着大洲学AI
              </div>
              <div className="mt-1 text-[12px] leading-relaxed text-[var(--sw-muted)]">
                长按 / 扫码关注<br />
                获取更多 AI 实战教程与排版技巧
              </div>
            </div>
            <div className="px-5 pb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/qrcode-follow.jpg"
                alt="公众号二维码 跟着大洲学AI"
                className="mx-auto h-48 w-48 rounded-lg border border-[var(--sw-line)] bg-white p-2"
              />
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[var(--sw-muted)]">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                已更新 200+ 篇 AI 实战笔记
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}