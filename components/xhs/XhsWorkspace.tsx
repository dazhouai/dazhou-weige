"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Poster, PosterKind, XhsCopy, XhsProfile } from "@/lib/types";
import { DEFAULT_POSTERS, DEFAULT_XHS_COPY, DEFAULT_XHS_PROFILE, KEYS, load, save } from "@/lib/store";
import { generateXhsCopy } from "@/lib/xhsCopy";
import { splitToPosters, reorderPosters } from "@/lib/xhsSplit";
import { buildPosterHtml } from "@/lib/posters";
import { getTheme } from "@/lib/themes";

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
          <button className="text-xs text-[var(--sw-accent)] hover:underline" onClick={() => copyText("titles", copy.titles.join("\n"))}>
            {copied === "titles" ? "已复制" : "复制全部"}
          </button>
        </div>
        <div className="space-y-1.5">
          {copy.titles.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-2 text-sm"
                value={t}
                onChange={(e) => {
                  const titles = [...copy.titles];
                  titles[i] = e.target.value;
                  setCopy({ ...copy, titles, preferredTitle: i === 0 ? e.target.value : copy.preferredTitle });
                }}
              />
              {i === 0 && <span className="text-xs text-amber-300">⭐ 主推</span>}
              <button className="text-xs text-[var(--sw-accent)] hover:underline" onClick={() => copyText(`t${i}`, t)}>
                {copied === `t${i}` ? "✓" : "复制"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">正文（小红书口语体）</h3>
          <button className="text-xs text-[var(--sw-accent)] hover:underline" onClick={() => copyText("body", copy.body)}>
            {copied === "body" ? "已复制" : "复制正文"}
          </button>
        </div>
        <textarea
          className="h-72 w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-3 text-sm leading-6"
          value={copy.body}
          onChange={(e) => setCopy({ ...copy, body: e.target.value })}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">话题标签（8–10 个）</h3>
          <button className="text-xs text-[var(--sw-accent)] hover:underline" onClick={() => copyText("tags", copy.tags.join(" "))}>
            {copied === "tags" ? "已复制" : "复制标签"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {copy.tags.map((t, i) => (
            <span key={i} className="flex items-center gap-1 rounded-full border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1 text-xs">
              {t}
              <button className="text-[var(--sw-muted)] hover:text-red-300" onClick={() => setCopy({ ...copy, tags: copy.tags.filter((_, j) => j !== i) })}>×</button>
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
            <label key={k} className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] p-2.5 text-xs">
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
    <div className="rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel-2)]">
      <button className="flex w-full items-center justify-between px-3 py-2.5 text-left" onClick={() => setExpanded(!expanded)}>
        <span className="flex items-center gap-2 text-sm">
          <span className="rounded bg-[var(--sw-accent)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--sw-accent)]">
            {KIND_NAMES[poster.kind]}
          </span>
          <span className="font-medium">{poster.title || "（未填标题）"}</span>
        </span>
        <span className="text-xs text-[var(--sw-muted)]">{expanded ? "收起" : "编辑"}</span>
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-[var(--sw-line)] p-3">
          <input className="w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel)] px-2.5 py-1.5 text-sm" value={poster.title} placeholder="标题" onChange={(e) => onChange({ ...poster, title: e.target.value })} />
          {(poster.kind === "cover" || poster.kind === "data" || poster.kind === "shift" || poster.kind === "workspace" || poster.kind === "principle" || poster.kind === "reflection") && (
            <textarea className="h-24 w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel)] px-2.5 py-1.5 text-sm" value={poster.lines.join("\n")} placeholder="每行一条内容" onChange={(e) => onChange({ ...poster, lines: e.target.value.split("\n") })} />
          )}
          {(poster.kind === "workflow") && (
            <textarea className="h-24 w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel)] px-2.5 py-1.5 text-sm" value={(poster.steps || []).map((s) => s.text).join("\n")} placeholder="每行一步" onChange={(e) => onChange({ ...poster, steps: e.target.value.split("\n").filter(Boolean).map((text, i) => ({ num: String(i + 1), text })) })} />
          )}
          {(poster.kind === "division") && (
            <textarea className="h-20 w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel)] px-2.5 py-1.5 text-sm" value={(poster.comparison || []).join("\n")} placeholder="第一行：没做…；第二行：做了…" onChange={(e) => onChange({ ...poster, comparison: e.target.value.split("\n").filter(Boolean) })} />
          )}
          {(poster.kind === "end") && (
            <>
              <textarea className="h-20 w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel)] px-2.5 py-1.5 text-sm" value={(poster.fitItems || []).join("\n")} placeholder="适合谁（每行一条）" onChange={(e) => onChange({ ...poster, fitItems: e.target.value.split("\n").filter(Boolean) })} />
              <input className="w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel)] px-2.5 py-1.5 text-sm" value={poster.notFitItem || ""} placeholder="不适合谁" onChange={(e) => onChange({ ...poster, notFitItem: e.target.value })} />
              <textarea className="h-16 w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel)] px-2.5 py-1.5 text-sm" value={(poster.ctaItems || []).join("\n")} placeholder="CTA（每行一条）" onChange={(e) => onChange({ ...poster, ctaItems: e.target.value.split("\n").filter(Boolean) })} />
            </>
          )}
          <div className="flex gap-2">
            <input className="flex-1 rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel)] px-2.5 py-1.5 text-xs" value={poster.footer || ""} placeholder="页脚（默认 @账号）" onChange={(e) => onChange({ ...poster, footer: e.target.value })} />
            <button className="rounded-md border border-[var(--sw-line)] px-2 py-1 text-xs text-[var(--sw-muted)]" onClick={() => onChange({ ...poster, footer: undefined })}>
              默认页脚
            </button>
          </div>
        </div>
      )}
    </div>
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
  const [toast, setToast] = useState("");
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
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
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
        <div className="flex gap-1 rounded-md border border-[var(--sw-line)] p-0.5 text-sm">
          {(["copy", "cards"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded px-3 py-1.5 ${tab === t ? "bg-[var(--sw-panel-2)] text-white" : "text-[var(--sw-muted)]"}`}>
              {t === "copy" ? "文案" : "图文卡片"}
            </button>
          ))}
        </div>
        <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-xs" onClick={importGzhDraft}>
          从公众号草稿导入
        </button>
        <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-xs" onClick={() => mdFileRef.current?.click()}>
          导入 MD / TXT
        </button>
        <input ref={mdFileRef} type="file" accept=".md,.markdown,.txt" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const text = await f.text();
          setMd(text);
          setCopyDirty(false);
          regenerate(text);
          notify(`${f.name} · 已载入并重新拆文`);
        }} />
        <div className="mx-1 h-5 w-px bg-[var(--sw-line)]" />
        <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-xs" onClick={() => setShowSettings(!showSettings)}>
          账号设置
        </button>
        {tab === "cards" && (
          <>
            <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-xs" onClick={() => { setCopyDirty(false); setPosters(splitToPosters(md, profile)); notify("已按当前草稿重新拆文"); }}>
              重新拆文
            </button>
            <button className="rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-xs" onClick={() => window.open("/xhs/export/", "_blank")}>
              打开导出预览
            </button>
            <Btn primary small onClick={downloadPosterHtml}>
              下载海报 HTML
            </Btn>
          </>
        )}
      </div>

      {showSettings && (
        <div className="border-b border-[var(--sw-line)] bg-[var(--sw-panel)] px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-[var(--sw-muted)]">
              账号
              <input className="mt-1 w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-sm text-[var(--sw-text)]" value={profile.account} onChange={(e) => { const p = { ...profile, account: e.target.value }; setProfile(p); save(KEYS.xhsProfile, p); }} />
            </label>
            <label className="text-xs text-[var(--sw-muted)]">
              主题
              <select className="mt-1 w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-sm text-[var(--sw-text)]" value={profile.themeId} onChange={(e) => { const p = { ...profile, themeId: e.target.value }; setProfile(p); save(KEYS.xhsProfile, p); }}>
                {["moyu-green", "red-white", "graphite-minimal", "zen-whitespace", "moyu-ticket", "olive-journal", "sentinel-dark"].map((id) => (
                  <option key={id} value={id}>{getTheme(id).name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[var(--sw-muted)]">
              落款语
              <input className="mt-1 w-full rounded-md border border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-2.5 py-1.5 text-sm text-[var(--sw-text)]" value={profile.slogan} onChange={(e) => { const p = { ...profile, slogan: e.target.value }; setProfile(p); save(KEYS.xhsProfile, p); }} />
            </label>
          </div>
        </div>
      )}

      <div className="grid flex-1 grid-cols-2 overflow-hidden">
        <div className="flex flex-col border-r border-[var(--sw-line)]">
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

        <div className="overflow-y-auto bg-[#101418]">
          {tab === "copy" ? (
            <CopyPanel copy={copy} setCopy={(c) => { setCopy(c); setCopyDirty(true); }} />
          ) : (
            <div className="space-y-2 p-4">
              <div className="mb-3 rounded-lg border border-[var(--sw-line)] bg-[var(--sw-panel)] p-3 text-xs leading-5 text-[var(--sw-muted)]">
                默认 9 卡海报制：封面 → 数据 → 痛点 → 方法 → 流程 → 心法 → 对比 → 避坑 → 尾卡。点「编辑」改文字，可删卡、上下排序；改完下载 HTML，本地跑 <code className="text-[var(--sw-accent)]">npm run xhs:cards</code> 出 2160×2880 PNG。
              </div>
              {posters.map((p, i) => (
                <div key={p.id} className="space-y-1">
                  <PosterEditor poster={p} onChange={(np) => changePoster(i, np)} />
                  <div className="flex gap-1.5 px-1 pb-2">
                    <button className="rounded border border-[var(--sw-line)] px-1.5 py-0.5 text-[10px] text-[var(--sw-muted)] hover:text-white" disabled={i === 0} onClick={() => setPosters(reorderPosters(posters, i, i - 1))}>
                      ↑
                    </button>
                    <button className="rounded border border-[var(--sw-line)] px-1.5 py-0.5 text-[10px] text-[var(--sw-muted)] hover:text-white" disabled={i === posters.length - 1} onClick={() => setPosters(reorderPosters(posters, i, i + 1))}>
                      ↓
                    </button>
                    <button className="ml-auto rounded border border-red-500/30 px-1.5 py-0.5 text-[10px] text-red-300 hover:bg-red-500/10" onClick={() => setPosters(posters.filter((_, j) => j !== i))}>
                      删除
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="w-full rounded-md border border-dashed border-[var(--sw-line)] py-2 text-xs text-[var(--sw-muted)] hover:border-[var(--sw-accent)] hover:text-[var(--sw-accent)]"
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

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-black/85 px-4 py-2 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
