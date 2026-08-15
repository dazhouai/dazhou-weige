"use client";

import { useEffect, useMemo, useState } from "react";
import type { Poster } from "@/lib/types";
import { DEFAULT_POSTERS, DEFAULT_XHS_PROFILE, KEYS, load } from "@/lib/store";
import { buildPosterHtml, POSTER_CSS } from "@/lib/posters";
import { getTheme } from "@/lib/themes";

export default function PosterExportPage() {
  const [posters, setPosters] = useState<Poster[]>(DEFAULT_POSTERS);
  const [themeId, setThemeId] = useState(DEFAULT_XHS_PROFILE.themeId);

  useEffect(() => {
    const t = setTimeout(() => {
      setPosters(load(KEYS.xhsPosters, DEFAULT_POSTERS));
      const p = load(KEYS.xhsProfile, DEFAULT_XHS_PROFILE);
      setThemeId(p.themeId);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const doc = useMemo(() => buildPosterHtml(posters, theme), [posters, theme]);

  const body = doc
    .replace(/<!doctype html>[\s\S]*?<body>/, "")
    .replace(/<\/body>\s*<\/html>/, "")
    .replace(/<style>[\s\S]*?<\/style>/, "");

  return (
    <div>
      <div className="sticky top-14 z-40 flex items-center justify-between border-b border-[var(--sw-line)] bg-[var(--sw-panel)] px-4 py-2">
        <span className="text-xs text-[var(--sw-muted)]">
          导出预览 · {posters.length} 张 · {theme.name} · 每张 1080×1440（Playwright 以 2x 截图）
        </span>
        <a
          href={`data:text/html;charset=utf-8,${encodeURIComponent(doc)}`}
          download={`sentinel-xhs-${posters.length}cards.html`}
          className="rounded-md bg-[var(--sw-accent)] px-3 py-1 text-xs font-semibold text-black"
        >
          下载海报 HTML
        </a>
      </div>
      <style>{POSTER_CSS}</style>
      <div className="flex flex-col items-center gap-12 px-8 py-10" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}
