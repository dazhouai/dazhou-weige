import type { Tokens } from "marked";
import type {
  ChapterStyleId,
  ComplianceReport,
  FixedEnding,
  GzhSettings,
  IpProfile,
  ThemeManifest,
} from "./types";
import { chapterLabel, isEndingChapter, parseArticle, plainText } from "./markdown";

interface RenderCtx {
  theme: ThemeManifest;
  settings: GzhSettings;
  ip: IpProfile;
  ending?: FixedEnding;
  images: { src: string; local: boolean }[];
  toc: string[];
  chapterIndex: number;
  title: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function leaf(text: string, style = ""): string {
  const st = style ? ` style="${style}"` : "";
  return `<span leaf=""${st}>${esc(text)}</span>`;
}

function strong(text: string, color: string): string {
  return `<strong><span leaf="" style="color:${color};font-weight:700;">${esc(text)}</span></strong>`;
}

const INLINE_RE =
  /(`[^`\n]+`|!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|~~([^~\n]+)~~|==([^=\n]+)==|\+\+([^+\n]+)\+\+)/g;

function renderInline(text: string, ctx: RenderCtx): string {
  const t = ctx.theme;
  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) out.push(leaf(text.slice(last, m.index)));
    const [full] = m;
    const isCode = full.startsWith("`");
    const isImage = full.startsWith("!");
    const isLink = m[4] !== undefined;
    const isBold = m[6] !== undefined;
    const isItalic = m[7] !== undefined;
    const isDel = m[8] !== undefined;
    const isHighlight = m[9] !== undefined;
    const isUnderline = m[10] !== undefined;
    if (isImage) {
      const alt = m[2] || "";
      const src = m[3];
      ctx.images.push({ src, local: /^(blob:|data:|file:|\.\/|\.\.\/|\/)/.test(src) });
      out.push(
        `<img src="${esc(src)}" alt="${esc(alt)}" style="width:100%;max-width:100%;height:auto;display:block;border-radius:${t.radius}px;margin:8px 0;" />`
      );
    } else if (isCode) {
      const code = full.slice(1, -1);
      out.push(
        `<span leaf="" style="background:${t.soft};color:${t.roles.inlineText};font-family:Menlo,Consolas,monospace;font-size:0.92em;padding:2px 6px;border-radius:4px;">${esc(code)}</span>`
      );
    } else if (isLink) {
      const labelText = m[4] || "";
      const href = m[5] || "";
      out.push(
        `<a href="${esc(href)}" style="color:${t.accent};text-decoration:underline;"><span leaf="">${esc(labelText)}</span></a>`
      );
    } else if (isBold) {
      out.push(strong(m[6]!, t.roles.bold));
    } else if (isItalic) {
      out.push(`<em><span leaf="" style="color:${t.text};">${esc(m[7]!)}</span></em>`);
    } else if (isDel) {
      out.push(
        `<span leaf="" style="text-decoration:line-through;color:${t.muted};">${esc(m[8]!)}</span>`
      );
    } else if (isHighlight) {
      out.push(
        `<span leaf="" style="background:linear-gradient(transparent 62%,${t.soft} 62%);color:${t.ink};font-weight:600;">${esc(m[9]!)}</span>`
      );
    } else if (isUnderline) {
      out.push(`<span leaf="" style="${t.underlineCss}color:${t.ink};">${esc(m[10]!)}</span>`);
    }
    last = m.index + full.length;
  }
  if (last < text.length) out.push(leaf(text.slice(last)));
  return out.join("");
}

function pickPhrases(text: string): string[] {
  const plain = plainText(text);
  if (!plain) return [];
  const found: string[] = [];
  const push = (p: string) => {
    const c = p.trim();
    if (c.length < 4 || c.length > 15) return;
    if (found.includes(c)) return;
    if (found.some((f) => f.includes(c) || c.includes(f))) return;
    found.push(c);
  };
  for (const m of plain.matchAll(/\d+(?:\.\d+)?[天个分钟倍篇元%万阶段步次条GMB]+/g)) push(m[0]);
  for (const m of plain.matchAll(/[A-Za-z][A-Za-z0-9\-_.]{2,24}/g)) push(m[0]);
  for (const m of plain.matchAll(/“([^”]{2,16})”/g)) push(m[1]);
  for (const m of plain.matchAll(/(?:关键是|核心是|记住|重点是|所以|这意味着)[：:]?([^，。！？；]{2,18})/g)) push(m[1]);
  if (found.length < 3) {
    const parts = plain.split(/[，。！？；、\s]+/).filter((s) => s.length >= 4 && s.length <= 15);
    for (const p of parts) {
      if (found.length >= 3) break;
      push(p);
    }
  }
  return found.slice(0, 3);
}

