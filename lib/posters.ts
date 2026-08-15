import type { Poster, ThemeManifest } from "./types";
import { esc } from "./htmlSafe";
import { html2canvasBase64 } from "./vendor/html2canvasBase64";

export const POSTER_CAPTURE_SCRIPT = `
(function () {
  var ready = false;
  try {
    eval(atob("${html2canvasBase64}"));
    ready = typeof window.html2canvas === "function";
  } catch (e) { console.error("html2canvas 加载失败", e); }
  function captureEl(el) {
    return new Promise(function (resolve) {
      if (!ready) { alert("截图引擎加载失败，请改用 Playwright 脚本导出。"); resolve(null); return; }
      try {
        window.html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false })
          .then(resolve)
          .catch(function () { resolve(null); });
      } catch (e) {
        resolve(null);
      }
    });
  }
  function downloadCanvas(canvas, name) {
    var a = document.createElement("a");
    a.download = name;
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function posterName(i, kind) {
    var idx = String(i + 1);
    while (idx.length < 2) idx = "0" + idx;
    return "xhs-" + idx + "-" + (kind || "poster") + ".png";
  }
  window.__sentinelCapture = {
    captureEl: captureEl,
    async download(i, kind) {
      var el = document.querySelectorAll(".poster.xhs")[i];
      if (!el) return;
      var canvas = await captureEl(el);
      if (!canvas) {
        alert("下载失败：海报可能包含外链图片，浏览器安全限制无法导出。请改用 npm run xhs:cards 脚本。");
        return;
      }
      downloadCanvas(canvas, posterName(i, kind || el.getAttribute("data-kind") || "poster"));
    },
    async downloadAll() {
      var els = document.querySelectorAll(".poster.xhs");
      for (var i = 0; i < els.length; i++) {
        var canvas = await captureEl(els[i]);
        if (!canvas) {
          alert("第 " + (i + 1) + " 张下载失败：可能含外链图片，请改用 Playwright 脚本。");
          continue;
        }
        downloadCanvas(canvas, posterName(i, els[i].getAttribute("data-kind") || "poster"));
        await new Promise(function (r) { setTimeout(r, 350); });
      }
    }
  };
  // 生成顶部下载工具栏
  var bar = document.createElement("div");
  bar.setAttribute("style",
    "position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;gap:8px;flex-wrap:wrap;" +
    "padding:10px 16px;background:#0f1115;color:#e8eaee;font-family:-apple-system,'PingFang SC',sans-serif;font-size:13px;" +
    "box-shadow:0 2px 12px rgba(0,0,0,.35);");
  var btnStyle =
    "border:1px solid #2a2f3a;background:#1d212b;color:#e8eaee;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:13px;";
  var primary = document.createElement("button");
  primary.textContent = "下载全部 PNG";
  primary.setAttribute("style", btnStyle + "background:#5eead4;color:#0b1220;border-color:transparent;font-weight:600;");
  primary.onclick = function () { window.__sentinelCapture.downloadAll(); };
  bar.appendChild(primary);
  var posters = document.querySelectorAll(".poster.xhs");
  for (var j = 0; j < posters.length; j++) {
    (function (idx) {
      var kind = posters[idx].getAttribute("data-kind") || "poster";
      var names = {
        cover: "封面", data: "数据", shift: "痛点", workspace: "方法",
        workflow: "流程", principle: "心法", division: "对比",
        reflection: "避坑", end: "尾卡"
      };
      var b = document.createElement("button");
      b.textContent = (idx + 1) + " " + (names[kind] || kind);
      b.setAttribute("style", btnStyle);
      b.onclick = function () { window.__sentinelCapture.download(idx, kind); };
      bar.appendChild(b);
    })(j);
  }
  document.body.appendChild(bar);
  document.body.style.paddingTop = "72px";
})();
`;

