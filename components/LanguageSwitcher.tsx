/**
 * 言語切り替えコンポーネント
 *
 * ヘッダー右側に配置するコンパクトなドロップダウン。
 * 地球アイコンをクリックすると言語一覧が表示される。
 * 選択した言語は localStorage に保存される。
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/locales";
import type { TranslationKeys } from "@/locales";

/**
 * 各ロケールの表示名を取得するための翻訳キーマップ
 */
const LOCALE_LABEL_KEYS: Record<Locale, TranslationKeys> = {
  en: "lang.en",
  ja: "lang.ja",
  zh: "lang.zh",
  ko: "lang.ko",
  es: "lang.es",
  fr: "lang.fr",
  de: "lang.de",
};

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /** ドロップダウン外クリックで閉じる */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      {/* 地球アイコンボタン */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500
                   border border-gray-200 rounded-lg
                   hover:bg-gray-50 transition-colors"
        aria-label="Language"
      >
        {/* 地球 SVG アイコン */}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 21a9 9 0 100-18 9 9 0 000 18z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.6 9h16.8M3.6 15h16.8"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3a15 15 0 014 9 15 15 0 01-4 9 15 15 0 01-4-9 15 15 0 014-9z"
          />
        </svg>
        <span className="hidden sm:inline uppercase text-xs font-medium">
          {locale}
        </span>
      </button>

      {/* ドロップダウン */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200
                        rounded-lg shadow-lg z-50 min-w-[140px] py-1">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setLocale(loc);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50
                          transition-colors flex items-center gap-2
                          ${loc === locale ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}
            >
              {t(LOCALE_LABEL_KEYS[loc])}
              {loc === locale && (
                <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
