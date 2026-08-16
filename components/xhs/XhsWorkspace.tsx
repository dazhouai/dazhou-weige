"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Poster, PosterKind, XhsCopy, XhsProfile } from "@/lib/types";
import { DEFAULT_POSTERS, DEFAULT_XHS_COPY, DEFAULT_XHS_PROFILE, KEYS, load, save } from "@/lib/store";
import { generateXhsCopy } from "@/lib/xhsCopy";
import { splitToPosters, reorderPosters } from "@/lib/xhsSplit";
import { buildPosterHtml } from "@/lib/posters";
import { getTheme } from "@/lib/themes";
import { autoStructureText, hasMarkdownStructure } from "@/lib/autoStructure";

const KIND_NAMES: Record<PosterKind, string> = {
  cover: "封面",
  data: "数据",
  shift: "痛点/翻车",
  workspace: "方法/工作区",
  workflow: "流程/步骤",
  principle: "原理/心法",
  division: "分类/对比",
  reflection: "反思/避坑",
  end: "尾卡 CTA",
};

const KIND_ORDER: PosterKind[] = ["cover", "data", "shift", "workspace", "workflow", "principle", "division", "reflection", "end"];

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
      className={`rounded-sm border font-medium transition ${
        small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${
        primary
          ? "border-transparent bg-[var(--sw-accent)] text-white hover:opacity-90"
          : danger
            ? "border-[var(--sw-danger)]/40 bg-[var(--sw-danger)]/5 text-[var(--sw-danger)] hover:bg-[var(--sw-danger)]/10"
            : "border-[var(--sw-line)] bg-white text-[var(--sw-text)] hover:border-[var(--sw-text)]"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function CopyPanel({ copy, setCopy }: { copy: XhsCopy; setCopy: (c: XhsCopy) => void }) {
  const [copied, setCopied] = useState("");
  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 1200);
    });
  };
  const full = [copy.preferredTitle, "", copy.body, "", ...copy.tags].join("\n");
  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">标题候选（≤20 字）</h3>
          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => copyText("titles", copy.titles.join("\n"))}>
            {copied === "titles" ? "已复制" : "复制全部"}
          </Button>
        </div>
        <div className="space-y-1.5">
          {copy.titles.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                className="flex-1"
                value={t}
                onChange={(e) => {
                  const titles = [...copy.titles];
                  titles[i] = e.target.value;
                  setCopy({ ...copy, titles, preferredTitle: i === 0 ? e.target.value : copy.preferredTitle });
                }}
              />
              {i === 0 && <Badge>主推</Badge>}
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => copyText(`t${i}`, t)}>
                {copied === `t${i}` ? "✓" : "复制"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">正文（小红书口语体）</h3>
          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => copyText("body", copy.body)}>
            {copied === "body" ? "已复制" : "复制正文"}
          </Button>
        </div>
        <Textarea
          className="min-h-72 leading-6"
          value={copy.body}
          onChange={(e) => setCopy({ ...copy, body: e.target.value })}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">话题标签（8–10 个）</h3>
          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => copyText("tags", copy.tags.join(" "))}>
            {copied === "tags" ? "已复制" : "复制标签"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {copy.tags.map((t, i) => (
            <span key={i} className="flex items-center gap-1 rounded-full border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1 text-xs">
              {t}
              <button className="text-[var(--sw-muted)] hover:text-[var(--sw-danger)]" onClick={() => setCopy({ ...copy, tags: copy.tags.filter((_, j) => j !== i) })}><X size={11} /></button>
            </span>
          ))}
          <input
            className="w-28 rounded-full border border-dashed border-[var(--sw-line)] bg-transparent px-2.5 py-1 text-xs outline-none"
            placeholder="+#标签"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) setCopy({ ...copy, tags: [...copy.tags, v.startsWith("#") ? v : `#${v}`] });
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">发布建议（不入正文）</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["time", "coverNote", "comment", "repost"] as const).map((k) => (
            <label key={k} className="rounded-sm border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-2.5 text-xs">
              <span className="mb-1 block text-[var(--sw-muted)]">
                {{ time: "发布时间", coverNote: "首图注意", comment: "评论预埋", repost: "二次分发" }[k]}
              </span>
              <input className="w-full bg-transparent text-[var(--sw-text)] outline-none" value={copy.tips[k]} onChange={(e) => setCopy({ ...copy, tips: { ...copy.tips, [k]: e.target.value } })} />
            </label>
          ))}
        </div>
      </div>

      <Btn primary onClick={() => copyText("full", full)}>
        {copied === "full" ? "已复制 ✓" : "一键复制：标题+正文+标签"}
      </Btn>
    </div>
  );
}

