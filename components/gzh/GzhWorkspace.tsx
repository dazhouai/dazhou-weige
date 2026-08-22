"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mammoth from "mammoth/mammoth.browser";
import TurndownService from "turndown";
import Lenis from "lenis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { CHAPTER_STYLES, type ChapterStyleId, type FixedEnding, type GzhSettings, type IpProfile, type RoleColors } from "@/lib/types";
import { THEMES, getTheme } from "@/lib/themes";
import { DEFAULT_ENDING, DEFAULT_GZH_SETTINGS, DEFAULT_IP_PROFILE, KEYS, load, save } from "@/lib/store";
import { renderWechatArticle } from "@/lib/renderGzh";
import { compressToDataUrl, fetchAsDataUrl } from "@/lib/clientImage";
import { extractIpThemes } from "@/lib/ipColors";
import { autoStructureText, hasMarkdownStructure } from "@/lib/autoStructure";

const DEMO_MD = `# 我为什么要做「大洲微格-公众号智能排版工作台」，以及它到底怎么用

自己开始做公众号后发现最大的痛点是：排版太复杂太慢！AI时代写稿已经变得简单，做过的朋友都知道一句话：写稿很快，但排版半小时，改版又半小时。这篇稿子不聊虚的，就讲两件事——这个项目是怎么来的，以及你拿到手之后 3 分钟怎么用它。

## 先说我为什么要做这个项目

### 排版，是公众号最大的内耗

公众号编辑器没有像样的样式系统：标题要手动加粗、引用要手动调色、代码块粘进去就变形。更麻烦的是微信有一堆**红线规则**——不能用 div、不能用 class、不能有外部样式，样式不对整篇就乱码。

### 市面上的工具，差在哪

- 在线排版网站：要注册、要会员，稿子还要过别人的服务器；
- 手动排版：费时费力，改一次翻车一次；
- 现成模板：好看但千篇一律，换个配色就得重做。

### 大洲微格的三个原则

1. **纯本地**：不注册、不登录、不联网，稿子只存在你自己浏览器里；
2. **合规优先**：输出的就是微信平台认可的 HTML，粘贴即用；
3. **智能兜底**：不接大模型，纯本地规则也能自动编号、自动划重点、自动出标题。

> 排版不是替内容化妆，而是帮助内容建立节奏，让读者知道哪里需要快读，哪里值得停一下。

## 具体怎么用：三步搞定一篇稿子

### 第一步：把稿子扔进来

把 Markdown 直接粘贴到左侧编辑区，或者点「导入 MD / TXT」选择本地文件。哪怕你只有一段**没排版的纯文本**也没关系，点「智能补全结构」，它会自动帮你理出标题和章节：

- 自动识别一级、二级标题层级
- 自动把长段落拆成要点列表
- 自动把流程性内容转成有序步骤

### 第二步：选主题，调到你顺眼

点工具栏的「主题」，7 套风格随便换：摸鱼绿、石墨极简、留白禅意……每套都带完整的配色和字号。想更有个性，去「配色实验室」上传你的 IP 形象图，它会自动提色生成 3 套专属配色。

需要调节奏的地方，工具栏直接拖：

| 调节项 | 作用 |
|---|---|
| 字号 / 行距 | 控制阅读节奏 |
| 章节样式 | 9 种标题装饰任选 |
| 固定结尾 | 签名档一键复用 |
| 爆款标题 | 一键生成 10 个标题候选 |

### 第三步：看合规报告，一键复制

点「合规报告」，确认全绿（无禁用标签、无半角标点、leaf 包裹无遗漏），然后点右上角的「复制到公众号」：

\`\`\`text
复制到公众号 → 打开微信编辑器 → Cmd/Ctrl + V → 发布
\`\`\`

就这么简单。以前要折腾半小时的排版，现在**3 分钟**走完全流程。

## 发布前最后检查一遍

- 标题、章节和二级标题层级是否正确
- 图片是否完整显示，前后是否留有说明
- 引用、表格与所有代码块是否都还在
- 合规报告是否全绿

---

如果你今天只记住一句话：把排版交给工具，把时间留给内容。我是大洲，关注我，学习AI的实际应用。

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

/** DEMO 稿版本号：升级示例稿时 +1，强制覆盖本地旧缓存 */
const DEMO_VERSION = "v4";

function Btn({ onClick, children, primary, danger, small, disabled }: {
  onClick?: () => void;
  children: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={primary ? "default" : danger ? "destructive" : "outline"}
      size={small ? "sm" : "default"}
    >
      {children}
    </Button>
  );
}

function AppDialog({ title, open, onOpenChange, children }: {
  title: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sw-folio !normal-case">{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
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
          className={`rounded-sm border p-3 text-left transition ${
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
      <div className="rounded-sm border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-4">
        <div className="mb-2 text-sm font-semibold">上传 IP 形象，自动提色</div>
        <p className="mb-3 text-xs leading-5 text-[var(--sw-muted)]">
          系统会提取代表色，生成 3 套以「{ip.ipName}」命名的专属配色，并可作为章节小标志。
        </p>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {ip.ipAvatar ? <img src={ip.ipAvatar} alt="IP" className="h-14 w-14 rounded-full object-cover" /> : <div className="h-14 w-14 rounded-full border border-dashed border-[var(--sw-line)]" />}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onUpload(e.target.files?.[0])} />
          <Btn onClick={() => fileRef.current?.click()} primary small={false}>{busy ? "提色中…" : ip.ipAvatar ? "更换形象" : "上传形象"}</Btn>
          <Label className="flex-1">
            <span className="sr-only">IP 名称</span>
            <Input
              value={ip.ipName}
              onChange={(e) => setIp({ ...ip, ipName: e.target.value })}
              placeholder="IP 名称"
            />
          </Label>
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">角色色分配（逐色调整）</div>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_LABELS.map(([k, label]) => (
            <label key={k} className="flex items-center justify-between rounded-sm border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-3 py-2 text-xs">
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

      <div className="flex items-center justify-between text-sm">
        <Label htmlFor="show-ip">章节标题旁显示 IP 小标志</Label>
        <Switch
          id="show-ip"
          checked={settings.showSectionIp}
          onCheckedChange={(v) => setSettings({ ...settings, showSectionIp: v })}
        />
      </div>
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
      <div className="flex items-center justify-between text-sm">
        <Label htmlFor="ending-enabled">启用固定结尾</Label>
        <Switch
          id="ending-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>
      <Textarea
        className="min-h-40"
        value={ending.text}
        onChange={(e) => setEnding({ ...ending, text: e.target.value })}
        placeholder="每一行将作为独立段落渲染…"
      />
      <div className="flex items-center justify-between text-sm">
        <Label htmlFor="ending-avatar">显示头像</Label>
        <Switch
          id="ending-avatar"
          checked={ending.useAvatar}
          onCheckedChange={(v) => setEnding({ ...ending, useAvatar: v })}
        />
      </div>
      <div className="flex gap-2">
        <Btn onClick={() => { setEnding(DEFAULT_ENDING); }}>恢复默认</Btn>
        <Btn onClick={() => { setEnding({ ...ending, text: "", useAvatar: false }); }} danger>清空设置</Btn>
      </div>
    </div>
  );
}

