import type { Poster, XhsProfile } from "./types";
import { parseArticle } from "./markdown";

let uid = 0;
function nextId(): string {
  uid += 1;
  return `p${Date.now().toString(36)}${uid}`;
}

function emptyPoster(kind: Poster["kind"], title: string): Poster {
  return { id: nextId(), kind, title, lines: [] };
}

export function splitToPosters(md: string, profile: XhsProfile): Poster[] {
  const a = parseArticle(md);
  const title = a.title || a.sections[0]?.title || "一篇好内容";
  const account = profile.account;
  const tag = a.sections[0]?.title?.slice(0, 6) || "AI 实战";

  // 数据 chips：取出现最多的前 3 个数字
  const chips = a.numbers
    .slice(0, 3)
    .map((n, i) => ({
      num: n.num,
      unit: n.unit,
      label: ["关键指标", "真实数据", "实测结果"][i] || "数据",
    }));

  const cover: Poster = {
    ...emptyPoster("cover", title),
    tag,
    lines: [title],
    chips,
    swipeHint: "右滑看完整图文 →",
    footer: account,
  };

  const dataPoster: Poster = {
    ...emptyPoster("data", "几个数字，说明白这件事"),
    chips: chips.length
      ? chips
      : [{ num: "1", unit: "篇", label: "一篇文章" }, { num: "2", unit: "分钟", label: "完成排版" }, { num: "6", unit: "套", label: "主题随便换" }],
    lines: a.numbers.slice(0, 3).map((n) => `${n.num}${n.unit}`),
    footer: account,
  };

  const shift: Poster = {
    ...emptyPoster("shift", "先别急着动手，坑在这里"),
    lines: a.painLines.length ? a.painLines.slice(0, 3) : ["以前我也会直接让 AI 开干", "结果做完就塌，改一处崩一处", "最后只能反复返工"],
    footer: account,
  };

  const workspace: Poster = {
    ...emptyPoster("workspace", "我的做法，先搭好工作区"),
    lines: a.sections.slice(0, 3).map((s) => s.title),
    footer: account,
  };

  const workflow: Poster = {
    ...emptyPoster("workflow", "四步走，不翻车"),
    steps: (a.orderedSteps[0] || ["先想清楚要什么", "再拆成小步骤", "一步步验收", "最后整体检查"]).map((s, i) => ({ num: String(i + 1), text: s })),
    footer: account,
  };

  const principle: Poster = {
    ...emptyPoster("principle", "核心心法一句话"),
    lines: a.quotes.length
      ? a.quotes.slice(0, 2)
      : ["排版不是给内容化妆，而是帮内容建立节奏", "让读者知道哪里快读，哪里值得停一下"],
    footer: account,
  };

  const division: Poster = {
    ...emptyPoster("division", "没做 VS 做了，差别很大"),
    comparison: a.comparisonLines.length
      ? a.comparisonLines.slice(0, 2)
      : ["没图纸就开工：模型越勤快烂尾越快", "先写好文档：每步可验证可回退"],
    footer: account,
  };

  const reflection: Poster = {
    ...emptyPoster("reflection", "这几点，别忘了"),
    lines: a.reflectionLines.length
      ? a.reflectionLines.slice(0, 4)
      : ["别让 AI 替你假装亲测", "真实经历和核验自己负责", "每一步亲手确认再走下一步"],
    footer: account,
  };

  const end: Poster = {
    ...emptyPoster("end", "谁适合用这套方法"),
    fitItems: ["想提升排版效率的创作者", "想统一风格的内容团队", "讨厌手动调格式的效率党"],
    notFitItem: "只发一条、对排版没要求的用户",
    ctaItems: ["点赞收藏，用的时候照抄", "评论区聊聊你的需求", "关注我，看更多 AI 实战"],
    tags: (profile.tagPool.slice(0, 8).map((t) => `#${t.replace(/^#/, "")}`)),
    footer: account,
  };

  const posters = [cover, dataPoster, shift, workspace, workflow, principle, division, reflection, end];
  return posters;
}

export function reorderPosters(list: Poster[], from: number, to: number): Poster[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
