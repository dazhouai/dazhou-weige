"use client";

import type { ThemeManifest, RoleColors } from "./types";
import { fileToDataUrl } from "./clientImage";

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const mix = (c: number) => Math.max(0, Math.min(255, Math.round(factor >= 0 ? c + (255 - c) * factor : c * (1 + factor))));
  if (factor >= 0) {
    r = mix(r); g = mix(g); b = mix(b);
  } else {
    r = Math.round(r * (1 + factor)); g = Math.round(g * (1 + factor)); b = Math.round(b * (1 + factor));
  }
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function toHex(rgb: { r: number; g: number; b: number }): string {
  return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
}

export async function extractIpThemes(file: File, ipName: string): Promise<{ avatar: string; themes: ThemeManifest[] }> {
  const avatar = await fileToDataUrl(file, 512);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = avatar;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { avatar, themes: [] };
  ctx.drawImage(img, 0, 0, 64, 64);
  const data = ctx.getImageData(0, 0, 64, 64).data;

  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    if (r > 245 && g > 245 && b > 245) continue;
    const key = `${Math.round(r / 48) * 48},${Math.round(g / 48) * 48},${Math.round(b / 48) * 48}`;
    const hit = buckets.get(key);
    if (hit) {
      hit.r += r; hit.g += g; hit.b += b; hit.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }
  const sorted = [...buckets.values()].sort((x, y) => y.count - x.count).slice(0, 4);
  const main = sorted[0] || { r: 5, g: 150, b: 105 };
  const secondary = sorted[1] || main;
  const mainHex = toHex({ r: Math.round(main.r / main.count), g: Math.round(main.g / main.count), b: Math.round(main.b / main.count) });
  const secHex = toHex({ r: Math.round(secondary.r / secondary.count), g: Math.round(secondary.g / secondary.count), b: Math.round(secondary.b / secondary.count) });
  const base = ipName || "大洲";

  const make = (id: string, accent: string, name: string): ThemeManifest => {
    const roles: RoleColors = {
      background: "#FFFFFF",
      title: "#111827",
      bold: "#111827",
      decoration: accent,
      divider: "#E5E7EB",
      list: accent,
      code: accent,
      table: accent,
      inlineText: accent,
      inlineShadow: shade(accent, 0.86),
      quote: accent,
    };
    return {
      id,
      name,
      en: id,
      scene: `${base} 专属配色`,
      pageBg: shade(accent, 0.9),
      paper: "#FFFFFF",
      ink: "#111827",
      text: "#374151",
      muted: "#6B7280",
      accent,
      accentOn: "#FFFFFF",
      soft: shade(accent, 0.88),
      softBorder: shade(accent, 0.72),
      divider: "#E5E7EB",
      underlineCss: `border-bottom:2px solid ${shade(accent, 0.55)};font-weight:600;`,
      titleFont: "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif",
      bodyFont: "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif",
      bodySize: 15,
      lineHeight: 1.8,
      letterSpacing: "0.4px",
      radius: 10,
      shadow: `0 6px 18px ${shade(accent, 0.82)}`,
      roles,
      posterAccent: accent,
    };
  };

  const themes = [
    make(`ip-${base}-1`, mainHex, `${base}配色1`),
    make(`ip-${base}-2`, shade(mainHex, -0.25), `${base}配色2`),
    make(`ip-${base}-3`, secHex, `${base}配色3`),
  ];
  return { avatar, themes };
}
