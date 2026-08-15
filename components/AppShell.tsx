"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell() {
  const path = usePathname();
  const isXhs = path.startsWith("/xhs");

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--sw-line)] bg-[var(--sw-bg)]/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sentinel-avatar.svg"
          alt="Sentinel"
          className="h-8 w-8 rounded-full ring-1 ring-[var(--sw-line)]"
        />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide">
            Sentinel微排版
          </div>
          <div className="text-[10px] text-[var(--sw-muted)]">
            公众号 × 小红书 · 双排版工作台
          </div>
        </div>
      </div>
      <nav className="flex items-center gap-1 rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel)] p-1 text-sm">
        <Link
          href="/"
          className={`rounded-md px-3 py-1.5 transition hover:text-white ${
            !isXhs
              ? "bg-[var(--sw-panel-2)] text-white"
              : "text-[var(--sw-muted)]"
          }`}
        >
          公众号
        </Link>
        <Link
          href="/xhs/"
          className={`rounded-md px-3 py-1.5 transition hover:text-white ${
            isXhs
              ? "bg-[var(--sw-panel-2)] text-white"
              : "text-[var(--sw-muted)]"
          }`}
        >
          小红书
        </Link>
      </nav>
    </header>
  );
}