function applyUnderline(src: string, phrases: string[]): string {
  let out = src;
  for (const p of phrases) {
    const idx = out.indexOf(p);
    if (idx >= 0 && !out.slice(Math.max(0, idx - 2), idx).includes("**")) {
      out = out.slice(0, idx) + `++${p}++` + out.slice(idx + p.length);
    }
  }
  return out;
}

function renderChapterHeader(
  index: number,
  title: string,
  style: ChapterStyleId,
  ctx: RenderCtx
): string {
  const t = ctx.theme;
  const num = isEndingChapter(title) ? "∞" : String(index).padStart(2, "0");
  const label = chapterLabel(title);
  const ipImg = ctx.settings.showSectionIp && ctx.ip.ipAvatar
    ? `<img src="${esc(ctx.ip.ipAvatar)}" alt="" style="width:26px;height:26px;border-radius:50%;display:inline-block;vertical-align:-6px;margin-right:8px;" />`
    : "";
  const commonTitle = `${ipImg}<span leaf="" style="font-size:20px;font-weight:700;color:${t.roles.title};letter-spacing:1px;line-height:1.4;">${esc(title)}</span>`;
  const labelRow = `<p style="margin:6px 0 0 0;"><span leaf="" style="font-size:12px;color:${t.accent};letter-spacing:2px;font-weight:600;">${label} · ${num}</span></p>`;

  let head: string;
  switch (style) {
    case "slash":
      head = `<section style="display:flex;flex-direction:row;align-items:baseline;gap:10px;margin:34px 0 4px 0;">${leaf("／", `font-size:22px;color:${t.accent};font-weight:700;`)}${commonTitle}</section>`;
      break;
    case "bar":
      head = `<section style="border-left:4px solid ${t.accent};padding-left:12px;margin:34px 0 4px 0;">${commonTitle}</section>`;
      break;
    case "box":
      head = `<section style="border:1px solid ${t.softBorder};border-radius:8px;padding:10px 14px;margin:34px 0 4px 0;background:${t.soft};">${commonTitle}</section>`;
      break;
    case "brackets":
      head = `<section style="margin:34px 0 4px 0;">${leaf("［", `font-size:20px;font-weight:700;color:${t.accent};`)}${commonTitle}${leaf("］", `font-size:20px;font-weight:700;color:${t.accent};`)}</section>`;
      break;
    case "circles":
      head = `<section style="margin:34px 0 4px 0;">${leaf("● ●", `font-size:10px;color:${t.accent};letter-spacing:3px;vertical-align:middle;`)} ${commonTitle}</section>`;
      break;
    case "dots":
      head = `<section style="margin:34px 0 4px 0;">${leaf("∷", `font-size:18px;color:${t.accent};font-weight:700;`)} ${commonTitle} ${leaf("∷", `font-size:18px;color:${t.accent};font-weight:700;`)}</section>`;
      break;
    case "topNumber":
      head = `<section style="margin:34px 0 4px 0;"><p style="margin:0 0 2px 0;"><span leaf="" style="font-size:26px;font-weight:200;color:${t.accent};letter-spacing:1px;">${num}</span></p>${commonTitle}</section>`;
      break;
    case "quote":
      head = `<section style="margin:34px 0 4px 0;">${leaf("“", `font-size:26px;font-weight:700;color:${t.accent};`)}${commonTitle}${leaf("”", `font-size:26px;font-weight:700;color:${t.accent};`)}</section>`;
      break;
    case "underline":
    default:
      head = `<section style="display:flex;flex-direction:row;align-items:baseline;gap:10px;margin:34px 0 4px 0;"><span leaf="" style="color:${t.accent};font-size:20px;font-weight:700;letter-spacing:1px;">${num}</span><section><section style="border-bottom:3px solid ${t.accent};padding-bottom:4px;display:inline-block;">${commonTitle}</section></section></section>`;
      break;
  }
  return head + labelRow;
}

function renderParagraph(token: Tokens.Paragraph, ctx: RenderCtx): string {
  const t = ctx.theme;
  const s = ctx.settings;
  let src = token.text;
  if (s.autoUnderline) src = applyUnderline(src, pickPhrases(src));
  const style = `font-size:${s.fontSize}px;line-height:${s.lineHeight};letter-spacing:${t.letterSpacing};color:${s.textColor};margin:14px 0;`;
  return `<p style="${style}">${renderInline(src, ctx)}</p>`;
}