export const POSTER_CSS = `
  :root {
    --paper: #fafaf8;
    --ink: #0a0a0a;
    --grey-1: #f0f0ee;
    --grey-2: #d4d4d2;
    --grey-3: #737373;
    --accent: #059669;
    --accent-on: #ffffff;
    --sans: "Helvetica Neue", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    --sans-zh: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sp-3: 8px; --sp-4: 12px; --sp-5: 16px; --sp-6: 24px; --sp-7: 32px;
    --sp-8: 40px; --sp-9: 48px; --sp-10: 64px; --sp-11: 80px; --sp-12: 96px; --sp-13: 160px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #1a1a1a; font-family: var(--sans); -webkit-font-smoothing: antialiased; }
  .poster { position: relative; background: var(--paper); color: var(--ink); overflow: hidden; }
  .poster.xhs { width: 1080px; height: 1440px; }
  .poster.square { width: 1080px; height: 1080px; }
  .poster.wide { width: 2100px; height: 900px; }
  .poster .content { padding: var(--sp-12) var(--sp-11); height: 100%; display: flex; flex-direction: column; }
  .poster.xhs .content { padding: var(--sp-10) var(--sp-9); }
  .stack { display: flex; flex-direction: column; }
  .row { display: flex; flex-direction: row; align-items: center; }
  .gap-3 { gap: var(--sp-3); } .gap-4 { gap: var(--sp-4); } .gap-5 { gap: var(--sp-5); }
  .gap-6 { gap: var(--sp-6); } .gap-7 { gap: var(--sp-7); } .gap-8 { gap: var(--sp-8); }
  .gap-9 { gap: var(--sp-9); } .gap-10 { gap: var(--sp-10); }
  .grow { flex: 1; }
  .center { text-align: center; }
  .right { text-align: right; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-6); }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--sp-7); }
  .h-hero { font-family: var(--sans); font-weight: 200; font-size: 240px; line-height: 1.02; letter-spacing: -0.02em; color: var(--ink); }
  .h-statement { font-family: var(--sans); font-weight: 200; font-size: 180px; line-height: 1.05; letter-spacing: -0.015em; color: var(--ink); }
  .h-xl { font-family: var(--sans); font-weight: 300; font-size: 120px; line-height: 1.12; letter-spacing: -0.01em; color: var(--ink); }
  .h-md { font-family: var(--sans); font-weight: 400; font-size: 56px; line-height: 1.18; color: var(--ink); }
  .lead { font-family: var(--sans-zh); font-weight: 400; font-size: 30px; line-height: 1.55; color: var(--ink); }
  .body { font-family: var(--sans-zh); font-weight: 400; font-size: 26px; line-height: 1.6; color: var(--ink); }
  .t-cat { font-family: var(--sans); font-weight: 600; font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
  .t-meta { font-family: var(--mono); font-weight: 500; font-size: 20px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--grey-3); }
  .num-mega { font-family: var(--sans); font-weight: 200; font-size: 200px; line-height: 0.92; letter-spacing: -0.03em; color: var(--ink); }
  .num-xl { font-family: var(--sans); font-weight: 200; font-size: 144px; line-height: 0.96; letter-spacing: -0.02em; color: var(--ink); }
  .poster.xhs .h-hero { font-size: 168px; }
  .poster.xhs .h-statement { font-size: 124px; }
  .poster.xhs .h-xl { font-size: 92px; }
  .poster.xhs .num-mega { font-size: 150px; }
  .poster.xhs .num-xl { font-size: 110px; }
  .hr-accent { height: 3px; background: var(--accent); border: 0; width: 96px; }
  .hr-hairline { height: 1px; background: var(--grey-2); border: 0; }
  .card-ink { background: var(--ink); color: var(--paper); padding: var(--sp-8); }
  .card-ink .lead, .card-ink .body, .card-ink .t-meta, .card-ink .t-cat { color: var(--paper); }
  .card-accent { background: var(--accent); color: var(--accent-on); padding: var(--sp-8); }
  .card-accent .lead, .card-accent .body, .card-accent .t-meta, .card-accent .t-cat { color: var(--accent-on); }
  .card-fill { background: var(--grey-1); padding: var(--sp-7); }
  .card-outlined { border: 1px solid var(--grey-2); padding: var(--sp-7); }
  .tag-chip { display: inline-block; background: var(--grey-1); color: var(--ink); border-radius: 999px; padding: 10px 22px; font-size: 22px; font-family: var(--sans-zh); }
  .tag-chip.is-accent { background: var(--accent); color: var(--accent-on); }
  .step-row { display: flex; flex-direction: row; align-items: flex-start; gap: var(--sp-6); }
  .step-no { font-family: var(--sans); font-weight: 200; font-size: 88px; line-height: 0.95; color: var(--accent); min-width: 110px; }
  .step-t { font-family: var(--sans-zh); font-weight: 600; font-size: 30px; color: var(--ink); }
  .step-d { font-family: var(--sans-zh); font-weight: 400; font-size: 24px; line-height: 1.5; color: var(--grey-3); margin-top: 6px; }
  .matrix-cell { border: 1px solid var(--grey-2); padding: var(--sp-6); }
  .matrix-cell.is-accent { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, white); }
  .cell-title { font-family: var(--sans-zh); font-weight: 600; font-size: 28px; color: var(--ink); }
  .cell-nb { font-family: var(--sans-zh); font-weight: 400; font-size: 24px; line-height: 1.5; color: var(--grey-3); margin-top: 8px; }
  .chrome-min { display: flex; flex-direction: row; align-items: center; gap: var(--sp-4); padding-bottom: var(--sp-5); border-bottom: 1px solid var(--grey-2); }
  .poster-foot { padding-top: var(--sp-5); border-top: 1px solid var(--grey-2); display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
  .poster-foot .t-meta { font-size: 18px; }
  .swipe-hint { color: var(--grey-3); }
  .fit-row { display: flex; flex-direction: row; align-items: flex-start; gap: var(--sp-4); }
  .fit-mark { color: var(--accent); font-weight: 700; }
  .fit-mark.no { color: var(--grey-3); }
`;

