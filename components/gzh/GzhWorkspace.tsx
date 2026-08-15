"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import mammoth from "mammoth/mammoth.browser";
import TurndownService from "turndown";
import { CHAPTER_STYLES, type ChapterStyleId, type FixedEnding, type GzhSettings, type IpProfile, type RoleColors } from "@/lib/types";
import { THEMES, getTheme } from "@/lib/themes";
import { DEFAULT_ENDING, DEFAULT_GZH_SETTINGS, DEFAULT_IP_PROFILE, KEYS, load, save } from "@/lib/store";
import { renderWechatArticle, type GzhOutput } from "@/lib/renderGzh";
import { generateTitles } from "@/lib/titles";
import { compressToDataUrl, fetchAsDataUrl } from "@/lib/clientImage";
import { extractIpThemes } from "@/lib/ipColors";

const DEMO_MD = `# 一篇示例，完整看懂 Sentinel微排版

这不是一篇普通占位稿，而是一份可以直接检查排版能力的**全功能示例**。你会依次看到章节、二级标题、列表、引用、图片、行内代码、表格与代码块。正文默认保持舒展的阅读节奏，工具栏里可以切换字号、行距、字体和正文颜色，也可以选中预览里的文字单独强调。

## 先把文章结构搭清楚

### 普通二级标题

二级标题会自动加粗，并在左侧使用一条主题色竖线。它负责提示“这一小节在讲什么”。

### 分论点示例

标题：帮助读者快速判断这一节是否值得继续读；
引用：让一句重要判断拥有停顿和呼吸；
列表：把并列信息整理成清楚的阅读路径。

### 多级嵌套列表示例

- 一段只表达一个核心意思
- 重要结论适度加粗
  - 只加粗**关键词**，不要整段加粗
  - 一段最多突出一到两个重点
- 图片前后留白
  1. 图片前先说明它解决什么问题
  2. 图片后补充一句结论或观察

### 引用示例

> 排版不是替内容化妆，而是帮助内容建立节奏，让读者知道哪里需要快读，哪里值得停一下。

## 让图片、序号与代码各司其职

### 1. 有序分论点示例

1. 粘贴 Markdown，或导入文章包与本地图片。
2. 在配色实验室里选主题，再设置章节样式。
3. 检查预览与合规报告，一键复制到公众号。

### 2. 行内代码与链接

文件名、命令或字段可以写成行内代码，例如 \`publish-copy.md\`。需要补充来源时，也可以插入[文字链接](https://mp.weixin.qq.com/)；已经失效的内容还可以使用 ~~删除线~~ 标记。

### 3. 代码块示例

\`\`\`bash
npm run dev
npm run xhs:cards
\`\`\`

\`\`\`javascript
const article = {
  title: "我的公众号文章",
  status: "ready",
  publish() {
    return "复制到公众号";
  }
};
\`\`\`

## 用表格和检查清单收尾

### 表格示例

| 排版元素 | 适合表达 | 默认视觉 |
|---|---|---|
| 引用 | 金句、定义 | 主题色竖线与浅色背景 |
| 列表 | 步骤、要点 | 主题色序号或实心点 |
| 行内代码 | 文件名、命令 | 高对比文字与浅色涂层 |
| 代码块 | 程序、流程 | 深色窗口与主题色底 |

### 发布前检查

- 标题、章节和二级标题层级是否正确
- 图片是否完整显示，前后是否留有说明
- 引用、表格与所有代码块是否都还在
- 合规报告是否全绿

---

最后，点击预览栏里的「复制到公众号」，再粘贴到微信公众号编辑器中。现在你看到的，才是一份真正覆盖 Sentinel微排主要能力的示例。

## 结语：让排版回归内容

好的排版不是越花越好，而是让读者知道哪里快读、哪里值得停一下。把这件事交给工具，把时间留给内容。
`;

const ROLE_LABELS: [keyof RoleColors, string][] = [
  ["title", "标题"],
  ["bold", "重点加粗"],
  ["decoration", "装饰"],
  ["divider", "分割线"],
  ["list", "列表标记"],
  ["code", "代码"],
  ["table", "表格"],
  ["inlineText", "行内代码"],
  ["inlineShadow", "行内底色"],
  ["quote", "引用"],
];

