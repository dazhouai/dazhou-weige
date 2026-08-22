"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  // 每次刷新/进入页面都弹一次引导关注，不做持久记忆
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => setOpen(true), 300);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) dismiss();
      }}
    >
      <DialogContent
        showCloseButton
        className="max-w-md gap-0 overflow-hidden p-0"
      >
        {/* 品牌主题注入：顶部渐变装饰条 + 暖橙渐变区 */}
        <div className="h-1.5 bg-gradient-to-r from-[var(--sw-accent)] via-[#c2410c] to-amber-400" />
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 px-6 pt-6 pb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-amber-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="大洲微格"
              className="size-10 rounded-lg object-contain"
            />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold tracking-tight text-[var(--sw-text)]">
              大洲微格 · 完全免费
            </DialogTitle>
            <DialogDescription className="mt-2 text-center text-sm leading-relaxed text-[var(--sw-muted)]">
              不注册、不联网、不上传。
              <br />
              你的稿子，只存在你自己浏览器里。
            </DialogDescription>
            <p className="mt-3 inline-block self-center rounded-full bg-[var(--sw-accent)]/10 px-4 py-1.5 text-[13px] font-medium text-[var(--sw-accent-ink)]">
              把排版交给工具，把时间留给内容。
            </p>
          </DialogHeader>
        </div>

        <div className="bg-white px-6 py-6 text-center">
          <p className="text-[15px] font-semibold text-[var(--sw-text)]">
            📮 关注公众号「跟着大洲学AI」
          </p>
          <p className="mt-1 text-xs text-[var(--sw-muted)]">
            长按或扫码，获取更多 AI 实战教程
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/qrcode-follow.jpg"
            alt="公众号二维码 跟着大洲学AI"
            className="mx-auto mt-4 h-48 w-48 rounded-lg border border-[var(--sw-line)] object-contain bg-white p-2"
          />
          <p className="mt-3 text-[11px] text-[var(--sw-muted)]">
            —— 我是大洲，让排版这件事变得不再烦人。
          </p>
        </div>

        <div className="border-t border-[var(--sw-line)] bg-[var(--sw-panel-2)] px-4 py-3">
          <Button
            onClick={dismiss}
            className="w-full bg-[var(--sw-accent)] text-white hover:bg-[var(--sw-accent-2)]"
            size="sm"
          >
            我知道了，开始排版 →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}