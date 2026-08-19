/**
 * 中文（简体）翻译
 */
import type { TranslationKeys } from "./en";

export const zh: Record<TranslationKeys, string> = {
  "meta.title": "Clipped - 粘贴笔记",
  "meta.description": "Ctrl+V 即可粘贴。基于浏览器的 Google Keep 风格笔记应用。",

  "header.searchPlaceholder": "搜索笔记...",
  "header.login": "使用Google登录",
  "header.logout": "退出登录",
  "header.userAlt": "用户",
  "header.apiKey": "API Key (PixDraft)",
  "header.apiKeyCopy": "复制",
  "header.apiKeyCopied": "已复制",

  "newNote.placeholder": "输入笔记...",
  "newNote.titlePlaceholder": "标题",
  "newNote.close": "关闭",
  "newNote.pasteButton": "从剪贴板粘贴",

  "grid.empty": "暂无笔记",
  "grid.emptyHint": "按 Ctrl+V 粘贴图片或文字，或使用上方输入框创建笔记。",
  "grid.loading": "加载中...",
  "grid.pinnedSection": "已固定",
  "grid.othersSection": "其他",

  "card.imageAlt": "附件图片",
  "card.pin": "置顶",
  "card.unpin": "取消置顶",
  "card.delete": "删除",

  "modal.titlePlaceholder": "标题",
  "modal.bodyPlaceholder": "输入笔记...",
  "modal.close": "关闭",
  "modal.saveFailed": "保存失败",

  "color.default": "默认",
  "color.yellow": "黄色",
  "color.green": "绿色",
  "color.blue": "蓝色",
  "color.pink": "粉色",
  "color.purple": "紫色",

  "tag.placeholder": "添加标签...",

  "annotation.title": "绘制标记",
  "annotation.back": "返回",
  "annotation.tabMarker": "标记",
  "annotation.tabCrop": "裁剪",
  "annotation.tabMemo": "笔记",
  "annotation.tools": "工具:",
  "annotation.pen": "画笔（自由绘制）",
  "annotation.arrow": "箭头",
  "annotation.circleHand": "圆形（手绘）",
  "annotation.circleExact": "圆形（精确）",
  "annotation.color": "颜色:",
  "annotation.width": "粗细:",
  "annotation.widthValue": "粗细: {value}px",
  "annotation.opacity": "透明度:",
  "annotation.opacityValue": "透明度: {value}%",
  "annotation.undo": "撤销 (Ctrl+Z)",
  "annotation.undoBtn": "撤销",
  "annotation.copyTitle": "复制到剪贴板 (Ctrl+C)",
  "annotation.copied": "已复制",
  "annotation.copy": "复制",
  "annotation.clearAll": "全部清除",
  "annotation.clearBtn": "清除",
  "annotation.print": "打印",
  "annotation.printTitle": "打印图片（适合1页）",
  "annotation.loadingImage": "加载图片中...",

  "annotation.colorRed": "红",
  "annotation.colorYellow": "黄",
  "annotation.colorGreen": "绿",
  "annotation.colorBlue": "蓝",
  "annotation.colorBlack": "黑",
  "annotation.colorWhite": "白",

  "crop.title": "裁剪图片",
  "crop.hint": "拖动选择区域",
  "crop.hintActive": "拖动选区移动 / 拖动角落调整大小 / 在外部重新拖动",
  "crop.hintStart": "在图片上拖动以选择裁剪区域",
  "crop.back": "返回",
  "crop.processing": "处理中...",
  "crop.cropBtn": "裁剪",
  "crop.loading": "加载图片中...",

  "nudge.banner": "💡 登录后可在任何设备上使用",
  "nudge.storage": "（本地存储: 已使用 {value} MB。存储上限因浏览器而异。）",
  "nudge.toast": "想在手机上查看笔记吗？登录即可随时随地访问。",

  "login.title": "Clipped",
  "login.tagline": "粘贴笔记 — 随时随地访问",
  "login.description": "登录后笔记将保存到云端，可从任何设备访问。",
  "login.googleBtn": "使用 Google 登录",
  "login.note": "无需登录也可使用（笔记保存在浏览器中）",
  "login.skipLink": "不登录直接使用 →",
  "login.loading": "加载中...",

  "error.title": "出现错误",
  "error.description": "发生了意外错误。",
  "error.reload": "重新加载页面",

  "nudge.beforeunload": "不登录的话数据只保存在此浏览器中",

  "footer.privacy": "隐私政策",
  "footer.terms": "服务条款",
  "footer.backToApp": "返回 Clipped",

  "lang.en": "English",
  "lang.ja": "日本語",
  "lang.zh": "中文",
  "lang.ko": "한국어",
  "lang.es": "Español",
  "lang.fr": "Français",
  "lang.de": "Deutsch",
};
