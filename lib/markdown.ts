import { marked, type Token, type Tokens, type TokensList } from "marked";

export interface ParsedArticle {
  raw: string;
  title: string;
  tokens: TokensList;
  sections: { index: number; title: string; tokens: Token[] }[];
  numbers: { num: string; unit: string }[];
  orderedSteps: string[][];
  quotes: string[];
  painLines: string[];
  comparisonLines: string[];
  reflectionLines: string[];
  ctaLines: string[];
  hashtags: string[];
  words: number;
}

const NUM_RE = /(\d+(?:\.\d+)?)\s*(天|个|分钟|小时|倍|篇|元|块|%|万|轮|步|张|位|款|种|阶段|次|条|行|页|G|GB|MB|人|家)/g;
const PAIN_WORDS = ["折腾", "返工", "翻车", "麻烦", "太慢", "不会", "难", "崩溃", "踩坑", "卡住", "劝退", "吃亏", "瞎忙"];
const REFLECT_WORDS = ["教训", "别", "注意", "反思", "避坑", "坑", "提醒", "误区", "后悔"];
const CTA_WORDS = ["适合谁", "怎么获取", "获取方式", "回复", "关注", "评论区", "收藏", "上手", "模板", "领取"];
const TAG_WORDS = ["AI", "工具", "教程", "实测", "公众号", "排版", "效率", "自动化", "编程", "提示词", "复盘", "内容", "创作", "运营"];

function protectCode(md: string): { text: string; restore: (s: string) => string } {
  const blocks: string[] = [];
  let i = 0;
  const text = md.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (m) => {
    blocks.push(m);
    return `\u0000CODE${i++}\u0000`;
  });
  return {
    text,
    restore: (s: string) => s.replace(/\u0000CODE(\d+)\u0000/g, (_m, idx: string) => blocks[Number(idx)]),
  };
}

export function normalizePunctuation(md: string): string {
  const { text, restore } = protectCode(md);
  const converted = text
    .replace(/([\u4e00-\u9fff])\s*,\s*/g, "$1，")
    .replace(/,\s*([\u4e00-\u9fff])/g, "，$1")
    .replace(/([\u4e00-\u9fff])\./g, "$1。")
    .replace(/([\u4e00-\u9fff])\s*;\s*/g, "$1；")
    .replace(/([\u4e00-\u9fff])\s*:\s*/g, "$1：")
    .replace(/([\u4e00-\u9fff])\s*!\s*/g, "$1！")
    .replace(/([\u4e00-\u9fff])\s*\?\s*/g, "$1？")
    .replace(/([\u4e00-\u9fff])"([^"]*)"/g, "$1“$2”")
    .replace(/([\u4e00-\u9fff])'([^']*)'/g, "$1‘$2’");
  return restore(converted);
}

export function countWords(md: string): number {
  const stripped = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*`\-—|[\]]/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  const cjk = (stripped.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = (stripped.match(/[A-Za-z0-9]+/g) || []).length;
  return cjk + latin;
}

export function extractTitle(md: string): string {
  const m = md.match(/^#\s+(.+)$/m) || md.match(/^##\s+(.+)$/m);
  return m ? m[1].replace(/[*`]/g, "").trim() : "";
}

export function plainText(text: string): string {
  return text
    .replace(/[*_`~#\[\]()]/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseArticle(md: string): ParsedArticle {
  const normalized = normalizePunctuation(md);
  const tokens = marked.lexer(normalized);

  const sections: { index: number; title: string; tokens: Token[] }[] = [];
  let current: { index: number; title: string; tokens: Token[] } | null = null;
  const orderedSteps: string[][] = [];
  const quotes: string[] = [];
  const painLines: string[] = [];
  const comparisonLines: string[] = [];
  const reflectionLines: string[] = [];
  const ctaLines: string[] = [];

  const walk = (list: Token[], depth = 0) => {
    for (const token of list) {
      if (token.type === "heading" && token.depth === 2) {
        current = { index: sections.length + 1, title: plainText(token.text), tokens: [] };
        sections.push(current);
        continue;
      }
      if (token.type === "list") {
        const items = (token as Tokens.List).items.map((it) => plainText(it.text));
        if ((token as Tokens.List).ordered) orderedSteps.push(items);
        for (const it of (token as Tokens.List).items) {
          if (it.tokens?.length) walk(it.tokens, depth + 1);
        }
        continue;
      }
      if (token.type === "blockquote") {
        const quote = plainText((token as Tokens.Blockquote).text).replace(/^>/, "");
        if (quote) quotes.push(quote);
      }
      if (token.type === "paragraph") {
        const t = plainText(token.text);
        if (t) {
          if (PAIN_WORDS.some((w) => t.includes(w))) painLines.push(t);
          if (/(以前|没.*就|先.*再|一次.*一次|一个.*一个|没有.*烂尾)/.test(t)) comparisonLines.push(t);
          if (REFLECT_WORDS.some((w) => t.includes(w))) reflectionLines.push(t);
          if (CTA_WORDS.some((w) => t.includes(w))) ctaLines.push(t);
        }
      }
      if (current && !["space", "heading"].includes(token.type)) current.tokens.push(token);
      if (token.type === "table" || token.type === "code" || token.type === "html") continue;
    }
  };
  walk(tokens);

  const numbers: { num: string; unit: string }[] = [];
  for (const m of normalized.matchAll(NUM_RE)) numbers.push({ num: m[1], unit: m[2] });

  const hashtags: string[] = [];
  for (const w of TAG_WORDS) if (normalized.includes(w)) hashtags.push(w);

  return {
    raw: normalized,
    title: extractTitle(normalized),
    tokens,
    sections,
    numbers: numbers.slice(0, 12),
    orderedSteps,
    quotes,
    painLines: painLines.slice(0, 6),
    comparisonLines: comparisonLines.slice(0, 4),
    reflectionLines: reflectionLines.slice(0, 6),
    ctaLines: ctaLines.slice(0, 6),
    hashtags,
    words: countWords(normalized),
  };
}

export function chapterLabel(title: string): string {
  const map: [RegExp, string][] = [
    [/实测|试玩|上手/, "TEST"],
    [/教程|入门|上手|指南/, "TUTORIAL"],
    [/复盘|总结|数据/, "REVIEW"],
    [/避坑|教训|误区|反思/, "PITFALLS"],
    [/对比|比较|vs|VS/, "COMPARE"],
    [/工具|清单|盘点|推荐/, "TOOLS"],
    [/原理|心法|拆解|机制/, "PRINCIPLE"],
    [/案例|实战|场景/, "CASE"],
    [/思考|想法|观点/, "THOUGHTS"],
    [/目录|导航|导读/, "INDEX"],
  ];
  for (const [re, label] of map) if (re.test(title)) return label;
  return "SECTION";
}

export function isEndingChapter(title: string): boolean {
  return /^(结语|总结|写在最后|尾声|后记|收尾)/.test(title);
}
