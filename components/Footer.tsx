export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--sw-line)] bg-[var(--sw-panel-3)]">
      {/* 顶部渐变分隔条 */}
      <div className="h-[1.5px] bg-gradient-to-r from-amber-400 via-[var(--sw-accent)] to-amber-400" />

      <div className="mx-auto max-w-6xl px-4 py-3 lg:px-6">
        <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:justify-between">
          {/* 左侧：品牌 logo + slogan + 版权 */}
          <div className="text-center md:max-w-md md:text-left">
            <div className="flex items-center gap-3 md:justify-start justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="大洲微格"
                className="size-12 shrink-0 rounded-lg object-contain"
              />
              <div className="bg-gradient-to-r from-[var(--sw-accent)] via-[#c2410c] to-[var(--sw-accent)] bg-clip-text text-2xl font-extrabold leading-none tracking-tight text-transparent">
                大洲微格
              </div>
            </div>
            <p className="mt-2 text-[14px] font-medium leading-relaxed text-[var(--sw-text)]">
              把排版交给工具，把时间留给内容。
            </p>
            <p className="mt-1 text-[11px] text-[var(--sw-muted)]">
              一篇 Markdown 母稿，一键产出合规公众号排版。
            </p>
            <p className="mt-2 text-[11px] text-[var(--sw-faint)]">
              © 2026 大洲微格 · 一个不联网的公众号智能排版工具
            </p>
          </div>

          {/* 右侧：二维码 + 公众号引导 */}
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qrcode-follow.jpg"
              alt="公众号二维码 跟着大洲学AI"
              className="h-16 w-16 rounded-lg border border-[var(--sw-line)] bg-white p-1 shadow-sm"
            />
            <div className="text-left">
              <div className="text-sm font-semibold text-[var(--sw-text)]">
                📮 跟着大洲学AI
              </div>
              <div className="mt-1 text-[11px] text-[var(--sw-muted)]">
                长按 / 扫码关注
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--sw-faint)]">
                AI 实战教程 · 排版技巧
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}