"use client";

import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import type { Poster } from "@/lib/types";
import { DEFAULT_POSTERS, DEFAULT_XHS_PROFILE, KEYS, load } from "@/lib/store";
import { buildPosterHtml, posterFileName, POSTER_CSS, renderPoster } from "@/lib/posters";
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

  const [busy, setBusy] = useState<string | null>(null);

  const capturePoster = async (el: HTMLElement) => {
    try {
      return await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
    } catch {
      return null;
    }
  };

  const saveCanvas = (canvas: HTMLCanvasElement, name: string) => {
    const a = document.createElement("a");
    a.download = name;
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadOne = async (i: number, kind?: string) => {
    setBusy(`正在导出第 ${i + 1} 张…`);
    const el = document.querySelectorAll<HTMLElement>(".poster.xhs")[i];
    if (!el) return;
    const canvas = await capturePoster(el);
    if (canvas) saveCanvas(canvas, posterFileName(i, kind || el.dataset.kind || "poster"));
    else alert("导出失败：海报可能含外链图片，建议改用 Playwright 脚本。");
    setBusy(null);
  };

  const downloadAll = async () => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".poster.xhs"));
    for (let i = 0; i < els.length; i++) {
      setBusy(`正在导出 ${i + 1}/${els.length} …`);
      const canvas = await capturePoster(els[i]);
      if (canvas) saveCanvas(canvas, posterFileName(i, els[i].dataset.kind));
      await new Promise((r) => setTimeout(r, 350));
    }
    setBusy(null);
  };

  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const doc = useMemo(() => buildPosterHtml(posters, theme), [posters, theme]);

  return (
    <div>
      <div className="sticky top-14 z-40 flex items-center justify-between border-b border-[var(--sw-line)] bg-[var(--sw-panel)] px-4 py-2">
        <span className="text-xs text-[var(--sw-muted)]">
          导出预览 · {posters.length} 张 · {theme.name} · 每张 1080×1440（Playwright 以 2x 截图）
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadAll}
            disabled={busy !== null}
            className="rounded-sm bg-[var(--sw-accent)] px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy || "下载全部 PNG"}
          </button>
          <a
            href={`data:text/html;charset=utf-8,${encodeURIComponent(doc)}`}
            download={`sentinel-xhs-${posters.length}cards.html`}
            className="rounded-sm border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-3 py-1 text-xs text-[var(--sw-text)]"
          >
            下载海报 HTML
          </a>
        </div>
      </div>
      <style>{POSTER_CSS}</style>
      <div className="flex flex-col items-center gap-12 px-8 py-10">
        {posters.map((p, i) => (
          <div key={p.id} className="relative">
            <div dangerouslySetInnerHTML={{ __html: renderPoster(p) }} />
            <button
              onClick={() => downloadOne(i, p.kind)}
              disabled={busy !== null}
              className="mt-3 w-full rounded-sm border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-3 py-1.5 text-xs text-[var(--sw-text)] hover:border-[var(--sw-accent)] disabled:opacity-50"
            >
              下载此张 PNG
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
