"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell() {
  const path = usePathname();
  const isXhs = path.startsWith("/xhs");

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--sw-line)] bg-white px-5">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sentinel-avatar.svg"
          alt="Sentinel"
          className="h-7 w-7 rounded-full"
        />
        <div className="leading-tight">
          <div className="text-[13px] font-bold tracking-[0.02em]">
            Sentinel微排版
          </div>
          <div className="sw-folio">公众号 × 小红书 · 双排版工作台</div>
        </div>
      </div>
      <nav className="flex h-full items-stretch text-sm">
        <Link
          href="/"
          className={`flex items-center border-b-2 px-4 transition ${
            !isXhs
              ? "border-[var(--sw-accent)] font-semibold text-[var(--sw-accent)]"
              : "border-transparent text-[var(--sw-muted)] hover:text-[var(--sw-text)]"
          }`}
        >
          公众号
        </Link>
        <Link
          href="/xhs/"
          className={`flex items-center border-b-2 px-4 transition ${
            isXhs
              ? "border-[var(--sw-accent)] font-semibold text-[var(--sw-accent)]"
              : "border-transparent text-[var(--sw-muted)] hover:text-[var(--sw-text)]"
          }`}
        >
          小红书
        </Link>
      </nav>
    </header>
  );
}
