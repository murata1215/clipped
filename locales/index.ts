/**
 * i18n ロケールインデックス
 *
 * 全言語の辞書をまとめてエクスポートする。
 * 言語追加時はここに import + dictionaries への追加のみで対応可能。
 */
import { en, type TranslationKeys } from "./en";
import { ja } from "./ja";
import { zh } from "./zh";
import { ko } from "./ko";
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";

/** サポートするロケール ID */
export type Locale = "en" | "ja" | "zh" | "ko" | "es" | "fr" | "de";

/** ロケール一覧（UI の言語セレクターで使用） */
export const LOCALES: Locale[] = ["en", "ja", "zh", "ko", "es", "fr", "de"];

/** デフォルトロケール */
export const DEFAULT_LOCALE: Locale = "en";

/** 全辞書マップ */
export const dictionaries: Record<Locale, Record<TranslationKeys, string>> = {
  en,
  ja,
  zh,
  ko,
  es,
  fr,
  de,
};

export type { TranslationKeys };
