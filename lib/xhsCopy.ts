import { marked, type Token, type Tokens } from "marked";
import type { XhsCopy, XhsProfile } from "./types";
import { plainText } from "./markdown";

const CN_NUMS = ["❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾", "❿"];

function fitTitle(s: string, max = 20): string {
  return [...s].length <= max ? s : [...s].slice(0, max - 1).join("") + "…";
}

function pickTopic(title: string, max = 14): string {
  const chars = [...title];
  if (chars.length <= max) return title;
  const cut = chars.slice(0, max);
  // 若在英文单词中间截断，回退到最后一个空格或中文字符边界
  const last = cut[cut.length - 1];
  const next = chars[max];
  if (/[A-Za-z0-9]/.test(last) && /[A-Za-z0-9]/.test(next)) {
    const boundary = cut.findLastIndex((c) => c === " " || /[\u4e00-\u9fff]/.test(c));
    if (boundary > 0) {
      const isSpace = cut[boundary] === " ";
      return cut.slice(0, isSpace ? boundary : boundary + 1).join("");
    }
  }
  return cut.join("").replace(/\s+$/, "");
}

function emojiForLine(line: string): string {
  if (/\d+(\.\d+)?\s*(篇|个|天|分钟|小时|倍|元|%|万|阶段|次)/.test(line)) return "📊";
  if (/💰|收益|赚|钱/.test(line)) return "💰";
  if (/教训|坑|翻车|错/.test(line)) return "😅";
  if (/核心|记住|关键是|心法/.test(line)) return "💎";
  if (/快|秒|分钟/.test(line)) return "⚡";
  if (/免费|模板|清单/.test(line)) return "🎁";
  return "▪";
}

export function generateXhsTitles(md: string): { titles: string[]; preferredTitle: string } {
  const title = plainText(md.match(/^#\s+.+$/m)?.[0]?.replace(/^#\s+/, "") || "");
  const nums: string[] = [];
  for (const m of md.matchAll(/(\d+(?:\.\d+)?)\s*(天|个|分钟|小时|倍|篇|元|%|万|轮|步|阶段|次)/g)) {
    nums.push(`${m[1]}${m[2]}`);
  }
  const n = nums[0] || "";
  const topic = pickTopic(title) || "这个工具";
  const cands = [
    `${topic}${n ? ` ${n}就够` : " 一篇就够"}`,
    `别再${md.includes("折腾") ? "折腾" : "踩坑"}了 ${topic}这样用`,
    `${md.includes("不会") ? "不会" : "零基础"}也能做${topic} 实测不翻车`,
    `${topic}第${nums[1] || "一"}天 真实体验分享`,
    `为什么${topic}越用越顺？关键在这`,
  ].map((s) => fitTitle(s));
  return { titles: [...new Set(cands)].slice(0, 5), preferredTitle: cands[0] };
}

export function generateXhsBody(md: string, account: string, slogan: string): string {
  const tokens = marked.lexer(md);
  const out: string[] = [];
  const walk = (list: Token[]) => {
    for (const token of list) {
      if (token.type === "heading") {
        const h = token as Tokens.Heading;
        if (h.depth <= 2) {
          out.push("");
          out.push(`🔥 ${plainText(h.text)}`);
        }
      } else if (token.type === "paragraph") {
        const t = plainText(token.text);
        if (t) out.push(t);
      } else if (token.type === "list") {
        const items = (token as Tokens.List).items.map((it) => plainText(it.text));
        const ordered = (token as Tokens.List).ordered;
        items.forEach((it, i) => {
          out.push(ordered ? `${CN_NUMS[i] || `${i + 1}.`} ${it}` : `${emojiForLine(it)} ${it}`);
        });
      } else if (token.type === "blockquote") {
        const q = plainText((token as Tokens.Blockquote).text);
        if (q) out.push(`💎 ${q}`);
      } else if (token.type === "code") {
        const c = (token as Tokens.Code).text;
        out.push(`\`\`\`\n${c}\n\`\`\``);
      } else if (token.type === "table") {
        const tb = token as Tokens.Table;
        out.push(tb.header.map((h) => plainText(h.text)).join(" | "));
        for (const r of tb.rows) out.push(r.map((c) => plainText(c.text)).join(" | "));
      }
    }
  };
  walk(tokens);

  out.push("");
  out.push("觉得有用 先 ❤️收藏 免得迷路");
  out.push("评论区扣「有用」我看到了就回");
  out.push(`关注 ${account}`);
  if (slogan) out.push(slogan);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function generateXhsTags(md: string, profile: XhsProfile): string[] {
  const tags = new Set<string>();
  for (const t of profile.tagPool) tags.add(t.replace(/^#/, ""));
  const contentTags = ["AI工具", "AI实战", "效率神器", "公众号", "小红书", "排版", "自媒体", "教程", "实测", "复盘"]
    .filter((t) => md.includes(t));
  for (const t of contentTags) tags.add(t);
  const all = [...tags];
  const fallback = ["AI工具", "效率神器", "自媒体干货", "真实复盘", "内容创作", "AI写作"];
  for (const t of fallback) {
    if (all.length >= 8) break;
    if (!all.includes(t)) all.push(t);
  }
  return all.slice(0, 10).map((t) => (t.startsWith("#") ? t : `#${t}`));
}

export function generateXhsTips(): XhsCopy["tips"] {
  return {
    time: "工作日 12:00–13:00 或 21:00–22:30；周末优先 10:00–11:00。",
    coverNote: "首图已内置封面大字，上传时不要再叠贴纸或文字。",
    comment: "发布后 1 小时内自己用小号留一条引导评论，带动讨论。",
    repost: "发布 24h 后若数据好，换标题再发一次，做二次分发。",
  };
}

export function generateXhsCopy(md: string, profile: XhsProfile): XhsCopy {
  const t = generateXhsTitles(md);
  return {
    titles: t.titles,
    preferredTitle: t.preferredTitle,
    body: generateXhsBody(md, profile.account, profile.slogan),
    tags: generateXhsTags(md, profile),
    tips: generateXhsTips(),
  };
}
