import type { FixedEnding, GzhSettings, IpProfile } from "./types";

export const KEYS = {
  gzhDraft: "dazhou-gzh-draft",
  gzhSettings: "dazhou-gzh-settings",
  gzhEnding: "dazhou-gzh-ending",
  ipProfile: "dazhou-ip-profile",
};

export function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 配额满时静默失败（图片不入库，正文为纯文本，极少触发）
  }
}

export const DEFAULT_GZH_SETTINGS: GzhSettings = {
  themeId: "moyu-green",
  fontSize: 15,
  lineHeight: 1.8,
  fontFamily: "sans",
  textColor: "#374151",
  chapterStyle: "underline",
  showSectionIp: true,
  autoNumbering: true,
  autoUnderline: true,
  tocEnabled: true,
  endingEnabled: false,
  roleColors: {},
};

export const DEFAULT_ENDING: FixedEnding = {
  text: "哈喽，我是大洲。\n让每一篇公众号，都有一身好排版。\n如果今天这篇对你有帮助，欢迎点赞、在看、转发，我们下篇见。",
  useAvatar: true,
};

export const DEFAULT_IP_PROFILE: IpProfile = {
  ipName: "大洲",
  ipThemes: [],
};

export function gzhSettings(): GzhSettings {
  return load<GzhSettings>(KEYS.gzhSettings, DEFAULT_GZH_SETTINGS);
}

export function saveGzhSettings(s: GzhSettings): void {
  save(KEYS.gzhSettings, s);
}

export function ipProfile(): IpProfile {
  return load<IpProfile>(KEYS.ipProfile, DEFAULT_IP_PROFILE);
}

export function saveIpProfile(p: IpProfile): void {
  save(KEYS.ipProfile, p);
}
