/**
 * 日本語翻訳
 */
import type { TranslationKeys } from "./en";

export const ja: Record<TranslationKeys, string> = {
  "meta.title": "Clipped - 貼るだけメモ",
  "meta.description": "Ctrl+V で貼るだけ。ブラウザで使える Google Keep 風メモアプリ",

  "header.searchPlaceholder": "メモを検索...",
  "header.login": "Googleでログイン",
  "header.logout": "ログアウト",
  "header.userAlt": "ユーザー",
  "header.apiKey": "API Key (PixDraft)",
  "header.apiKeyCopy": "コピー",
  "header.apiKeyCopied": "コピーしました",

  "newNote.placeholder": "メモを入力...",
  "newNote.titlePlaceholder": "タイトル",
  "newNote.close": "閉じる",
  "newNote.pasteButton": "クリップボードから貼り付け",

  "grid.empty": "メモがありません",
  "grid.emptyHint": "Ctrl+V で画像やテキストを貼り付けるか、上の入力欄からメモを作成できます",
  "grid.loading": "読み込み中...",
  "grid.pinnedSection": "ピン留め",
  "grid.othersSection": "その他",

  "card.imageAlt": "添付画像",
  "card.pin": "ピン留め",
  "card.unpin": "ピン留め解除",
  "card.delete": "削除",

  "modal.titlePlaceholder": "タイトル",
  "modal.bodyPlaceholder": "メモを入力...",
  "modal.close": "閉じる",
  "modal.saveFailed": "保存に失敗しました",

  "color.default": "デフォルト",
  "color.yellow": "黄色",
  "color.green": "緑",
  "color.blue": "青",
  "color.pink": "ピンク",
  "color.purple": "紫",

  "tag.placeholder": "タグを追加...",

  "annotation.title": "マーカーを描画",
  "annotation.back": "戻る",
  "annotation.tabMarker": "マーカー",
  "annotation.tabCrop": "切り抜き",
  "annotation.tabMemo": "メモ",
  "annotation.tools": "ツール:",
  "annotation.pen": "ペン（フリーハンド）",
  "annotation.arrow": "矢印",
  "annotation.circleHand": "〇（手書き）",
  "annotation.circleExact": "〇（正確）",
  "annotation.color": "色:",
  "annotation.width": "太さ:",
  "annotation.widthValue": "太さ: {value}px",
  "annotation.opacity": "透明度:",
  "annotation.opacityValue": "透明度: {value}%",
  "annotation.undo": "元に戻す（Ctrl+Z）",
  "annotation.undoBtn": "↩ 戻す",
  "annotation.copyTitle": "クリップボードにコピー（Ctrl+C）",
  "annotation.copied": "✓ コピー済",
  "annotation.copy": "コピー",
  "annotation.clearAll": "全てクリア",
  "annotation.clearBtn": "全消し",
  "annotation.print": "印刷",
  "annotation.printTitle": "画像を印刷（1ページにフィット）",
  "annotation.loadingImage": "画像を読み込み中...",

  "annotation.colorRed": "赤",
  "annotation.colorYellow": "黄",
  "annotation.colorGreen": "緑",
  "annotation.colorBlue": "青",
  "annotation.colorBlack": "黒",
  "annotation.colorWhite": "白",

  "crop.title": "画像を切り抜き",
  "crop.hint": "ドラッグで範囲を選択",
  "crop.hintActive": "選択範囲をドラッグで移動 / 角をドラッグでリサイズ / 範囲外でドラッグし直し",
  "crop.hintStart": "画像上をドラッグして切り抜き範囲を選択してください",
  "crop.back": "戻る",
  "crop.processing": "処理中...",
  "crop.cropBtn": "切り抜き",
  "crop.loading": "画像を読み込み中...",

  "nudge.banner": "💡 ログインするとどの端末からでも使えます",
  "nudge.storage": "（ローカル保存: {value} MB 使用中 ※ブラウザにより保存容量の上限は異なります）",
  "nudge.toast": "スマホからも見たくないですか？ログインすればどこからでもアクセスできます",

  "login.title": "Clipped",
  "login.tagline": "貼るだけメモ — どの端末からでもアクセス",
  "login.description": "ログインするとメモがクラウドに保存され、どの端末からでもアクセスできます。",
  "login.googleBtn": "Google でログイン",
  "login.note": "ログインしなくてもメモは使えます（ブラウザに保存されます）",
  "login.skipLink": "ログインせずに使う →",
  "login.loading": "読み込み中...",

  "error.title": "エラーが発生しました",
  "error.description": "予期しないエラーが発生しました。",
  "error.reload": "ページを再読み込み",

  "nudge.beforeunload": "ログインしないとデータがこのブラウザにしか残りません",

  "footer.privacy": "プライバシーポリシー",
  "footer.terms": "利用規約",
  "footer.backToApp": "Clipped に戻る",

  "lang.en": "English",
  "lang.ja": "日本語",
  "lang.zh": "中文",
  "lang.ko": "한국어",
  "lang.es": "Español",
  "lang.fr": "Français",
  "lang.de": "Deutsch",
};
