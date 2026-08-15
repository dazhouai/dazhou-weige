import type {
  FixedEnding,
  GzhSettings,
  IpProfile,
  Poster,
  XhsCopy,
  XhsProfile,
} from "./types";

export const KEYS = {
  gzhDraft: "sentinel-gzh-draft",
  gzhSettings: "sentinel-gzh-settings",
  gzhEnding: "sentinel-gzh-ending",
  ipProfile: "sentinel-ip-profile",
  xhsDraft: "sentinel-xhs-draft",
  xhsCopy: "sentinel-xhs-copy",
  xhsPosters: "sentinel-xhs-posters",
  xhsProfile: "sentinel-xhs-profile",
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
  text: "哈喽，我是 Sentinel。\n让每一篇公众号，都有一身好排版。\n如果今天这篇对你有帮助，欢迎点赞、在看、转发，我们下篇见。",
  useAvatar: true,
};

export const DEFAULT_IP_PROFILE: IpProfile = {
  ipName: "Sentinel",
  ipThemes: [],
};

export const DEFAULT_XHS_PROFILE: XhsProfile = {
  account: "@跟着大洲学AI",
  tagPool: [
    "AI工具",
    "AI实战",
    "效率神器",
    "公众号运营",
    "自媒体干货",
    "零基础编程",
    "vibecoding",
    "真实复盘",
  ],
  themeId: "moyu-green",
  slogan: "AI 工具，只讲人话，不搞虚的。",
};

export const DEFAULT_XHS_COPY: XhsCopy = {
  titles: [],
  preferredTitle: "",
  body: "",
  tags: [],
  tips: {
    time: "",
    coverNote: "",
    comment: "",
    repost: "",
  },
};

export const DEFAULT_POSTERS: Poster[] = [];

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
