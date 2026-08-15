"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell() {
  const path = usePathname();
  const isXhs = path.startsWith("/xhs");

  return (
    <header className="sticky top-0 z-50 flex h-[54px] items-center justify-between border-b border-[var(--sw-line)] bg-white px-5">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sentinel-avatar.svg"
          alt="Sentinel"
          className="h-[30px] w-[30px] rounded-sm border border-[var(--sw-line-strong)]"
        />
        <div className="leading-tight">
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-bold tracking-[0.01em]">
              Sentinel微排版
            </span>
            <span className="sw-folio hidden sm:inline">EST. 2026 · SWISS</span>
          </div>
          <div className="sw-folio">公众号 × 小红书 · 双排版工作台</div>
        </div>
      </div>
      <nav className="flex h-full items-stretch text-[13px]">
        <Link
          href="/"
          className={`flex items-center border-b-[2px] px-5 transition-colors duration-150 ${
            !isXhs
              ? "border-[var(--sw-accent)] font-semibold text-[var(--sw-accent)]"
              : "border-transparent text-[var(--sw-muted)] hover:text-[var(--sw-text)]"
          }`}
        >
          公众号
        </Link>
        <Link
          href="/xhs/"
          className={`flex items-center border-b-[2px] px-5 transition-colors duration-150 ${
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