function renderList(token: Tokens.List, ctx: RenderCtx, depth = 0): string {
  const t = ctx.theme;
  const s = ctx.settings;
  const markerColor = t.roles.list;
  const items = token.items.map((item, i) => {
    const marker = token.ordered ? `${i + 1}.` : "●";
    const inner = (item.tokens || [])
      .map((tk) => {
        if (tk.type === "text" || tk.type === "paragraph") {
          return renderInline((tk as Tokens.Text).text, ctx);
        }
        if (tk.type === "list") return renderList(tk as Tokens.List, ctx, depth + 1);
        return "";
      })
      .join("");
    const indent = depth > 0 ? `padding-left:${depth * 18}px;` : "";
    return `<section style="display:flex;flex-direction:row;align-items:flex-start;gap:10px;margin:8px 0;${indent}"><span leaf="" style="color:${markerColor};font-weight:700;min-width:22px;flex:none;font-size:${s.fontSize}px;line-height:${s.lineHeight};">${marker}</span><section style="flex:1;font-size:${s.fontSize}px;line-height:${s.lineHeight};color:${s.textColor};">${inner}</section></section>`;
  });
  return `<section style="margin:12px 0;">${items.join("")}</section>`;
}

function renderBlockquote(token: Tokens.Blockquote, ctx: RenderCtx): string {
  const t = ctx.theme;
  const s = ctx.settings;
  const text = token.text;
  return `<section style="background:${t.soft};border-left:4px solid ${t.roles.quote};border-radius:0 8px 8px 0;padding:14px 16px;margin:16px 0;"><p style="margin:0;font-size:${s.fontSize}px;line-height:${s.lineHeight};color:${t.ink};font-style:italic;">${renderInline(text, ctx)}</p></section>`;
}

function renderCode(token: Tokens.Code): string {
  const lang = token.lang || "";
  const lines = token.text.replace(/\n$/, "").split("\n");
  const dots = ["#f87171", "#fbbf24", "#34d399"]
    .map((c) => `<span leaf="" style="width:10px;height:10px;border-radius:50%;background:${c};display:inline-block;margin-right:6px;"><br></span>`)
    .join("");
  const body = lines
    .map(
      (line) =>
        `<p style="margin:0;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.65;color:#e2e8f0;white-space:normal;"><span leaf="">${esc(line)}</span></p>`
    )
    .join("");
  return `<section style="background:#0f172a;border-radius:12px;margin:18px 0;overflow:hidden;max-width:100%;"><section style="display:flex;flex-direction:row;align-items:center;justify-content:space-between;background:#1e293b;padding:10px 14px;"><section>${dots}</section><span leaf="" style="color:#94a3b8;font-size:11px;letter-spacing:1px;font-family:Menlo,Consolas,monospace;">${esc(lang || "CODE")}</span></section><section style="padding:14px 16px;">${body}</section></section>`;
}

