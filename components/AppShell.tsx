"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "公众号" },
  { href: "/xhs/", label: "小红书" },
];

export default function AppShell() {
  const path = usePathname();
  const isXhs = path.startsWith("/xhs");

  return (
    <header className="sticky top-0 z-50 flex h-[54px] items-center justify-between border-b border-border bg-background px-5">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sentinel-avatar.svg"
          alt="Sentinel"
          className="size-8 rounded-[4px] border border-border"
        />
        <div className="leading-tight">
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-semibold tracking-[0.01em] text-foreground">
              Sentinel微排版
            </span>
            <span className="sw-folio hidden sm:inline">EST. 2026 · SWISS</span>
          </div>
          <div className="sw-folio">公众号 × 小红书 · 双排版工作台</div>
        </div>
      </div>

      <nav className="flex h-full items-stretch text-[13px]">
        {NAV.map((item) => {
          const active = item.href === "/" ? !isXhs : isXhs;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center px-5 transition-colors duration-150",
                active
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
              {active && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-3 bottom-0 h-[2px] bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