export default function GzhWorkspace() {
  const [md, setMd] = useState("");
  const [settings, setSettings] = useState<GzhSettings>(DEFAULT_GZH_SETTINGS);
  const [ip, setIp] = useState<IpProfile>(DEFAULT_IP_PROFILE);
  const [ending, setEnding] = useState<FixedEnding>(DEFAULT_ENDING);
  const [panel, setPanel] = useState<"theme" | "colorlab" | "ending" | null>(null);
  const [device, setDevice] = useState<"mobile">("mobile");
  const [copied, setCopied] = useState(false);
  const [imageMap] = useState<Record<string, string>>({});
  const mdFileRef = useRef<HTMLInputElement>(null);
  const docxFileRef = useRef<HTMLInputElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const storedVer = window.localStorage.getItem("dazhou-demo-version");
      const md0 = storedVer !== DEMO_VERSION ? DEMO_MD : load(KEYS.gzhDraft, DEMO_MD);
      window.localStorage.setItem("dazhou-demo-version", DEMO_VERSION);
      setMd(md0);
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

  useEffect(() => {
    const el = previewScrollRef.current;
    if (!el) return;
    const content = el.firstElementChild as HTMLElement | null;
    if (!content) return;
    const lenis = new Lenis({
      wrapper: el,
      content,
      duration: 1.1,
      smoothWheel: true,
    });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [device]);

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
    toast(msg);
  };

  const pickTheme = (id: string) => {
    setSettings({ ...settings, themeId: id });
    setPanel(null);
  };

  const importMdFile = async (f: File | undefined) => {
    if (!f) return;
    let text = await f.text();
    let extra = "";
    if (!hasMarkdownStructure(text)) {
      const r = autoStructureText(text);
      text = r.markdown;
      extra = ` · 已智能识别 ${r.headings} 个章节 / ${r.bullets} 条要点 / ${r.ordered} 条步骤`;
    }
    setMd(text);
    notify(`${f.name} · 文本已载入${extra}`);
  };

  const importDocx = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const arr = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer: arr });
      const md = new TurndownService({ headingStyle: "atx" }).turndown(result.value);
      const r = hasMarkdownStructure(md) ? md : autoStructureText(md).markdown;
      setMd(r);
      notify("docx 已转换" + (r !== md ? "，已智能识别结构" : ""));
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

  const smartStructure = () => {
    const r = autoStructureText(md);
    setMd(r.markdown);
    notify(`已智能识别结构：${r.headings} 个章节 / ${r.bullets} 条要点 / ${r.ordered} 条步骤`);
  };

  const previewClass = "mx-auto w-full max-w-[720px] min-h-[600px]";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel)] px-4 py-2 shadow-[var(--sw-shadow)]">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setPanel(panel === "theme" ? null : "theme")}
          >
            <span className="size-2.5 rounded-[2px]" style={{ background: theme.accent }} />
            主题
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPanel(panel === "colorlab" ? null : "colorlab")}>
            配色实验室
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPanel(panel === "ending" ? null : "ending")}>
            固定结尾
          </Button>
        </div>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          字号
          <Slider
            className="w-24"
            min={14}
            max={20}
            step={1}
            value={[settings.fontSize]}
            onValueChange={(v) =>
              setSettings({ ...settings, fontSize: Array.isArray(v) ? v[0] : v })
            }
          />
          <span className="w-8 tabular-nums text-foreground">{settings.fontSize}px</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          行距
          <Slider
            className="w-24"
            min={15}
            max={22}
            step={1}
            value={[Math.round(settings.lineHeight * 10)]}
            onValueChange={(v) =>
              setSettings({
                ...settings,
                lineHeight: (Array.isArray(v) ? v[0] : v) / 10,
              })
            }
          />
          <span className="w-8 tabular-nums text-foreground">{settings.lineHeight}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Label className="text-[11px] text-[var(--sw-muted)]">字体</Label>
          <Select
            value={settings.fontFamily}
            onValueChange={(v) => setSettings({ ...settings, fontFamily: v as GzhSettings["fontFamily"] })}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sans">苹方 / 系统黑体</SelectItem>
              <SelectItem value="heiti">思源黑体</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Label className="text-[11px] text-[var(--sw-muted)]">章节样式</Label>
          <Select
            value={settings.chapterStyle}
            onValueChange={(v) => setSettings({ ...settings, chapterStyle: v as ChapterStyleId })}
          >
            <SelectTrigger className="h-8 w-[190px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAPTER_STYLES.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.mark} · {s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Separator orientation="vertical" className="h-5" />
        <Button variant="outline" size="sm" onClick={() => mdFileRef.current?.click()}>
          导入 MD / TXT
        </Button>
        <Button variant="outline" size="sm" onClick={() => docxFileRef.current?.click()}>
          导入 docx
        </Button>
        <Button variant="outline" size="sm" onClick={smartStructure}>
          智能补全结构
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setMd("")}>
          清空
        </Button>
        <input ref={mdFileRef} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden onChange={(e) => importMdFile(e.target.files?.[0])} />
        <input ref={docxFileRef} type="file" accept=".docx" hidden onChange={(e) => importDocx(e.target.files?.[0])} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
        {/* 左：编辑器 */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel)] shadow-[var(--sw-shadow)]">
          <div className="flex items-center justify-between border-b border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-6 py-2.5">
            <span className="sw-folio">01 · 原稿<span className="ml-2 font-normal normal-case tracking-normal text-[var(--sw-muted)]">MARKDOWN / TXT</span></span>
            <span className="text-[11px] text-[var(--sw-muted)]">{busy ? "转换中…" : "已自动保存"}</span>
          </div>
          <textarea
            className="flex-1 resize-none bg-transparent p-6 font-mono text-[13.5px] leading-[1.85] text-[var(--sw-text)] outline-none placeholder:text-[var(--sw-faint)]"
            value={md}
            onChange={(e) => setMd(e.target.value)}
            placeholder="# 在这里粘贴或编写 Markdown…"
            spellCheck={false}
          />
        </div>

        {/* 右：预览 */}
        <div className="sw-desk flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel-3)] shadow-[var(--sw-shadow)]">
          <div className="flex items-center justify-between border-b border-[var(--sw-line)] bg-[var(--sw-panel)] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="sw-folio">02 · 预览</span>
              <ToggleGroup
                value={["mobile"]}
                onValueChange={() => setDevice("mobile")}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="mobile">手机</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <ShimmerButton
                onClick={copyToWechat}
                shimmerColor="#8ab4ff"
                shimmerSize="0.06em"
                borderRadius="6px"
                background="var(--primary)"
                className="h-8 px-4 text-xs font-semibold text-primary-foreground"
              >
                {copied ? "已复制" : "复制到公众号"}
              </ShimmerButton>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--sw-line)] bg-[var(--sw-panel)] px-4 py-2">
            <span className="sw-folio">
              字数 <NumberTicker value={output.words} className="tabular-nums text-foreground" /> · 约{" "}
              <NumberTicker value={output.minutes} className="tabular-nums text-foreground" /> 分钟
            </span>
            <span className="sw-folio">
              <NumberTicker value={output.codeBlocks} className="tabular-nums text-foreground" /> 代码块 ·{" "}
              <NumberTicker value={output.images.length} className="tabular-nums text-foreground" /> 图
            </span>
          </div>
          <div ref={previewScrollRef} className="min-h-0 flex-1 overflow-y-auto p-6">
            <section id="gzh-preview" className={`wechat-preview rounded-sm ${previewClass}`} style={{ padding: "28px 20px" }}>
              <section dangerouslySetInnerHTML={{ __html: output.html }} />
            </section>
          </div>
        </div>
      </div>

      {panel === "theme" && (
        <AppDialog title="01 · 选择主题" open={panel === "theme"} onOpenChange={(v) => !v && setPanel(null)}>
          <ThemePanel settings={settings} ip={ip} onPick={pickTheme} />
        </AppDialog>
      )}
      {panel === "colorlab" && (
        <AppDialog title="02 · 配色实验室" open={panel === "colorlab"} onOpenChange={(v) => !v && setPanel(null)}>
          <ColorLabPanel settings={settings} setSettings={setSettings} ip={ip} setIp={(p) => { setIp(p); save(KEYS.ipProfile, p); }} />
        </AppDialog>
      )}
      {panel === "ending" && (
        <AppDialog title="03 · 固定结尾" open={panel === "ending"} onOpenChange={(v) => !v && setPanel(null)}>
          <EndingPanel ending={ending} setEnding={(e) => { setEnding(e); save(KEYS.gzhEnding, e); }} enabled={settings.endingEnabled} setEnabled={(v) => setSettings({ ...settings, endingEnabled: v })} />
        </AppDialog>
      )}
    </div>
  );
}