function renderTable(token: Tokens.Table, ctx: RenderCtx): string {
  const t = ctx.theme;
  const s = ctx.settings;
  const head = token.header
    .map(
      (c) =>
        `<th style="background:${t.soft};padding:10px 12px;border:1px solid ${t.divider};color:${t.ink};font-weight:700;font-size:${s.fontSize - 1}px;text-align:left;"><span leaf="">${esc(c.text)}</span></th>`
    )
    .join("");
  const rows = token.rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (c) =>
              `<td style="padding:9px 12px;border:1px solid ${t.divider};color:${s.textColor};font-size:${s.fontSize - 1}px;line-height:1.6;"><span leaf="">${esc(c.text)}</span></td>`
          )
          .join("")}</tr>`
    )
    .join("");
  return `<section style="overflow-x:auto;margin:18px 0;"><table style="width:100%;max-width:100%;border-collapse:collapse;">${head ? `<thead><tr>${head}</tr></thead>` : ""}<tbody>${rows}</tbody></table></section>`;
}

function renderImage(token: Tokens.Image, ctx: RenderCtx): string {
  const t = ctx.theme;
  ctx.images.push({ src: token.href, local: /^(blob:|data:|file:|\.\/|\.\.\/|\/)/.test(token.href) });
  const img = `<img src="${esc(token.href)}" alt="${esc(token.text)}" style="width:100%;max-width:100%;height:auto;display:block;border-radius:${t.radius}px;" />`;
  const caption = token.text
    ? `<p style="margin:6px 0 0 0;text-align:center;"><span leaf="" style="font-size:12px;color:${t.muted};">${esc(token.text)}</span></p>`
    : "";
  return `<p style="margin:18px 0 8px 0;">${img}</p>${caption}`;
}

function renderTitleCard(ctx: RenderCtx): string {
  const t = ctx.theme;
  const title = ctx.title;
  if (!title) return "";
  return `<section style="margin:4px 0 12px 0;text-align:center;"><p style="margin:0 0 10px 0;"><span leaf="" style="font-size:22px;font-weight:700;color:${t.roles.title};line-height:1.5;letter-spacing:1px;">${esc(title)}</span></p><section style="display:inline-block;border-bottom:3px solid ${t.accent};width:56px;"><span leaf=""><br></span></section></section>`;
}

function renderToc(ctx: RenderCtx): string {
  if (!ctx.settings.tocEnabled || ctx.toc.length < 2) return "";
  const t = ctx.theme;
  const items = ctx.toc
    .slice(0, 3)
    .map(
      (c, i) =>
        `<p style="margin:5px 0;"><span leaf="" style="color:${t.accent};font-weight:700;font-size:14px;">${String(i + 1).padStart(2, "0")}</span><span leaf="" style="color:${t.ink};font-size:14px;margin-left:8px;">${esc(c)}</span></p>`
    )
    .join("");
  return `<section style="background:${t.soft};border-radius:${t.radius}px;padding:14px 16px;margin:16px 0;"><p style="margin:0 0 6px 0;"><span leaf="" style="font-size:13px;font-weight:700;color:${t.accent};letter-spacing:2px;">本期导读</span></p>${items}</section>`;
}

function renderEnding(ctx: RenderCtx): string {
  if (!ctx.settings.endingEnabled || !ctx.ending) return "";
  const t = ctx.theme;
  const e = ctx.ending;
  const avatar =
    e.useAvatar && (e.avatar || ctx.ip.ipAvatar)
      ? `<img src="${esc(e.avatar || ctx.ip.ipAvatar || "")}" alt="" style="width:56px;height:56px;border-radius:50%;flex:none;display:inline-block;" />`
      : "";
  const lines = (e.text || "")
    .split("\n")
    .map((l) => `<p style="margin:3px 0;"><span leaf="" style="font-size:14px;line-height:1.8;color:${t.text};">${esc(l)}</span></p>`)
    .join("");
  return `<section style="margin:36px 0 0 0;"><section style="display:flex;flex-direction:row;align-items:center;justify-content:center;gap:14px;margin-bottom:22px;"><section style="flex:1;border-top:1px solid ${t.divider};"><span leaf=""><br></span></section><span leaf="" style="color:${t.accent};font-size:13px;font-weight:700;letter-spacing:3px;">END</span><section style="flex:1;border-top:1px solid ${t.divider};"><span leaf=""><br></span></section></section><section style="display:flex;flex-direction:row;align-items:center;gap:14px;background:${t.soft};border-radius:${t.radius}px;padding:16px 18px;">${avatar}<section style="flex:1;">${lines}</section></section></section>`;
}

function buildReport(html: string, ctx: RenderCtx): ComplianceReport {
  const forbiddenTags: string[] = [];
  for (const tag of ["style", "script", "iframe", "object", "div"]) {
    if (new RegExp(`<${tag}\\b`, "i").test(html)) forbiddenTags.push(tag);
  }
  if (/\sclass\s*=/.test(html)) forbiddenTags.push("class 属性");
  if (/\sid\s*=/.test(html)) forbiddenTags.push("id 属性");
  const forbiddenCss: string[] = [];
  if (/position\s*:\s*(fixed|absolute|sticky)/i.test(html)) forbiddenCss.push("position:fixed/absolute/sticky");
  if (/\bfloat\s*:/i.test(html)) forbiddenCss.push("float");
  if (/@media|@keyframes/i.test(html)) forbiddenCss.push("@media/@keyframes");
  if (/display\s*:\s*grid/i.test(html)) forbiddenCss.push("display:grid");
  if (/var\(/i.test(html)) forbiddenCss.push("CSS 变量");

  let leafIssues = 0;
  const textRuns = html.match(/>([^<>]+)</g) || [];
  for (const run of textRuns) {
    const inner = run.slice(1, -1);
    if (!inner.trim()) continue;
    const prev = html.slice(0, Math.max(0, html.indexOf(run))).match(/<([a-zA-Z0-9]+)([^>]*?)>$/);
    if (!prev) continue;
    const tag = prev[1].toLowerCase();
    if (tag === "span" && /leaf/i.test(prev[2] || "")) continue;
    if (["img", "br", "input"].includes(tag)) continue;
    leafIssues += 1;
  }

  const punctuationIssues: { index: number; text: string }[] = [];
  const withoutCode = html.replace(/<section[^>]*background:#0f172a[\s\S]*?<\/section>/g, "");
  for (const m of withoutCode.matchAll(/[\u4e00-\u9fff][,.!?;:]/g)) {
    punctuationIssues.push({ index: m.index ?? 0, text: m[0] });
  }

  const total = ctx.images.length;
  const embedded = ctx.images.filter((i) => i.src.startsWith("data:")).length;
  const remote = ctx.images.filter((i) => /^https?:\/\//.test(i.src)).length;
  const missing = ctx.images.filter((i) => i.src.startsWith("blob:") || !i.src).length;

  const errorsCount = forbiddenTags.length + forbiddenCss.length + punctuationIssues.length + leafIssues;
  return {
    ok: errorsCount === 0,
    errors: errorsCount,
    warnings: punctuationIssues.length,
    leafIssues,
    forbiddenTags,
    forbiddenCss,
    punctuationIssues,
    images: { total, embedded, remote, missing },
  };
}

export interface GzhOutput {
  html: string;
  report: ComplianceReport;
  images: { src: string; local: boolean }[];
  toc: string[];
  words: number;
  minutes: number;
  codeBlocks: number;
}

export function renderWechatArticle(
  md: string,
  settings: GzhSettings,
  theme: ThemeManifest,
  ip: IpProfile,
  ending?: FixedEnding
): GzhOutput {
  const article = parseArticle(md);
  const ctx: RenderCtx = {
    theme,
    settings,
    ip,
    ending,
    images: [],
    toc: [],
    chapterIndex: 0,
    title: article.title,
  };

  const parts: string[] = [];
  let inTitleCard = false;
  let codeBlocks = 0;

  for (const token of article.tokens) {
    switch (token.type) {
      case "heading": {
        const h = token as Tokens.Heading;
        if (h.depth === 1) {
          inTitleCard = true;
        } else if (h.depth === 2) {
          ctx.chapterIndex += 1;
          ctx.toc.push(plainText(h.text));
          const style = settings.chapterStyle;
          parts.push(renderChapterHeader(ctx.chapterIndex, plainText(h.text), style, ctx));
        } else if (h.depth === 3) {
          const t = ctx.theme;
          parts.push(
            `<section style="display:flex;flex-direction:row;align-items:center;gap:8px;margin:22px 0 6px 0;"><section style="width:3px;height:16px;border-radius:2px;background:${t.roles.decoration};"><span leaf=""><br></span></section><span leaf="" style="font-size:17px;font-weight:700;color:${t.roles.title};">${esc(plainText(h.text))}</span></section>`
          );
        }
        break;
      }
      case "paragraph":
        parts.push(renderParagraph(token as Tokens.Paragraph, ctx));
        break;
      case "list":
        parts.push(renderList(token as Tokens.List, ctx));
        break;
      case "blockquote":
        parts.push(renderBlockquote(token as Tokens.Blockquote, ctx));
        break;
      case "code":
        codeBlocks += 1;
        parts.push(renderCode(token as Tokens.Code));
        break;
      case "table":
        parts.push(renderTable(token as Tokens.Table, ctx));
        break;
      case "image":
        parts.push(renderImage(token as Tokens.Image, ctx));
        break;
      case "hr":
        parts.push(
          `<section style="margin:22px 0;text-align:center;"><section style="display:inline-block;width:64px;border-top:1px solid ${ctx.theme.divider};"><span leaf=""><br></span></section></section>`
        );
        break;
      case "html":
      case "space":
      default:
        break;
    }
  }

  const body = `${inTitleCard ? renderTitleCard(ctx) : ""}${renderToc(ctx)}${parts.join("")}${renderEnding(ctx)}`;
  const report = buildReport(body, ctx);
  return {
    html: body,
    report,
    images: ctx.images,
    toc: ctx.toc,
    words: article.words,
    minutes: Math.max(1, Math.round(article.words / 400)),
    codeBlocks,
  };
}
