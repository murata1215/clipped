/**
 * 한국어 번역
 */
import type { TranslationKeys } from "./en";

export const ko: Record<TranslationKeys, string> = {
  "meta.title": "Clipped - 붙여넣기 메모",
  "meta.description": "Ctrl+V로 바로 붙여넣기. 브라우저 기반 Google Keep 스타일 메모 앱.",

  "header.searchPlaceholder": "메모 검색...",
  "header.login": "Google로 로그인",
  "header.logout": "로그아웃",
  "header.userAlt": "사용자",
  "header.apiKey": "API Key (PixDraft)",
  "header.apiKeyCopy": "복사",
  "header.apiKeyCopied": "복사됨",

  "newNote.placeholder": "메모 입력...",
  "newNote.titlePlaceholder": "제목",
  "newNote.close": "닫기",
  "newNote.pasteButton": "클립보드에서 붙여넣기",

  "grid.empty": "메모가 없습니다",
  "grid.emptyHint": "Ctrl+V로 이미지나 텍스트를 붙여넣거나, 위의 입력란에서 메모를 작성하세요.",
  "grid.loading": "로딩 중...",
  "grid.pinnedSection": "고정됨",
  "grid.othersSection": "기타",

  "card.imageAlt": "첨부 이미지",
  "card.pin": "고정",
  "card.unpin": "고정 해제",
  "card.delete": "삭제",

  "modal.titlePlaceholder": "제목",
  "modal.bodyPlaceholder": "메모 입력...",
  "modal.close": "닫기",
  "modal.saveFailed": "저장 실패",

  "color.default": "기본",
  "color.yellow": "노랑",
  "color.green": "초록",
  "color.blue": "파랑",
  "color.pink": "분홍",
  "color.purple": "보라",

  "tag.placeholder": "태그 추가...",

  "annotation.title": "마커 그리기",
  "annotation.back": "뒤로",
  "annotation.tabMarker": "마커",
  "annotation.tabCrop": "자르기",
  "annotation.tabMemo": "메모",
  "annotation.tools": "도구:",
  "annotation.pen": "펜 (자유 그리기)",
  "annotation.arrow": "화살표",
  "annotation.circleHand": "원 (손그림)",
  "annotation.circleExact": "원 (정확)",
  "annotation.color": "색상:",
  "annotation.width": "굵기:",
  "annotation.widthValue": "굵기: {value}px",
  "annotation.opacity": "투명도:",
  "annotation.opacityValue": "투명도: {value}%",
  "annotation.undo": "실행 취소 (Ctrl+Z)",
  "annotation.undoBtn": "되돌리기",
  "annotation.copyTitle": "클립보드에 복사 (Ctrl+C)",
  "annotation.copied": "복사됨",
  "annotation.copy": "복사",
  "annotation.clearAll": "모두 지우기",
  "annotation.clearBtn": "전체 삭제",
  "annotation.print": "인쇄",
  "annotation.printTitle": "이미지 인쇄 (1페이지에 맞춤)",
  "annotation.loadingImage": "이미지 로딩 중...",

  "annotation.colorRed": "빨강",
  "annotation.colorYellow": "노랑",
  "annotation.colorGreen": "초록",
  "annotation.colorBlue": "파랑",
  "annotation.colorBlack": "검정",
  "annotation.colorWhite": "흰색",

  "crop.title": "이미지 자르기",
  "crop.hint": "드래그하여 영역 선택",
  "crop.hintActive": "선택 영역 드래그로 이동 / 모서리 드래그로 크기 조정 / 바깥쪽 드래그로 다시 선택",
  "crop.hintStart": "이미지 위를 드래그하여 자르기 영역을 선택하세요",
  "crop.back": "뒤로",
  "crop.processing": "처리 중...",
  "crop.cropBtn": "자르기",
  "crop.loading": "이미지 로딩 중...",

  "nudge.banner": "💡 로그인하면 어떤 기기에서든 사용할 수 있습니다",
  "nudge.storage": "(로컬 저장: {value} MB 사용 중. 저장 용량 한도는 브라우저마다 다릅니다.)",
  "nudge.toast": "휴대폰에서도 메모를 보고 싶으신가요? 로그인하면 어디서나 접근할 수 있습니다.",

  "login.title": "Clipped",
  "login.tagline": "붙여넣기 메모 — 어디서든 접근",
  "login.description": "로그인하면 메모가 클라우드에 저장되어 어떤 기기에서든 접근할 수 있습니다.",
  "login.googleBtn": "Google로 로그인",
  "login.note": "로그인 없이도 사용 가능합니다 (메모는 브라우저에 저장됩니다)",
  "login.skipLink": "로그인 없이 사용 →",
  "login.loading": "로딩 중...",

  "error.title": "문제가 발생했습니다",
  "error.description": "예기치 않은 오류가 발생했습니다.",
  "error.reload": "페이지 새로고침",

  "nudge.beforeunload": "로그인하지 않으면 데이터가 이 브라우저에만 남습니다",

  "footer.privacy": "개인정보처리방침",
  "footer.terms": "이용약관",
  "footer.backToApp": "Clipped로 돌아가기",

  "lang.en": "English",
  "lang.ja": "日本語",
  "lang.zh": "中文",
  "lang.ko": "한국어",
  "lang.es": "Español",
  "lang.fr": "Français",
  "lang.de": "Deutsch",
};
