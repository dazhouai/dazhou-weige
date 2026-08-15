#!/usr/bin/env node
/**
 * Sentinel微排版 · 小红书海报截图脚本（HTML + Playwright）
 * 用法：
 *   node scripts/render-xhs-cards.mjs                       # 打开 http://127.0.0.1:3000/xhs/export/
 *   node scripts/render-xhs-cards.mjs path/to/海报.html      # 渲染本地下载的海报 HTML
 */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = resolve(__dirname, "../output");
const KIND_NAMES = {
  cover: "cover",
  data: "data",
  shift: "shift",
  workspace: "workspace",
  workflow: "workflow",
  principle: "principle",
  division: "division",
  reflection: "reflection",
  end: "end",
};

async function main() {
  const arg = process.argv[2];
  if (arg && !existsSync(arg) && !/^https?:|^file:/.test(arg)) {
    console.error("找不到文件：", arg);
    process.exit(1);
  }
  const target = arg
    ? /^https?:|^file:/.test(arg)
      ? arg
      : "file://" + resolve(arg)
    : "http://127.0.0.1:3000/xhs/export/";

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 2 });
  await page.goto(target, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1200);

  const posters = await page.$$(".poster.xhs");
  if (!posters.length) {
    console.error(
      "未找到 .poster.xhs 海报。请先在网页 /xhs/ 里点「下载海报 HTML」拿到自包含文件，再执行：\n" +
        "  npm run xhs:cards sentinel-xhs-9cards.html\n" +
        "（不带参数时脚本会尝试 http://127.0.0.1:3000/xhs/export/，需先启动 npm run dev 且浏览器里已保存过卡片）"
    );
    await browser.close();
    process.exit(1);
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const names = [];
  for (let i = 0; i < posters.length; i++) {
    const kind = await posters[i].getAttribute("data-kind");
    const name = KIND_NAMES[kind] || "poster";
    names.push(name);
    const idx = String(i + 1).padStart(2, "0");
    const out = resolve(OUTPUT_DIR, `xhs-${idx}-${name}.png`);
    await posters[i].screenshot({ path: out });
    console.log("saved", out);
  }

  const stripHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#1a1a1a;padding:32px;}
    .row{display:flex;flex-wrap:wrap;gap:24px;}
    img{width:270px;height:360px;object-fit:cover;border-radius:8px;}
  </style></head><body><div class="row">
    ${names.map((n, i) => `<img src="xhs-${String(i + 1).padStart(2, "0")}-${n}.png">`).join("")}
  </div></body></html>`;
  const stripFile = resolve(OUTPUT_DIR, "_preview-strip.html");
  writeFileSync(stripFile, stripHtml);
  await page.goto("file://" + stripFile, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const body = await page.$("body");
  await body.screenshot({ path: resolve(OUTPUT_DIR, "preview_全部卡片.png") });
  console.log("saved", resolve(OUTPUT_DIR, "preview_全部卡片.png"));

  await browser.close();
  console.log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
