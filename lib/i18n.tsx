/**
 * i18n（国際化）コンテキスト
 *
 * localStorage にユーザーの言語設定を保存し、
 * ブラウザの言語設定から初期ロケールを自動検出する。
 * 外部ライブラリ不要の軽量実装（React Context + JSON 辞書）。
 */
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  dictionaries,
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  type TranslationKeys,
} from "@/locales";

/** localStorage のキー */
const STORAGE_KEY = "clipped:lang";

// ============================================================
// Context
// ============================================================

interface I18nContextValue {
  /** 現在のロケール */
  locale: Locale;
  /** ロケールを変更する */
  setLocale: (locale: Locale) => void;
  /** 翻訳文字列を取得する。{value} プレースホルダー対応 */
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ============================================================
// ブラウザ言語から初期ロケールを検出
// ============================================================

function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  // localStorage に保存済みの設定を優先
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LOCALES.includes(saved as Locale)) {
    return saved as Locale;
  }

  // ブラウザの言語設定から検出（先頭2文字で照合）
  const browserLangs = navigator.languages ?? [navigator.language];
  for (const lang of browserLangs) {
    const prefix = lang.slice(0, 2).toLowerCase() as Locale;
    if (LOCALES.includes(prefix)) {
      return prefix;
    }
  }

  return DEFAULT_LOCALE;
}

// ============================================================
// Provider
// ============================================================

/**
 * I18nProvider
 *
 * アプリ全体を囲んで、翻訳コンテキストを提供する。
 * layout.tsx の AuthProvider 内側に配置する。
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  // クライアントマウント時にロケールを検出
  useEffect(() => {
    setLocaleState(detectLocale());
    setMounted(true);
  }, []);

  // <html lang> 属性を動的に更新
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKeys, params?: Record<string, string | number>): string => {
      const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
      let text = dict[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;

      // {value} 等のプレースホルダーを置換
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }

      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

/**
 * useI18n — 翻訳コンテキストにアクセスする hook
 *
 * @example
 * const { t, locale, setLocale } = useI18n();
 * <button>{t("header.login")}</button>
 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

/** ErrorBoundary（class コンポーネント）用にコンテキストをエクスポート */
export { I18nContext };
export type { Locale };
