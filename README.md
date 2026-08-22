<div align="center">

# 大洲微格 · 公众号智能排版工作台

**把排版交给工具，把时间留给内容。**

一篇 Markdown 母稿，一键产出微信平台合规的公众号富文本。

纯前端 · 无后端 · 无登录 · 数据只在你的浏览器里

[在线体验](https://9fee80468a864a328d35fd11a15d70cb.app.workbuddy.link) · [使用教程](#快速开始) · [设计说明](#设计说明)

</div>

---

## ✨ 为什么用它

公众号排版一直是写作者最大的内耗：

- 微信编辑器没有像样的样式系统，标题要手动加粗、引用要手动调色、代码块一粘贴就变形；
- 微信有一堆**红线规则**（不能用 div / class / 外部样式），样式不对整篇乱码；
- 在线排版网站要注册、要会员，稿子还得过别人的服务器。

**大洲微格**把所有事在本地做完：粘贴 Markdown → 选主题 → 一键复制合规 HTML → 去公众号粘贴发布，全程 **3 分钟**。

## 🚀 快速开始

```bash
npm install
npm run dev -- -p 3001   # http://localhost:3001/
```

- `/`：公众号排版工作台（主题 / 配色实验室 / 章节样式 / 固定结尾 / 一键复制）

## 🎯 核心能力

| 能力 | 说明 |
|---|---|
| **智能排版** | 纯本地规则引擎（不接大模型）：章节自动编号（结语章 ∞）、英文标签、每段 1–3 个关键词下划线、精选导读卡、全角标点归一 |
| **合规输出** | 直接构造平台红线合规 HTML：无 div/class/id/style、全内联样式、`<span leaf="">` 文本节点、禁用 fixed/float/@media/CSS 变量 |
| **一键复制** | `ClipboardItem text/html` 复制，粘贴到公众号编辑器即可发布 |
| **7 套主题** | 摸鱼绿 / 红白色系 / 石墨极简 / 留白禅意 / 摸鱼票据 / 橄榄手记 / 哨兵深色 |
| **IP 专属配色** | 上传形象图自动提色，生成 3 套专属配色 |
| **智能补全结构** | 无排版纯文本 / Word 一键识别标题、章节、要点、步骤 |
| **纯本地运行** | 数据只存 localStorage，不上传任何内容 |

## 🔧 验证

```bash
npm run test:render   # 渲染回归 + 合规断言
npm run lint
npm run build         # 静态导出到 out/
```

## 🏗 技术栈

- **Next.js 16**（App Router + Turbopack，静态导出）
- **Tailwind CSS v4** + shadcn/ui + Base UI + Motion
- 全 TypeScript，无后端、无数据库

## 🖥 部署

```bash
npm run build
```

把 `out/` 部署到任意静态托管（Vercel / Netlify / GitHub Pages / CloudStudio 均可）。

## 📄 License

MIT
