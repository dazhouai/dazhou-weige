import type { TitleCandidate } from "./types";
import { plainText } from "./markdown";

function fit(s: string, min = 12, max = 28): string {
  const len = [...s].length;
  return len >= min && len <= max ? s : "";
}

export function generateTitles(md: string): TitleCandidate[] {
  const title = plainText(md.match(/^#\s+.+$/m)?.[0]?.replace(/^#\s+/, "") || "");
  const nums: string[] = [];
  for (const m of md.matchAll(/(\d+(?:\.\d+)?)\s*(天|个|分钟|小时|倍|篇|元|%|万|轮|步|张|位|款|种|阶段|次|条)/g)) {
    nums.push(`${m[1]}${m[2]}`);
  }
  const pain = ["折腾", "翻车", "返工", "不会", "麻烦", "太慢", "踩坑", "劝退"]
    .filter((w) => md.includes(w))
    .slice(0, 2);
  const benefit = ["搞定", "实测", "上手", "免费", "省", "高效", "避坑", "方法", "清单", "模板"]
    .filter((w) => md.includes(w))
    .slice(0, 2);
  const n = nums[0] || "";
  const p = pain[0] || "";
  const maxN = nums.slice(0, 3).join("、") || "";

  const candidates: { t: string; angle: string }[] = [
    { t: fit(`${title}：${maxN}个细节，一次讲透`), angle: "数字清单" },
    { t: fit(`${title}，${n ? `${n}就够了` : "一个方法就够了"}`), angle: "结果收益" },
    { t: fit(`还在${p || "手动折腾"}？${title}帮你省下半天`), angle: "痛点避坑" },
    { t: fit(`为什么${title}越做越累？多半是少了这一步`), angle: "好奇反差" },
    { t: fit(`实测${title}：从入门到上手，只花了${n || "一顿饭"}`), angle: "结果收益" },
    { t: fit(`别再${p || "踩坑"}了，${title}的正确打开方式`), angle: "痛点避坑" },
    { t: fit(`${title}避坑指南：${maxN || "这些细节"}最容易翻车`), angle: "痛点避坑" },
    { t: fit(`${title}，${benefit.length ? `${benefit[0]}的关键` : "关键在方法"}`), angle: "结果收益" },
    { t: fit(`新手做${title}，看懂这一篇就够了`), angle: "数字清单" },
    { t: fit(`${title}实测报告：${n ? `${n}的真实体验` : "真实体验"}`), angle: "好奇反差" },
  ];

  const seen = new Set<string>();
  const result: TitleCandidate[] = [];
  let preferred = "";
  for (const c of candidates) {
    if (!c.t || seen.has(c.t)) continue;
    seen.add(c.t);
    if (!preferred) preferred = c.t;
    result.push({ title: c.t, angle: c.angle, preferred: c.t === preferred });
  }
  return result;
}
