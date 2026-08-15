export type ChapterStyleId =
  | "underline"
  | "slash"
  | "bar"
  | "box"
  | "brackets"
  | "circles"
  | "dots"
  | "topNumber"
  | "quote";

export const CHAPTER_STYLES: { id: ChapterStyleId; name: string; mark: string }[] = [
  { id: "underline", name: "粗下划线", mark: "01 标题" },
  { id: "slash", name: "斜线", mark: "／ 标题" },
  { id: "bar", name: "左竖线", mark: "▌标题" },
  { id: "box", name: "方框", mark: "□ 标题" },
  { id: "brackets", name: "方括号", mark: "［标题］" },
  { id: "circles", name: "双圆", mark: "● 标题" },
  { id: "dots", name: "点阵", mark: "∷ 标题 ∷" },
  { id: "topNumber", name: "上置序号", mark: "⁰¹ 标题" },
  { id: "quote", name: "引号", mark: "“ 标题" },
];

export interface RoleColors {
  background: string;
  title: string;
  bold: string;
  decoration: string;
  divider: string;
  list: string;
  code: string;
  table: string;
  inlineText: string;
  inlineShadow: string;
  quote: string;
}

export interface ThemeManifest {
  id: string;
  name: string;
  en: string;
  scene: string;
  pageBg: string;
  paper: string;
  ink: string;
  text: string;
  muted: string;
  accent: string;
  accentOn: string;
  soft: string;
  softBorder: string;
  divider: string;
  underlineCss: string;
  titleFont: string;
  bodyFont: string;
  bodySize: number;
  lineHeight: number;
  letterSpacing: string;
  radius: number;
  shadow: string;
  roles: RoleColors;
  posterAccent: string;
}

export interface GzhSettings {
  themeId: string;
  fontSize: number;
  lineHeight: number;
  fontFamily: "sans" | "heiti";
  textColor: string;
  chapterStyle: ChapterStyleId;
  showSectionIp: boolean;
  autoNumbering: boolean;
  autoUnderline: boolean;
  tocEnabled: boolean;
  endingEnabled: boolean;
  roleColors: Partial<RoleColors>;
  customTheme?: ThemeManifest;
}

export interface FixedEnding {
  text: string;
  useAvatar: boolean;
  avatar?: string;
}

export interface IpProfile {
  ipName: string;
  ipImage?: string;
  ipAvatar?: string;
  ipThemes: ThemeManifest[];
  savedIpTheme?: string;
}

export interface ComplianceReport {
  ok: boolean;
  errors: number;
  warnings: number;
  leafIssues: number;
  forbiddenTags: string[];
  forbiddenCss: string[];
  punctuationIssues: { index: number; text: string }[];
  images: { total: number; embedded: number; remote: number; missing: number };
}

export interface TitleCandidate {
  title: string;
  angle: string;
  preferred: boolean;
}

export interface XhsProfile {
  account: string;
  tagPool: string[];
  themeId: string;
  slogan: string;
}

export type PosterKind =
  | "cover"
  | "data"
  | "shift"
  | "workspace"
  | "workflow"
  | "principle"
  | "division"
  | "reflection"
  | "end";

export interface DataChip {
  num: string;
  unit: string;
  label: string;
}

export interface Poster {
  kind: PosterKind;
  id: string;
  tag?: string;
  title: string;
  lines: string[];
  chips?: DataChip[];
  steps?: { num: string; text: string }[];
  comparison?: string[];
  fitItems?: string[];
  notFitItem?: string;
  ctaItems?: string[];
  tags?: string[];
  swipeHint?: string;
  footer?: string;
}

export interface XhsCopy {
  titles: string[];
  preferredTitle: string;
  body: string;
  tags: string[];
  tips: {
    time: string;
    coverNote: string;
    comment: string;
    repost: string;
  };
}
