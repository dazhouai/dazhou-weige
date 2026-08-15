# Sentinel微排版

公众号 + 小红书双独立排版工作台。一篇 Markdown 母稿，同时产出公众号富文本与小红书图文海报。

纯前端（Next.js 静态导出）、无后端、无登录，数据全部保存在浏览器 localStorage。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000/
```

- `/`：公众号排版工作台（主题 / 配色实验室 / 章节样式 / 固定结尾 / 合规校验 / 一键复制）
- `/xhs/`：小红书排版工作台（文案 / 9 卡海报编辑）
- `/xhs/export/`：海报全尺寸导出预览

## 小红书海报出图（HTML + Playwright）

两种方式任选：

**方式一（零命令，推荐给不跑脚本的人）**：在 `/xhs/` 编辑卡片后，点「打开导出预览」，导出页支持「下载全部 PNG」逐张落盘（1080×1440 @2x = 2160×2880）；下载的海报 HTML 自带下载工具栏，别人拿到文件用浏览器打开，点「下载全部 PNG」或单张按钮即可出图，无需装任何环境。

**方式二（本地脚本，批量稳定）**：

1. 在 `/xhs/` 编辑文案与卡片，点「下载海报 HTML」保存 `sentinel-xhs-Ncards.html`；
2. 本地执行（自动复用你本机 Chrome）：

```bash
npm run xhs:cards sentinel-xhs-9cards.html
```

输出到 `output/`：`xhs-01-cover.png` ~ `xhs-NN-xxx.png`（1080×1440 @2x = 2160×2880）与 `preview_全部卡片.png`。

> 说明：海报 HTML 内嵌了 html2canvas（base64 自包含，约 275KB），断网也能用；若海报包含外链图片，浏览器安全限制会拦截导出，此时请用方式二的 Playwright 脚本。

## 验证

```bash
npm run test:render   # 渲染回归 + 合规断言 + 小红书拆文
npm run lint
npm run build         # 静态导出到 out/
```

## 设计说明

- 公众号输出直接构造平台红线合规 HTML：无 div/class/id/style 标签、全内联样式、每个文本节点 `<span leaf="">`、禁用 fixed/float/@media/CSS 变量；复制用 `ClipboardItem text/html`，本地图片自动压缩内嵌，并支持导出「微信图片」包兜底。
- 智能引擎（本地规则，不接大模型）：章节自动编号（结语章 ∞）、英文标签、每段 1–3 个关键词下划线、精选导读卡、全角标点归一、爆款标题 10 选 1。
- 主题：摸鱼绿 / 红白色系 / 石墨极简 / 留白禅意 / 摸鱼票据 / 橄榄手记 / 哨兵深色；上传 IP 形象可自动提色生成 3 套专属配色。
- 小红书默认 9 卡海报制：封面 → 数据 → 痛点 → 方法 → 流程 → 心法 → 对比 → 避坑 → 尾卡，支持增删排序与逐卡编辑。

## 部署（验收后）

```bash
npm run build
```

把 `out/` 部署到任意静态托管（Vercel / Netlify / GitHub Pages 均可）。
