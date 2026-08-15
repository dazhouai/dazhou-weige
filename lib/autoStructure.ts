/**
 * 智能结构识别：把"小白上传的无排版文本"（Word 转换 / 纯文本 / 富文本）自动补成 Markdown。
 * 规则保留已有 Markdown 语法，可安全重复执行。
 */

const CN_ORD_RE = /^([一二三四五六七八九十百]+)[、.．]\s*/;
const CN_ORD_PAREN_RE = /^[（(]([一二三四五六七八九十百]+)[)）]\s*/;
const CN_PART_RE = /^第[一二三四五六七八九十百\d]+[章节部分篇]\s*/;
const ARABIC_RE = /^\d{1,2}[、.．]\s*/;
const ARABIC_ESCAPED_RE = /^\d{1,2}\\\.\s*/;
const ARABIC_PAREN_RE = /^\d{1,2}[)）]\s*/;
const BULLET_RE = /^[-*•·－]\s*/;
const PAREN_NUM_RE = /^[（(]\d{1,2}[)）]\s*/;
const CN_NUM_MARK_RE = /^[①②③④⑤⑥⑦⑧⑨⑩]\s*/;
const FIRST_SECOND_RE = /^(第一|第二|第三|第四|第五|第六|第七|第八|首先|其次|再次|最后)[，,、]?\s*/;

export function hasMarkdownStructure(text: string): boolean {
  return (
    /^#{1,6}\s/m.test(text) ||
    /^\s*(?:[-*+]|>)\s/m.test(text) ||
    /```/m.test(text)
  );
}

function isHeadingLike(t: string): boolean {
  return (
    CN_ORD_RE.test(t) ||
    CN_ORD_PAREN_RE.test(t) ||
    CN_PART_RE.test(t) ||
    /^#{1,6}\s/.test(t)
  );
}

function isBulletLike(t: string): boolean {
  return (
    BULLET_RE.test(t) ||
    PAREN_NUM_RE.test(t) ||
    CN_NUM_MARK_RE.test(t) ||
    FIRST_SECOND_RE.test(t)
  );
}

function isNumberedLike(t: string): boolean {
  return ARABIC_RE.test(t) || ARABIC_ESCAPED_RE.test(t) || ARABIC_PAREN_RE.test(t);
}

export interface AutoStructureResult {
  markdown: string;
  headings: number;
  bullets: number;
  ordered: number;
}

export function autoStructureText(raw: string): AutoStructureResult {
  const lines = raw.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd());
  const block: string[] = [];
  const blank = () => {
    if (block.length && block[block.length - 1] !== "") block.push("");
  };

  // 标题：第一段非空行
  let i = 0;
  let first = lines[i]?.trim() || "";
  while (!first && i < lines.length - 1) {
    i += 1;
    first = lines[i]?.trim() || "";
  }
  if (first) {
    if (/^#{1,6}\s/.test(first)) block.push(first);
    else block.push(`# ${first}`);
    i += 1;
  }

  const rest = lines.slice(i);
  const roles: ("keep" | "h" | "ul" | "ol" | "p" | "cont")[] = [];
  for (let k = 0; k < rest.length; k++) {
    const t = rest[k].trim();
    if (!t) {
      roles.push("keep");
      continue;
    }
    if (/^#{1,6}\s/.test(t) || /^>/.test(t) || /^```/.test(t) || BULLET_RE.test(t)) {
      roles.push("keep");
      continue;
    }
    if (isHeadingLike(t)) {
      roles.push("h");
      continue;
    }
    if (isBulletLike(t)) {
      roles.push("ul");
      continue;
    }
    if (isNumberedLike(t)) {
      let nextT = "";
      for (let j = k + 1; j < rest.length; j++) {
        if (rest[j].trim()) { nextT = rest[j].trim(); break; }
      }
      let prevT = "";
      for (let j = k - 1; j >= 0; j--) {
        if (rest[j].trim()) { prevT = rest[j].trim(); break; }
      }
      const consecutive = isNumberedLike(nextT) || isNumberedLike(prevT);
      if (consecutive || (t.length <= 30 && nextT.length >= 30)) roles.push("ol");
      else roles.push("p");
      continue;
    }
    const nextT = rest[k + 1]?.trim() || "";
    const prevT = rest[k - 1]?.trim() || "";
    // 短行 + 后跟长段 → 章节标题
    if (
      t.length <= 24 &&
      nextT.length >= 36 &&
      nextT.length >= t.length * 1.6 &&
      !/[，；：]$/.test(t)
    ) {
      roles.push("h");
      continue;
    }
    // 短行紧跟长行 → 续行拼接
    if (t.length < 28 && prevT.length >= 50 && roles[k - 1] === "p") {
      roles.push("cont");
      continue;
    }
    roles.push("p");
  }

  let prevRole: string | null = null;
  let headings = 0;
  let bullets = 0;
  let ordered = 0;
  let group: "ol" | "ul" | null = null;
  for (let k = 0; k < rest.length; k++) {
    const t = rest[k].trim();
    const role = roles[k];
    if (!t) {
      if (group) {
        prevRole = group;
        continue;
      }
      blank();
      prevRole = null;
      continue;
    }
    if (role === "keep") {
      group = null;
      blank();
      block.push(t);
      prevRole = "keep";
      continue;
    }
    if (role === "h") {
      group = null;
      blank();
      const clean = t
        .replace(CN_ORD_RE, "")
        .replace(CN_ORD_PAREN_RE, "")
        .replace(CN_PART_RE, "")
        .replace(ARABIC_RE, "")
        .replace(ARABIC_ESCAPED_RE, "");
      block.push(`## ${clean}`);
      headings += 1;
      prevRole = "h";
      continue;
    }
    if (role === "ul") {
      if (group !== "ul") blank();
      group = "ul";
      const clean = t
        .replace(BULLET_RE, "")
        .replace(PAREN_NUM_RE, "")
        .replace(CN_NUM_MARK_RE, "")
        .replace(FIRST_SECOND_RE, "");
      block.push(`- ${clean}`);
      bullets += 1;
      prevRole = "ul";
      continue;
    }
    if (role === "ol") {
      if (group !== "ol") blank();
      group = "ol";
      const clean = t
        .replace(/^\d{1,2}\s*(?:[、.．)）]|\\\.)\s*/, "")
        .trim();
      block.push(`1. ${clean}`);
      ordered += 1;
      prevRole = "ol";
      continue;
    }
    if (role === "cont" && prevRole === "p") {
      group = null;
      block[block.length - 1] = block[block.length - 1] + t;
      prevRole = "p";
      continue;
    }
    group = null;
    blank();
    block.push(t);
    prevRole = "p";
  }

  return {
    markdown: block.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n",
    headings,
    bullets,
    ordered,
  };
}