function PosterEditor({ poster, onChange }: { poster: Poster; onChange: (p: Poster) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card>
      <button className={cn("flex w-full items-center justify-between px-4 py-3 text-left")} onClick={() => setExpanded(!expanded)}>
        <span className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{KIND_NAMES[poster.kind]}</Badge>
          <span className="font-medium">{poster.title || "（未填标题）"}</span>
        </span>
        <span className="text-xs text-[var(--sw-muted)]">{expanded ? "收起" : "编辑"}</span>
      </button>
      {expanded && (
        <CardContent className="space-y-2 border-t border-border pt-3">
          <Input className="w-full" value={poster.title} placeholder="标题" onChange={(e) => onChange({ ...poster, title: e.target.value })} />
          {(poster.kind === "cover" || poster.kind === "data" || poster.kind === "shift" || poster.kind === "workspace" || poster.kind === "principle" || poster.kind === "reflection") && (
            <Textarea className="h-24 w-full" value={poster.lines.join("\n")} placeholder="每行一条内容" onChange={(e) => onChange({ ...poster, lines: e.target.value.split("\n") })} />
          )}
          {(poster.kind === "workflow") && (
            <Textarea className="h-24 w-full" value={(poster.steps || []).map((s) => s.text).join("\n")} placeholder="每行一步" onChange={(e) => onChange({ ...poster, steps: e.target.value.split("\n").filter(Boolean).map((text, i) => ({ num: String(i + 1), text })) })} />
          )}
          {(poster.kind === "division") && (
            <Textarea className="h-20 w-full" value={(poster.comparison || []).join("\n")} placeholder="第一行：没做…；第二行：做了…" onChange={(e) => onChange({ ...poster, comparison: e.target.value.split("\n").filter(Boolean) })} />
          )}
          {(poster.kind === "end") && (
            <>
              <Textarea className="h-20 w-full" value={(poster.fitItems || []).join("\n")} placeholder="适合谁（每行一条）" onChange={(e) => onChange({ ...poster, fitItems: e.target.value.split("\n").filter(Boolean) })} />
              <Input className="w-full" value={poster.notFitItem || ""} placeholder="不适合谁" onChange={(e) => onChange({ ...poster, notFitItem: e.target.value })} />
              <Textarea className="h-16 w-full" value={(poster.ctaItems || []).join("\n")} placeholder="CTA（每行一条）" onChange={(e) => onChange({ ...poster, ctaItems: e.target.value.split("\n").filter(Boolean) })} />
            </>
          )}
          <div className="flex gap-2">
            <Input className="flex-1" value={poster.footer || ""} placeholder="页脚（默认 @账号）" onChange={(e) => onChange({ ...poster, footer: e.target.value })} />
            <Button variant="outline" size="sm" onClick={() => onChange({ ...poster, footer: undefined })}>
              默认页脚
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function XhsWorkspace() {
  const [tab, setTab] = useState<"copy" | "cards">("copy");
  const [md, setMd] = useState("");
  const [copy, setCopy] = useState<XhsCopy>(DEFAULT_XHS_COPY);
  const [posters, setPosters] = useState<Poster[]>(DEFAULT_POSTERS);
  const [profile, setProfile] = useState<XhsProfile>(DEFAULT_XHS_PROFILE);
  const [copyDirty, setCopyDirty] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const mdFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setMd(load(KEYS.xhsDraft, ""));
      setCopy(load(KEYS.xhsCopy, DEFAULT_XHS_COPY));
      setPosters(load(KEYS.xhsPosters, DEFAULT_POSTERS));
      setProfile(load(KEYS.xhsProfile, DEFAULT_XHS_PROFILE));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => save(KEYS.xhsDraft, md), 400);
    return () => clearTimeout(t);
  }, [md]);

  useEffect(() => {
    const t = setTimeout(() => save(KEYS.xhsCopy, copy), 400);
    return () => clearTimeout(t);
  }, [copy]);

  useEffect(() => {
    const t = setTimeout(() => save(KEYS.xhsPosters, posters), 400);
    return () => clearTimeout(t);
  }, [posters]);

  const theme = useMemo(() => getTheme(profile.themeId), [profile.themeId]);

  const regenerate = (source = md) => {
    if (!source.trim()) return;
    if (!copyDirty) setCopy(generateXhsCopy(source, profile));
    setPosters(splitToPosters(source, profile));
  };

  useEffect(() => {
    if (!md.trim()) return;
    const t = setTimeout(() => {
      if (!copyDirty && copy.body === "") regenerate(md);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [md]);

  const notify = (msg: string) => {
    toast(msg);
  };

  const importGzhDraft = () => {
    const gzh = load<string>(KEYS.gzhDraft, "");
    if (!gzh) {
      notify("公众号草稿为空，先去公众号模式写点内容");
      return;
    }
    setMd(gzh);
    setCopyDirty(false);
    regenerate(gzh);
    notify("已导入公众号草稿并重新拆文");
  };

  const downloadPosterHtml = () => {
    const html = buildPosterHtml(posters, theme);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sentinel-xhs-${posters.length}cards.html`;
    a.click();
    notify("海报 HTML 已下载，运行 npm run xhs:cards 生成 PNG");
  };

  const changePoster = (i: number, p: Poster) => {
    const next = [...posters];
    next[i] = p;
    setPosters(next);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--sw-line)] bg-[var(--sw-panel)] px-3 py-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "copy" | "cards")}>
          <TabsList>
            <TabsTrigger value="copy">文案</TabsTrigger>
            <TabsTrigger value="cards">图文卡片</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={importGzhDraft}>
          从公众号草稿导入
        </Button>
        <Button variant="outline" size="sm" onClick={() => mdFileRef.current?.click()}>
          导入 MD / TXT
        </Button>
        <input ref={mdFileRef} type="file" accept=".md,.markdown,.txt" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          let text = await f.text();
          if (!hasMarkdownStructure(text)) {
            const r = autoStructureText(text);
            text = r.markdown;
            notify(`已智能识别结构：${r.headings} 个章节 / ${r.bullets} 条要点 / ${r.ordered} 条步骤`);
          }
          setMd(text);
          setCopyDirty(false);
          regenerate(text);
          notify(`${f.name} · 已载入并重新拆文`);
        }} />
        <Separator orientation="vertical" className="h-5" />
        <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
          账号设置
        </Button>
        {tab === "cards" && (
          <>
            <Button variant="outline" size="sm" onClick={() => {
              const r = autoStructureText(md);
              setMd(r.markdown);
              setCopyDirty(false);
              regenerate(r.markdown);
              notify(`已智能识别结构：${r.headings} 个章节 / ${r.bullets} 条要点 / ${r.ordered} 条步骤`);
            }}>
              智能补全结构
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setCopyDirty(false); setPosters(splitToPosters(md, profile)); notify("已按当前草稿重新拆文"); }}>
              重新拆文
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("/xhs/export/", "_blank")}>
              打开导出预览
            </Button>
            <Btn primary small onClick={downloadPosterHtml}>
              下载海报 HTML
            </Btn>
          </>
        )}
      </div>

      {showSettings && (
        <div className="border-b border-[var(--sw-line)] bg-[var(--sw-panel)] px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Label className="text-xs text-muted-foreground">
              账号
              <input className="sw-input mt-1 w-full" value={profile.account} onChange={(e) => { const p = { ...profile, account: e.target.value }; setProfile(p); save(KEYS.xhsProfile, p); }} />
            </Label>
            <Label className="text-xs text-muted-foreground">
              主题
              <select className="sw-input mt-1 w-full" value={profile.themeId} onChange={(e) => { const p = { ...profile, themeId: e.target.value }; setProfile(p); save(KEYS.xhsProfile, p); }}>
                {["moyu-green", "red-white", "graphite-minimal", "zen-whitespace", "moyu-ticket", "olive-journal", "sentinel-dark"].map((id) => (
                  <option key={id} value={id}>{getTheme(id).name}</option>
                ))}
              </select>
            </Label>
            <Label className="text-xs text-muted-foreground">
              落款语
              <input className="sw-input mt-1 w-full" value={profile.slogan} onChange={(e) => { const p = { ...profile, slogan: e.target.value }; setProfile(p); save(KEYS.xhsProfile, p); }} />
            </Label>
          </div>
        </div>
      )}

      <div className="grid flex-1 grid-cols-2 overflow-hidden">
        <div className="flex min-h-0 flex-col border-r border-[var(--sw-line)]">
          <div className="flex items-center justify-between border-b border-[var(--sw-line)] px-3 py-1.5 text-[11px] text-[var(--sw-muted)]">
            <span>小红书母稿（Markdown）</span>
            <span>已自动保存</span>
          </div>
          <textarea
            className="flex-1 bg-transparent p-4 font-mono text-[13px] leading-6 text-[var(--sw-text)] outline-none"
            value={md}
            onChange={(e) => { setMd(e.target.value); setCopyDirty(false); }}
            placeholder="# 母稿：公众号与小红书共用，改动后点「重新拆文」…"
            spellCheck={false}
          />
        </div>

        <div className="min-h-0 overflow-y-auto bg-[var(--sw-panel-3)]">
          {tab === "copy" ? (
            <CopyPanel copy={copy} setCopy={(c) => { setCopy(c); setCopyDirty(true); }} />
          ) : (
            <div className="space-y-2 p-4">
              <div className="mb-3 rounded-sm border border-[var(--sw-line)] bg-[var(--sw-panel)] p-3 text-xs leading-5 text-[var(--sw-muted)]">
                默认 9 卡海报制：封面 → 数据 → 痛点 → 方法 → 流程 → 心法 → 对比 → 避坑 → 尾卡。点「编辑」改文字，可删卡、上下排序；「打开导出预览」页可直接逐张/全部下载 2160×2880 PNG，也可下载 HTML 后本地跑 <code className="text-[var(--sw-accent)]">npm run xhs:cards</code> 出图。
              </div>
              {posters.map((p, i) => (
                <div key={p.id} className="space-y-1">
                  <PosterEditor poster={p} onChange={(np) => changePoster(i, np)} />
                  <div className="flex gap-1.5 px-1 pb-2">
                    <button className="rounded-sm border border-[var(--sw-line)] px-1.5 py-0.5 text-[var(--sw-muted)] hover:text-[var(--sw-text)] disabled:opacity-30" disabled={i === 0} onClick={() => setPosters(reorderPosters(posters, i, i - 1))}>
                      <ArrowUp size={12} />
                    </button>
                    <button className="rounded-sm border border-[var(--sw-line)] px-1.5 py-0.5 text-[var(--sw-muted)] hover:text-[var(--sw-text)] disabled:opacity-30" disabled={i === posters.length - 1} onClick={() => setPosters(reorderPosters(posters, i, i + 1))}>
                      <ArrowDown size={12} />
                    </button>
                    <button className="ml-auto rounded-sm border border-[var(--sw-danger)]/30 px-1.5 py-0.5 text-[var(--sw-danger)] hover:bg-[var(--sw-danger)]/10" onClick={() => setPosters(posters.filter((_, j) => j !== i))}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="w-full rounded-sm border border-dashed border-[var(--sw-line)] py-2 text-xs text-[var(--sw-muted)] hover:border-[var(--sw-accent)] hover:text-[var(--sw-accent)]"
                onClick={() => {
                  const kind = KIND_ORDER.find((k) => !posters.some((p) => p.kind === k)) || "cover";
                  setPosters([...posters, { id: `p${Date.now()}`, kind, title: `新${KIND_NAMES[kind]}卡`, lines: [] }]);
                }}
              >
                + 添加卡片
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