function chromeHeader(tag?: string, meta?: string): string {
  const left = tag ? `<span class="t-cat">${esc(tag)}</span>` : "";
  const right = meta ? `<span class="t-meta grow right">${esc(meta)}</span>` : "";
  return left || right ? `<div class="chrome-min">${left}${right}</div>` : "";
}

function foot(footer?: string, extra?: string): string {
  if (!footer && !extra) return "";
  return `<div class="poster-foot"><span class="t-meta">${esc(extra || "")}</span><span class="t-meta">${esc(footer || "")}</span></div>`;
}

function lines(list: string[], cls = "lead"): string {
  return list.map((l) => `<p class="${cls}">${esc(l)}</p>`).join("");
}

function chipsGrid(chips?: Poster["chips"]): string {
  if (!chips?.length) return "";
  return `<div class="grid-3">${chips
    .map(
      (c) =>
        `<div class="stack gap-3"><p class="num-xl" style="font-size:104px;">${esc(c.num)}<span style="font-size:44px;font-weight:400;">${esc(c.unit)}</span></p><p class="t-meta">${esc(c.label)}</p></div>`
    )
    .join("")}</div>`;
}

function stepsRows(steps?: Poster["steps"]): string {
  if (!steps?.length) return "";
  return `<div class="stack gap-6">${steps
    .map(
      (s, i) =>
        `<div class="step-row"><span class="step-no">${esc(s.num || String(i + 1))}</span><div class="stack gap-3 grow"><span class="step-t">${esc(s.text)}</span></div></div>`
    )
    .join("")}</div>`;
}

