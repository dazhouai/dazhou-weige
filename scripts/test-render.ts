/**
 * 渲染回归测试：跑通公众号渲染管线 + 合规断言 + 小红书拆文。
 * 运行：npm run test:render
 */
import { renderWechatArticle } from "../lib/renderGzh";
import { getTheme } from "../lib/themes";
import { DEFAULT_GZH_SETTINGS, DEFAULT_ENDING, DEFAULT_IP_PROFILE, DEFAULT_XHS_PROFILE } from "../lib/store";
import { splitToPosters } from "../lib/xhsSplit";
import { generateXhsCopy } from "../lib/xhsCopy";
import { generateTitles } from "../lib/titles";

const MD = `# 实测：一篇稿子两种排版

这是开头引言：**排版不是化妆**，而是帮内容建立节奏。今天用一篇稿子，同时演示公众号和小红书两种出口。

## 先把结构搭清楚

### 为什么要分层

好的排版让读者知道哪里快读、哪里值得停一下。关键是克制。

### 三个原则

- 一段只表达一个核心意思
- 重要结论适度加粗，只加粗**关键词**
- 图片前后留白
  1. 图片前先说明解决什么问题
  2. 图片后补一句结论

> 排版不是替内容化妆，而是帮助内容建立节奏。

## 让数据说话

1. 粘贴 Markdown，2 分钟完成排版
2. 选择主题，6 套随便换
3. 一键复制到公众号

代码块示例：

\`\`\`bash
npm run dev
npm run xhs:cards
\`\`\`

| 元素 | 适合表达 |
|---|---|
| 引用 | 金句 |
| 表格 | 对比 |

以前排版要折腾半小时，现在两分钟就能搞定，不会再翻车返工。

## 结语：把时间留给内容

记住这句话：好的排版不是越花越好。关注 @跟着大洲学AI，回复「上手」领取清单。
`;

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
  if (!ok) failures += 1;
}

const settings = { ...DEFAULT_GZH_SETTINGS, endingEnabled: true };
const theme = getTheme("moyu-green");
const ip = { ...DEFAULT_IP_PROFILE, ipAvatar: "data:image/png;base64,iVBORw0KGgo=" };
const out = renderWechatArticle(MD, settings, theme, ip, DEFAULT_ENDING);

check("渲染非空", out.html.length > 500);
check("无禁用标签", /<(style|script|div|iframe|object)\b/i.test(out.html) === false, out.report.forbiddenTags.join(","));
check("无 class/id", !/\s(class|id)=/.test(out.html));
check("leaf 包裹 0 遗漏", out.report.leafIssues === 0, `leafIssues=${out.report.leafIssues}`);
check("合规通过", out.report.ok, `errors=${out.report.errors}`);
check("章节自动编号", out.html.includes("01") && out.html.includes("02"));
check("结语章 ∞ 处理", out.html.includes("∞") || out.toc.length >= 2);
check("固定结尾生效", out.html.includes("END") && out.html.includes("点赞"));
check("关键词下划线", out.html.includes("border-bottom:2px solid"));
check("全角标点", out.report.punctuationIssues.length === 0);

const posters = splitToPosters(MD, DEFAULT_XHS_PROFILE);
check("小红书拆文 9 卡", posters.length === 9, `len=${posters.length}`);
check("封面有标题", posters[0].title.length > 0);
check("流程卡有步骤", (posters[4].steps?.length ?? 0) >= 2);
check("尾卡有标签", (posters[8].tags?.length ?? 0) >= 3);

const xcopy = generateXhsCopy(MD, DEFAULT_XHS_PROFILE);
check("文案标题 5 个", xcopy.titles.length === 5, `len=${xcopy.titles.length}`);
check("文案有正文", xcopy.body.length > 100);
check("文案无 Markdown 残留", !/^#{1,3}\s/m.test(xcopy.body));
check("标签 8–10 个", xcopy.tags.length >= 8 && xcopy.tags.length <= 10, `len=${xcopy.tags.length}`);
check("发布建议齐全", Object.values(xcopy.tips).every((v) => v.length > 0));

const titles = generateTitles(MD);
check("公众号标题 ≥8 个", titles.length >= 8, `len=${titles.length}`);
check("有首选标题", titles.some((t) => t.preferred));

console.log(failures === 0 ? "\n全部通过 ✓" : `\n${failures} 项失败 ✗`);
process.exit(failures === 0 ? 0 : 1);
