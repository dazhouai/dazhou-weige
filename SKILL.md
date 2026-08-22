---
name: dazhou-weige
title: "大洲微格 · 公众号智能排版"
description: >
  微信公众号智能排版工具。当用户需要把 Markdown / 纯文本排版成微信平台合规的公众号富文本、
  生成可直接粘贴到公众号编辑器的 HTML、选择排版主题（摸鱼绿/石墨极简等）、
  一键复制合规样式时使用。纯本地规则引擎，不接大模型。
trigger:
  - 公众号排版
  - 排版
  - 公众号富文本
  - 一键复制到公众号
  - 大洲微格
version: "0.1.0"
agent_created: true
---

# 大洲微格 · 公众号智能排版

## 简介

把 Markdown / 纯文本一键排成微信平台**红线合规**的公众号富文本。纯前端、无后端、无登录，数据全部留在浏览器 localStorage。

**核心价值**：输出的是微信编辑器直接能粘贴的合规 HTML（无 div/class/id/style、全内联样式、`<span leaf="">` 文本节点），不用再手动修样式。

## 使用方式

### 方式一：浏览器可视化工作台（推荐给用户）

启动本地开发服务，让用户直接在浏览器里操作：

```bash
cd <项目目录>          # 大洲微格项目根目录
npm install
npm run dev -- -p 3001
```

访问 `http://localhost:3001/`，用户完成三步：
1. 左侧粘贴 Markdown 或纯文本（纯文本可点「智能补全结构」）
2. 工具栏选主题（7 套）/ 配色实验室（上传 IP 形象自动提色）/ 固定结尾
3. 点右上角「复制到公众号」→ 去微信编辑器 `Cmd/Ctrl+V` 粘贴发布

### 方式二：程序化调用（给需要批量/自动化的场景）

`renderWechatArticle` 是核心渲染函数，可直接在 Node/TS 环境调用：

```ts
import { renderWechatArticle } from "./lib/renderGzh";
import { getTheme } from "./lib/themes";
import { DEFAULT_GZH_SETTINGS, DEFAULT_ENDING, DEFAULT_IP_PROFILE } from "./lib/store";

const md = "# 标题\n\n正文内容…";
const settings = { ...DEFAULT_GZH_SETTINGS, endingEnabled: true };
const theme = getTheme("moyu-green");
const ip = { ...DEFAULT_IP_PROFILE, ipAvatar: "data:image/png;base64,…" };

const out = renderWechatArticle(md, settings, theme, ip, DEFAULT_ENDING);
console.log(out.html);        // 合规 HTML，可直接粘贴
console.log(out.report.ok);   // 合规校验结果
```

参数说明：
- `md: string` — Markdown 原文
- `settings: GzhSettings` — 排版设置（主题 id、字号、行距、字体、章节样式、自动编号、关键词下划线等）
- `theme: ThemeManifest` — 主题对象（`getTheme("moyu-green")` 等 7 套）
- `ip: IpProfile` — IP 形象（名称、头像 base64、专属主题）
- `ending?: FixedEnding` — 固定结尾（作者签名）

返回 `GzhOutput`：
- `html` — 合规富文本 HTML
- `report` — 合规报告（`ok` / `errors` / `leafIssues` / `forbiddenTags` / `punctuationIssues` 等）
- `words` / `minutes` / `codeBlocks` / `toc` — 统计信息

## 主题清单

| 主题 id | 名称 |
|---|---|
| `moyu-green` | 摸鱼绿 |
| `red-white` | 红白色系 |
| `graphite` | 石墨极简 |
| `zen-white` | 留白禅意 |
| `moyu-ticket` | 摸鱼票据 |
| `olive` | 橄榄手记 |
| `sentinel-dark` | 哨兵深色 |

## 合规要点（已内置，无需手动处理）

- 输出 HTML **不含** `div` / `class` / `id` / `style` 标签属性
- 全内联样式，每个文本节点 `<span leaf="">`
- 禁用 `fixed` / `float` / `@media` / CSS 变量
- 全角标点自动归一
- 本地图片自动压缩内嵌 base64

## 注意事项

- 纯本地运行，稿子不上传任何服务器；数据存 localStorage
- 部署静态导出：`npm run build` → `out/` 目录可托管到任意静态服务
- 验证：`npm run test:render`（渲染回归 + 合规断言）/ `npm run lint`
