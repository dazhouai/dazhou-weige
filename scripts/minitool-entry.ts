/**
 * 小红书小工具入口：把大洲微格核心引擎打包为经典脚本，挂载到 window 命名空间。
 * esbuild bundle 为 IIFE（无 module/import/export），符合容器 CSP。
 */
import { renderWechatArticle } from "../lib/renderGzh";
import { getTheme, THEMES } from "../lib/themes";
import {
  DEFAULT_ENDING,
  DEFAULT_GZH_SETTINGS,
  DEFAULT_IP_PROFILE,
  KEYS,
  load,
  save,
} from "../lib/store";
import { autoStructureText, hasMarkdownStructure } from "../lib/autoStructure";
import { CHAPTER_STYLES } from "../lib/types";

// 挂载到 window，供 index.html 的经典脚本调用
declare global {
  interface Window {
    __dazhou: typeof api;
  }
}

const api = {
  renderWechatArticle,
  getTheme,
  THEMES,
  CHAPTER_STYLES,
  DEFAULT_ENDING,
  DEFAULT_GZH_SETTINGS,
  DEFAULT_IP_PROFILE,
  KEYS,
  load,
  save,
  autoStructureText,
  hasMarkdownStructure,
};

window.__dazhou = api;
