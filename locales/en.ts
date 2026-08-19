/**
 * English translations (default / canonical)
 *
 * All translation keys are defined here.
 * Other locale files must satisfy the same shape.
 */
export const en = {
  // ---- Meta ----
  "meta.title": "Clipped - Paste & Note",
  "meta.description": "Just Ctrl+V. A browser-based note app like Google Keep.",

  // ---- Header ----
  "header.searchPlaceholder": "Search notes...",
  "header.login": "Login with Google",
  "header.logout": "Logout",
  "header.userAlt": "User",
  "header.apiKey": "API Key (PixDraft)",
  "header.apiKeyCopy": "Copy",
  "header.apiKeyCopied": "Copied!",

  // ---- NewNoteInput ----
  "newNote.placeholder": "Take a note...",
  "newNote.titlePlaceholder": "Title",
  "newNote.close": "Close",
  "newNote.pasteButton": "Paste from clipboard",

  // ---- NoteGrid ----
  "grid.empty": "No notes yet",
  "grid.emptyHint": "Press Ctrl+V to paste an image or text, or use the input above to create a note.",
  "grid.loading": "Loading...",
  "grid.pinnedSection": "Pinned",
  "grid.othersSection": "Others",

  // ---- NoteCard ----
  "card.imageAlt": "Attached image",
  "card.pin": "Pin",
  "card.unpin": "Unpin",
  "card.delete": "Delete",

  // ---- NoteModal ----
  "modal.titlePlaceholder": "Title",
  "modal.bodyPlaceholder": "Take a note...",
  "modal.close": "Close",
  "modal.saveFailed": "Failed to save",

  // ---- ColorPicker ----
  "color.default": "Default",
  "color.yellow": "Yellow",
  "color.green": "Green",
  "color.blue": "Blue",
  "color.pink": "Pink",
  "color.purple": "Purple",

  // ---- TagInput ----
  "tag.placeholder": "Add a tag...",

  // ---- ImageAnnotation ----
  "annotation.title": "Draw markers",
  "annotation.back": "Back",
  "annotation.tabMarker": "Marker",
  "annotation.tabCrop": "Crop",
  "annotation.tabMemo": "Memo",
  "annotation.tools": "Tool:",
  "annotation.pen": "Pen (freehand)",
  "annotation.arrow": "Arrow",
  "annotation.circleHand": "Circle (hand-drawn)",
  "annotation.circleExact": "Circle (precise)",
  "annotation.color": "Color:",
  "annotation.width": "Width:",
  "annotation.widthValue": "Width: {value}px",
  "annotation.opacity": "Opacity:",
  "annotation.opacityValue": "Opacity: {value}%",
  "annotation.undo": "Undo (Ctrl+Z)",
  "annotation.undoBtn": "Undo",
  "annotation.copyTitle": "Copy to clipboard (Ctrl+C)",
  "annotation.copied": "Copied",
  "annotation.copy": "Copy",
  "annotation.clearAll": "Clear all",
  "annotation.clearBtn": "Clear",
  "annotation.print": "Print",
  "annotation.printTitle": "Print image (fit to 1 page)",
  "annotation.loadingImage": "Loading image...",

  // ---- ImageAnnotation color labels ----
  "annotation.colorRed": "Red",
  "annotation.colorYellow": "Yellow",
  "annotation.colorGreen": "Green",
  "annotation.colorBlue": "Blue",
  "annotation.colorBlack": "Black",
  "annotation.colorWhite": "White",

  // ---- ImageCropModal ----
  "crop.title": "Crop image",
  "crop.hint": "Drag to select area",
  "crop.hintActive": "Drag selection to move / Drag corners to resize / Drag outside to redraw",
  "crop.hintStart": "Drag on the image to select the crop area",
  "crop.back": "Back",
  "crop.processing": "Processing...",
  "crop.cropBtn": "Crop",
  "crop.loading": "Loading image...",

  // ---- LoginNudge ----
  "nudge.banner": "Login to access your notes from any device",
  "nudge.storage": "(Local storage: {value} MB used. Storage limits vary by browser.)",
  "nudge.toast": "Want to see your notes on your phone? Login for access anywhere.",

  // ---- Login page ----
  "login.title": "Clipped",
  "login.tagline": "Paste & Note — access from any device",
  "login.description": "Login to save your notes to the cloud and access them from any device.",
  "login.googleBtn": "Login with Google",
  "login.note": "You can use the app without logging in (notes are saved in your browser)",
  "login.skipLink": "Use without login →",
  "login.loading": "Loading...",

  // ---- ErrorBoundary ----
  "error.title": "Something went wrong",
  "error.description": "An unexpected error occurred.",
  "error.reload": "Reload page",

  // ---- beforeunload (LoginNudge) ----
  "nudge.beforeunload": "Your notes are only saved in this browser. Login to keep them safe.",

  // ---- Footer links ----
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.backToApp": "Back to Clipped",

  // ---- Language names (native) ----
  "lang.en": "English",
  "lang.ja": "日本語",
  "lang.zh": "中文",
  "lang.ko": "한국어",
  "lang.es": "Español",
  "lang.fr": "Français",
  "lang.de": "Deutsch",
} as const;

export type TranslationKeys = keyof typeof en;