export function renderPoster(p: Poster): string {
  const meta = "SENTINEL · WEIPAI";
  const bodyByKind: Record<string, string> = {
    cover: `
      ${chromeHeader(p.tag, meta)}
      <div class="grow stack gap-6 center" style="justify-content:center;align-items:center;">
        <h1 class="h-hero">${esc(p.lines[0] || "")}</h1>
        ${p.lines.slice(1).map((l) => `<p class="h-xl" style="font-size:64px;">${esc(l)}</p>`).join("")}
        <hr class="hr-accent">
        ${p.swipeHint ? `<p class="t-meta swipe-hint">${esc(p.swipeHint)}</p>` : ""}
      </div>
      ${chipsGrid(p.chips)}
      ${foot(p.footer, "3:4 · 小红书图文")}`,
    data: `
      ${chromeHeader(p.tag || "DATA", meta)}
      <div class="grow stack gap-9" style="justify-content:center;">
        ${chipsGrid(p.chips)}
        <hr class="hr-hairline">
        ${lines(p.lines, "body")}
      </div>
      ${foot(p.footer, "数字会说话")}`,
    shift: `
      ${chromeHeader(p.tag || "PITFALL", meta)}
      <div class="grow stack gap-6" style="justify-content:center;">
        <p class="h-xl">${esc(p.title)}</p>
        <div class="stack gap-5 card-fill">${lines(p.lines, "body")}</div>
      </div>
      ${foot(p.footer, "先避坑，再动手")}`,
    workspace: `
      ${chromeHeader(p.tag || "METHOD", meta)}
      <div class="grow stack gap-7" style="justify-content:center;">
        <p class="h-xl">${esc(p.title)}</p>
        <div class="stack gap-5">${lines(p.lines, "body")}</div>
      </div>
      ${foot(p.footer, "方法比手速重要")}`,
    workflow: `
      ${chromeHeader(p.tag || "STEPS", meta)}
      <div class="grow stack gap-7" style="justify-content:center;">
        <p class="h-xl">${esc(p.title)}</p>
        ${stepsRows(p.steps)}
      </div>
      ${foot(p.footer, "按顺序，一步步来")}`,
    principle: `
      ${chromeHeader(p.tag || "PRINCIPLE", meta)}
      <div class="grow stack gap-8" style="justify-content:center;">
        <p class="t-cat">CORE IDEA</p>
        <div class="card-ink">
          <p class="h-statement" style="font-size:92px;line-height:1.2;">${esc(p.title)}</p>
          ${lines(p.lines, "body")}
        </div>
      </div>
      ${foot(p.footer, "一句话心法")}`,
    division: `
      ${chromeHeader(p.tag || "BEFORE / AFTER", meta)}
      <div class="grow stack gap-7" style="justify-content:center;">
        <p class="h-xl">${esc(p.title)}</p>
        <div class="grid-2">
          <div class="matrix-cell"><p class="cell-title">没做</p><p class="cell-nb">${esc(p.comparison?.[0] || "没准备就开工，越勤快越容易烂尾")}</p></div>
          <div class="matrix-cell is-accent"><p class="cell-title">做了</p><p class="cell-nb">${esc(p.comparison?.[1] || "先写好计划，每步可验证可回退")}</p></div>
        </div>
      </div>
      ${foot(p.footer, "差别就在这一步")}`,
    reflection: `
      ${chromeHeader(p.tag || "REMEMBER", meta)}
      <div class="grow stack gap-7" style="justify-content:center;">
        <p class="h-xl">${esc(p.title)}</p>
        <div class="stack gap-5">
          ${p.lines
            .map(
              (l, i) =>
                `<div class="fit-row"><span class="fit-mark">${String(i + 1).padStart(2, "0")}</span><p class="body grow">${esc(l)}</p></div>`
            )
            .join("")}
        </div>
      </div>
      ${foot(p.footer, "收藏备用")}`,
    end: `
      ${chromeHeader(p.tag || "CTA", meta)}
      <div class="grow stack gap-6" style="justify-content:center;">
        <p class="h-xl" style="font-size:80px;">${esc(p.title)}</p>
        <div class="stack gap-4">
          ${(p.fitItems || []).map((f) => `<div class="fit-row"><span class="fit-mark">✓</span><p class="body grow">${esc(f)}</p></div>`).join("")}
          ${p.notFitItem ? `<div class="fit-row"><span class="fit-mark no">✕</span><p class="body grow" style="color:var(--grey-3);">${esc(p.notFitItem)}</p></div>` : ""}
        </div>
        <div class="card-accent stack gap-4">
          <p class="t-cat" style="color:var(--accent-on);">NEXT STEP</p>
          ${(p.ctaItems || []).map((c) => `<p class="body" style="color:var(--accent-on);">${esc(c)}</p>`).join("")}
        </div>
        ${p.tags?.length ? `<div class="row gap-3" style="flex-wrap:wrap;">${p.tags.map((t) => `<span class="tag-chip">${esc(t)}</span>`).join("")}</div>` : ""}
      </div>
      ${foot(p.footer, "Sentinel微排版")}`,
  };
  return `<div class="poster xhs poster-${p.kind}" data-kind="${p.kind}"><div class="content">${bodyByKind[p.kind] || ""}</div></div>`;
}

export function buildPosterHtml(posters: Poster[], theme: ThemeManifest): string {
  const vars = `--paper:${theme.paper};--ink:${theme.ink};--grey-1:${theme.soft};--grey-2:${theme.divider};--grey-3:${theme.muted};--accent:${theme.accent};--accent-on:${theme.accentOn};`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sentinel微排版 · 小红书图文海报</title>
  <style>${POSTER_CSS.replace("--accent: #059669;", "")}
  :root { ${vars} }
  .sheet { display: flex; flex-direction: column; align-items: center; gap: 48px; padding: 64px 32px; }
  </style>
</head>
<body>
  <div class="sheet">
    ${posters.map(renderPoster).join("\n    ")}
  </div>
  <script>${POSTER_CAPTURE_SCRIPT}</script>
</body>
</html>`;
}

export function posterDocName(posters: Poster[]): string {
  return `sentinel-xhs-${posters.length}cards.html`;
}

export function posterFileName(i: number, kind?: string): string {
  const idx = String(i + 1).padStart(2, "0");
  return `xhs-${idx}-${kind || "poster"}.png`;
}