function Btn({ onClick, children, primary, danger, small, disabled }: {
  onClick?: () => void;
  children: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border font-medium transition ${
        small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${
        primary
          ? "border-transparent bg-[var(--sw-accent)] text-black hover:brightness-110"
          : danger
            ? "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            : "border-[var(--sw-line)] bg-[var(--sw-panel-2)] text-[var(--sw-text)] hover:border-[var(--sw-muted)]"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function Panel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--sw-line)] bg-[var(--sw-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--sw-line)] px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-[var(--sw-muted)] hover:text-white">✕</button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function ThemePanel({ settings, ip, onPick }: {
  settings: GzhSettings;
  ip: IpProfile;
  onPick: (id: string) => void;
}) {
  const all = [...THEMES, ...ip.ipThemes];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {all.map((t) => (
        <button
          key={t.id}
          onClick={() => onPick(t.id)}
          className={`rounded-lg border p-3 text-left transition ${
            settings.themeId === t.id
              ? "border-[var(--sw-accent)] bg-[var(--sw-accent)]/10"
              : "border-[var(--sw-line)] bg-[var(--sw-panel-2)] hover:border-[var(--sw-muted)]"
          }`}
        >
          <span className="mb-2 block h-2 w-10 rounded-full" style={{ background: t.accent }} />
          <div className="text-sm font-semibold">{t.name}</div>
          <div className="mt-0.5 text-[11px] leading-4 text-[var(--sw-muted)]">{t.scene}</div>
        </button>
      ))}
    </div>
  );
}

function ColorLabPanel({ settings, setSettings, ip, setIp }: {
  settings: GzhSettings;
  setSettings: (s: GzhSettings) => void;
  ip: IpProfile;
  setIp: (p: IpProfile) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onUpload = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const { avatar, themes } = await extractIpThemes(f, ip.ipName);
      const next: IpProfile = { ...ip, ipImage: avatar, ipAvatar: avatar, ipThemes: themes, savedIpTheme: themes[0]?.id };
      setIp(next);
      save(KEYS.ipProfile, next);
      if (themes[0]) setSettings({ ...settings, themeId: themes[0].id });
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const setRole = (k: keyof RoleColors, v: string) => {
    const roleColors = { ...settings.roleColors, [k]: v };
    setSettings({ ...settings, roleColors });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-4">
        <div className="mb-2 text-sm font-semibold">上传 IP 形象，自动提色</div>
        <p className="mb-3 text-xs leading-5 text-[var(--sw-muted)]">
          系统会提取代表色，生成 3 套以「{ip.ipName}」命名的专属配色，并可作为章节小标志。
        </p>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {ip.ipAvatar ? <img src={ip.ipAvatar} alt="IP" className="h-14 w-14 rounded-full object-cover" /> : <div className="h-14 w-14 rounded-full border border-dashed border-[var(--sw-line)]" />}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onUpload(e.target.files?.[0])} />
          <Btn onClick={() => fileRef.current?.click()} primary small={false}>{busy ? "提色中…" : ip.ipAvatar ? "更换形象" : "上传形象"}</Btn>
          <input
            className="flex-1 rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel)] px-2 py-1.5 text-sm"
            value={ip.ipName}
            onChange={(e) => setIp({ ...ip, ipName: e.target.value })}
            placeholder="IP 名称"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">角色色分配（逐色调整）</div>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_LABELS.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-3 py-2 text-xs">
              <span>{label}</span>
              <input
                type="color"
                value={settings.roleColors[k] || getTheme(settings.themeId).roles[k]}
                onChange={(e) => setRole(k, e.target.value)}
                className="h-6 w-8 cursor-pointer rounded"
              />
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={settings.showSectionIp} onChange={(e) => setSettings({ ...settings, showSectionIp: e.target.checked })} className="accent-[var(--sw-accent)]" />
        章节标题旁显示 IP 小标志
      </label>
    </div>
  );
}

function EndingPanel({ ending, setEnding, enabled, setEnabled }: {
  ending: FixedEnding;
  setEnding: (e: FixedEnding) => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs leading-5 text-[var(--sw-muted)]">
        固定结尾会继承当前文章的主题与字体，用分割线与正文隔开，并随正文一起复制到公众号。
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-[var(--sw-accent)]" />
        启用固定结尾
      </label>
      <textarea
        className="h-40 w-full rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-3 text-sm leading-6"
        value={ending.text}
        onChange={(e) => setEnding({ ...ending, text: e.target.value })}
        placeholder="每一行将作为独立段落渲染…"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ending.useAvatar} onChange={(e) => setEnding({ ...ending, useAvatar: e.target.checked })} className="accent-[var(--sw-accent)]" />
        显示头像
      </label>
      <div className="flex gap-2">
        <Btn onClick={() => { setEnding(DEFAULT_ENDING); }}>恢复默认</Btn>
        <Btn onClick={() => { setEnding({ ...ending, text: "", useAvatar: false }); }} danger>清空设置</Btn>
      </div>
    </div>
  );
}

function TitlePanel({ md }: { md: string }) {
  const titles = useMemo(() => generateTitles(md), [md]);
  const [copied, setCopied] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-xs leading-5 text-[var(--sw-muted)]">本地规则生成，覆盖 4 个角度；首选标题标 ⭐。</p>
      {titles.map((t) => (
        <div key={t.title} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${t.preferred ? "border-[var(--sw-accent)]/60 bg-[var(--sw-accent)]/10" : "border-[var(--sw-line)] bg-[var(--sw-panel-2)]"}`}>
          <span className="flex-1">
            {t.preferred ? <span className="mr-1.5">⭐</span> : null}
            {t.title}
            <span className="ml-2 text-[10px] text-[var(--sw-muted)]">{t.angle}</span>
          </span>
          <button
            className="text-xs text-[var(--sw-accent)] hover:underline"
            onClick={async () => {
              await navigator.clipboard.writeText(t.title);
              setCopied(t.title);
              setTimeout(() => setCopied(""), 1200);
            }}
          >
            {copied === t.title ? "已复制" : "复制"}
          </button>
        </div>
      ))}
    </div>
  );
}

function CompliancePanel({ output }: { output: GzhOutput }) {
  const r = output.report;
  return (
    <div className="space-y-3 text-sm">
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${r.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
        {r.ok ? "✓ 校验通过，可以安全复制" : `✗ 还有 ${r.errors} 处需要处理`}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-3">
          <div className="font-semibold text-[var(--sw-muted)]">leaf 包裹</div>
          <div className="mt-1 text-lg font-bold">{r.leafIssues === 0 ? "0 遗漏" : `${r.leafIssues} 处`}</div>
        </div>
        <div className="rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-3">
          <div className="font-semibold text-[var(--sw-muted)]">禁用标签/样式</div>
          <div className="mt-1 text-lg font-bold">{r.forbiddenTags.length + r.forbiddenCss.length === 0 ? "0 项" : `${r.forbiddenTags.length + r.forbiddenCss.length} 项`}</div>
        </div>
        <div className="rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-3">
          <div className="font-semibold text-[var(--sw-muted)]">半角标点</div>
          <div className="mt-1 text-lg font-bold">{r.punctuationIssues.length === 0 ? "0 处" : `${r.punctuationIssues.length} 处`}</div>
        </div>
        <div className="rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-3">
          <div className="font-semibold text-[var(--sw-muted)]">图片</div>
          <div className="mt-1 text-lg font-bold">
            {r.images.total === 0 ? "无" : `${r.images.embedded}/${r.images.total} 已内嵌`}
          </div>
        </div>
      </div>
      {(r.forbiddenTags.length > 0 || r.forbiddenCss.length > 0) && (
        <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300">
          发现：{[...r.forbiddenTags, ...r.forbiddenCss].join("、")}
        </div>
      )}
      {r.punctuationIssues.length > 0 && (
        <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-200">
          半角标点位置：{r.punctuationIssues.slice(0, 5).map((p) => `「${p.text}」`).join(" ")}
        </div>
      )}
      <div className="text-xs leading-5 text-[var(--sw-muted)]">
        统计：{output.words} 字 · 约 {output.minutes} 分钟阅读 · {output.codeBlocks} 个代码块 · {output.images.length} 张图
      </div>
    </div>
  );
}

export default function GzhWorkspace() {
  const [md, setMd] = useState("");
  const [settings, setSettings] = useState<GzhSettings>(DEFAULT_GZH_SETTINGS);
  const [ip, setIp] = useState<IpProfile>(DEFAULT_IP_PROFILE);
  const [ending, setEnding] = useState<FixedEnding>(DEFAULT_ENDING);
  const [panel, setPanel] = useState<"theme" | "colorlab" | "ending" | "titles" | "compliance" | null>(null);
  const [device, setDevice] = useState<"desktop" | "focus" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const mdFileRef = useRef<HTMLInputElement>(null);
  const pkgFileRef = useRef<HTMLInputElement>(null);
  const rtFileRef = useRef<HTMLInputElement>(null);
  const docxFileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setMd(load(KEYS.gzhDraft, DEMO_MD));
      setSettings(load(KEYS.gzhSettings, DEFAULT_GZH_SETTINGS));
      setIp(load(KEYS.ipProfile, DEFAULT_IP_PROFILE));
      setEnding(load(KEYS.gzhEnding, DEFAULT_ENDING));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => save(KEYS.gzhDraft, md), 500);
    return () => clearTimeout(t);
  }, [md]);

  useEffect(() => {
    const t = setTimeout(() => save(KEYS.gzhSettings, settings), 400);
    return () => clearTimeout(t);
  }, [settings]);

  const theme = useMemo(() => {
    const base = getTheme(settings.themeId);
    const custom = ip.ipThemes.find((t) => t.id === settings.themeId);
    return { ...(custom || base), roles: { ...(custom || base).roles, ...settings.roleColors } };
  }, [settings.themeId, settings.roleColors, ip.ipThemes]);

  const resolvedMd = useMemo(() => {
    let out = md;
    for (const [name, url] of Object.entries(imageMap)) {
      out = out.split(`(${name})`).join(`(${url})`);
    }
    return out;
  }, [md, imageMap]);

  const output = useMemo(
    () => renderWechatArticle(resolvedMd, settings, theme, ip, ending),
    [resolvedMd, settings, theme, ip, ending]
  );

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const pickTheme = (id: string) => {
    setSettings({ ...settings, themeId: id });
    setPanel(null);
  };

  const importMdFile = async (f: File | undefined) => {
    if (!f) return;
    setMd(await f.text());
    notify(`${f.name} · 文本已载入`);
  };

  const importPackage = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    const mdFile = list
      .filter((f) => /\.(md|markdown|txt)$/i.test(f.name))
      .sort((a, b) => b.size - a.size)[0];
    if (!mdFile) {
      notify("所选文件夹中没有找到 Markdown 或 TXT 文件");
      return;
    }
    const base = (mdFile.webkitRelativePath || mdFile.name).includes("/")
      ? (mdFile.webkitRelativePath || mdFile.name).slice(0, (mdFile.webkitRelativePath || mdFile.name).lastIndexOf("/") + 1)
      : "";
    const map: Record<string, string> = {};
    for (const f of list) {
      if (!/^image\//.test(f.type) && !/\.(png|jpe?g|gif|webp|svg)$/i.test(f.name)) continue;
      const url = URL.createObjectURL(f);
      const rel = f.webkitRelativePath || f.name;
      const short = rel.startsWith(base) ? rel.slice(base.length) : rel;
      map[`./${short}`] = url;
      map[short] = url;
      map[f.name] = url;
    }
    setImageMap((old) => ({ ...old, ...map }));
    setMd(await mdFile.text());
    notify(`${mdFile.name} · ${Object.keys(map).length} 张图片已载入`);
  };

  const importRichText = async (f: File | undefined) => {
    if (f) {
      const text = await f.text();
      setMd(new TurndownService({ headingStyle: "atx" }).turndown(text));
      notify("富文本已转 Markdown");
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      setMd(new TurndownService({ headingStyle: "atx" }).turndown(text));
      notify("剪贴板富文本已转 Markdown");
    } catch {
      notify("无法读取剪贴板，请直接粘贴到左侧编辑区");
    }
  };

  const importDocx = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const arr = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer: arr });
      setMd(new TurndownService({ headingStyle: "atx" }).turndown(result.value));
      notify("docx 已转换");
    } catch (e) {
      console.error(e);
      notify("docx 转换失败");
    } finally {
      setBusy(false);
    }
  };

  const copyToWechat = async () => {
    try {
      let html = output.html;
      for (const img of output.images) {
        if (/^(blob:)/.test(img.src) || img.src.startsWith("data:")) {
          try {
            const data = img.src.startsWith("data:") ? img.src : await fetchAsDataUrl(img.src);
            const compressed = await compressToDataUrl(data);
            html = html.split(img.src).join(compressed);
          } catch {
            /* 图片加载失败则保持原样 */
          }
        }
      }
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([new DOMParser().parseFromString(html, "text/html").body.textContent || ""], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      setCopied(true);
      notify("已复制，去公众号编辑器粘贴");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级：选中预览内容复制
      try {
        const sel = window.getSelection();
        const range = document.createRange();
        const el = document.getElementById("gzh-preview");
        if (sel && el) {
          range.selectNodeContents(el);
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand("copy");
          sel.removeAllRanges();
          notify("已用降级方式复制");
        }
      } catch {
        notify("复制未成功，请选中右侧预览内容手动复制");
      }
    }
  };

  const downloadWechatImages = async () => {
    const localImages = output.images.filter((i) => i.src.startsWith("blob:"));
    if (!localImages.length) {
      notify("当前没有本地图片需要导出");
      return;
    }
    const zip = new JSZip();
    for (const img of localImages) {
      try {
        const blob = await (await fetch(img.src)).blob();
        const name = `wechat-image-${localImages.indexOf(img) + 1}.${blob.type === "image/png" ? "png" : "jpg"}`;
        zip.file(name, blob);
      } catch {
        /* skip */
      }
    }
    const out = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out);
    a.download = "微信图片.zip";
    a.click();
    notify("微信图片包已下载");
  };

  const previewClass =
    device === "mobile" ? "mx-auto w-[375px] min-h-[600px]" : device === "focus" ? "mx-auto w-[640px] min-h-[600px]" : "w-full min-h-[600px]";

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--sw-line)] bg-[var(--sw-panel)] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            className="flex items-center gap-2 rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-sm"
            onClick={() => setPanel(panel === "theme" ? null : "theme")}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: theme.accent }} />
            主题
          </button>
          <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-sm" onClick={() => setPanel(panel === "colorlab" ? null : "colorlab")}>
            配色实验室
          </button>
          <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-sm" onClick={() => setPanel(panel === "ending" ? null : "ending")}>
            固定结尾
          </button>
          <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-sm" onClick={() => setPanel(panel === "titles" ? null : "titles")}>
            爆款标题
          </button>
          <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-sm" onClick={() => setPanel(panel === "compliance" ? null : "compliance")}>
            合规报告
          </button>
        </div>
        <div className="mx-1 h-5 w-px bg-[var(--sw-line)]" />
        <label className="flex items-center gap-1.5 text-xs text-[var(--sw-muted)]">
          字号
          <input type="range" min={14} max={20} value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-20 accent-[var(--sw-accent)]" />
          <span className="w-8 text-[var(--sw-text)]">{settings.fontSize}px</span>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[var(--sw-muted)]">
          行距
          <input type="range" min={15} max={22} step={1} value={Math.round(settings.lineHeight * 10)} onChange={(e) => setSettings({ ...settings, lineHeight: Number(e.target.value) / 10 })} className="w-20 accent-[var(--sw-accent)]" />
          <span className="w-8 text-[var(--sw-text)]">{settings.lineHeight}</span>
        </label>
        <select
          className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2 py-1.5 text-xs"
          value={settings.fontFamily}
          onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value as GzhSettings["fontFamily"] })}
        >
          <option value="sans">苹方/系统黑体</option>
          <option value="heiti">思源黑体</option>
        </select>
        <select
          className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2 py-1.5 text-xs"
          value={settings.chapterStyle}
          onChange={(e) => setSettings({ ...settings, chapterStyle: e.target.value as ChapterStyleId })}
        >
          {CHAPTER_STYLES.map((s) => (
            <option key={s.id} value={s.id}>{s.mark} · {s.name}</option>
          ))}
        </select>
        <div className="mx-1 h-5 w-px bg-[var(--sw-line)]" />
        <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-xs" onClick={() => mdFileRef.current?.click()}>
          导入 MD / TXT
        </button>
        <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-xs" onClick={() => pkgFileRef.current?.click()}>
          导入文章包
        </button>
        <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-xs" onClick={() => rtFileRef.current?.click()}>
          导入富文本
        </button>
        <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-xs" onClick={() => docxFileRef.current?.click()}>
          导入 docx
        </button>
        <button className="rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300" onClick={() => setMd("")}>
          清空
        </button>
        <input ref={mdFileRef} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden onChange={(e) => importMdFile(e.target.files?.[0])} />
        <input ref={pkgFileRef} type="file" multiple hidden webkitdirectory="" directory="" onChange={(e) => importPackage(e.target.files)} />
        <input ref={rtFileRef} type="file" accept=".html,.htm,text/html" hidden onChange={(e) => importRichText(e.target.files?.[0])} />
        <input ref={docxFileRef} type="file" accept=".docx" hidden onChange={(e) => importDocx(e.target.files?.[0])} />
      </div>

      <div className="grid flex-1 grid-cols-2 overflow-hidden">
        {/* 左：编辑器 */}
        <div className="flex flex-col border-r border-[var(--sw-line)]">
          <div className="flex items-center justify-between border-b border-[var(--sw-line)] px-3 py-1.5 text-[11px] text-[var(--sw-muted)]">
            <span>MARKDOWN / TXT 原稿</span>
            <span>{busy ? "转换中…" : "已自动保存"}</span>
          </div>
          <textarea
            className="flex-1 bg-transparent p-4 font-mono text-[13px] leading-6 text-[var(--sw-text)] outline-none placeholder:text-[var(--sw-muted)]"
            value={md}
            onChange={(e) => setMd(e.target.value)}
            placeholder="# 在这里粘贴或编写 Markdown…"
            spellCheck={false}
          />
        </div>

        {/* 右：预览 */}
        <div className="flex flex-col bg-[#101418]">
          <div className="flex items-center justify-between border-b border-[var(--sw-line)] px-3 py-1.5">
            <div className="flex gap-1 rounded-md border border-[var(--sw-line)] p-0.5 text-[11px]">
              {(["desktop", "focus", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  className={`rounded px-2 py-1 ${device === d ? "bg-[var(--sw-panel-2)] text-white" : "text-[var(--sw-muted)]"}`}
                >
                  {{ desktop: "公众号", focus: "专注", mobile: "手机" }[d]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadWechatImages}
                className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1 text-xs"
                title="导出本地图片为微信图片包"
              >
                微信图片
              </button>
              <button
                onClick={copyToWechat}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${copied ? "bg-emerald-500 text-black" : "bg-[var(--sw-accent)] text-black hover:brightness-110"}`}
              >
                {copied ? "已复制 ✓" : "复制到公众号"}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <section id="gzh-preview" className={`wechat-preview rounded-lg shadow-2xl ${previewClass}`} style={{ padding: "28px 20px" }}>
              <section dangerouslySetInnerHTML={{ __html: output.html }} />
            </section>
          </div>
        </div>
      </div>

      {panel === "theme" && (
        <Panel title="选择主题" onClose={() => setPanel(null)}>
          <ThemePanel settings={settings} ip={ip} onPick={pickTheme} />
        </Panel>
      )}
      {panel === "colorlab" && (
        <Panel title="配色实验室" onClose={() => setPanel(null)}>
          <ColorLabPanel settings={settings} setSettings={setSettings} ip={ip} setIp={(p) => { setIp(p); save(KEYS.ipProfile, p); }} />
        </Panel>
      )}
      {panel === "ending" && (
        <Panel title="固定结尾" onClose={() => setPanel(null)}>
          <EndingPanel ending={ending} setEnding={(e) => { setEnding(e); save(KEYS.gzhEnding, e); }} enabled={settings.endingEnabled} setEnabled={(v) => setSettings({ ...settings, endingEnabled: v })} />
        </Panel>
      )}
      {panel === "titles" && (
        <Panel title="爆款标题（本地生成）" onClose={() => setPanel(null)}>
          <TitlePanel md={md} />
        </Panel>
      )}
      {panel === "compliance" && (
        <Panel title="合规报告" onClose={() => setPanel(null)}>
          <CompliancePanel output={output} />
        </Panel>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-black/85 px-4 py-2 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
