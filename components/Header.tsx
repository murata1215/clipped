/**
 * ヘッダーコンポーネント
 *
 * アプリケーション上部に表示される共通ヘッダー。
 * ロゴ、検索バー、言語切り替え、認証ボタンを含む。
 * 未ログイン時は「Googleでログイン」ボタンを表示し、
 * ログイン済み時はアバターとログアウトボタンを表示する。
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

/**
 * ヘッダーコンポーネントのプロパティ
 */
type HeaderProps = {
  /** 検索クエリの変更時に呼ばれるコールバック */
  onSearch: (query: string) => void;
};

export default function Header({ onSearch }: HeaderProps) {
  /** 検索入力フィールドの値 */
  const [searchQuery, setSearchQuery] = useState("");
  /** NextAuth セッション情報 */
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  /** API Key ドロップダウンの表示状態 */
  const [showApiKey, setShowApiKey] = useState(false);
  /** 取得した API Key */
  const [apiKey, setApiKey] = useState<string | null>(null);
  /** コピー成功フィードバック */
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  /** API Key ドロップダウンの ref（外部クリック検知用） */
  const apiKeyRef = useRef<HTMLDivElement>(null);

  /** API Key ドロップダウンの外部クリックで閉じる */
  useEffect(() => {
    if (!showApiKey) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (apiKeyRef.current && !apiKeyRef.current.contains(e.target as Node)) {
        setShowApiKey(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showApiKey]);

  /** API Key ボタンクリック時にサーバーから取得 */
  const handleApiKeyToggle = useCallback(async () => {
    if (showApiKey) {
      setShowApiKey(false);
      return;
    }
    if (!apiKey) {
      try {
        const res = await fetch("/api/settings/api-key");
        if (res.ok) {
          const data = await res.json();
          setApiKey(data.apiKey);
        }
      } catch (err) {
        console.error("API Key の取得に失敗:", err);
      }
    }
    setShowApiKey(true);
  }, [showApiKey, apiKey]);

  /** API Key をクリップボードにコピー */
  const handleCopyApiKey = useCallback(async () => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    } catch (err) {
      console.error("API Key のコピーに失敗:", err);
    }
  }, [apiKey]);

  /**
   * 検索入力の変更ハンドラ
   * 入力値を親コンポーネントに通知してリアルタイム検索を実現
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* ロゴ：アプリアイコン + アプリ名 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Clipped"
            className="w-7 h-7"
          />
          <h1 className="text-xl font-bold text-gray-800">
            Clipped
          </h1>
        </div>

        {/* 検索バー：Google Keep 風の丸みのある検索フィールド */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            {/* 検索アイコン（SVG） */}
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg
                         text-sm text-gray-700 placeholder-gray-400
                         focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-200
                         transition-colors"
            />
          </div>
        </div>

        {/* 言語切り替え */}
        <LanguageSwitcher />

        {/* 認証セクション：セッション状態に応じて表示を切り替え */}
        <div className="shrink-0">
          {status === "loading" ? (
            /* セッション読み込み中：スケルトン表示 */
            <div className="w-20 h-9 bg-gray-100 rounded-lg animate-pulse" />
          ) : session?.user ? (
            /* ログイン済み：アバター + ユーザー名 + ログアウトボタン */
            <div className="flex items-center gap-3">
              {/* ユーザーアバター */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || t("header.userAlt")}
                  className="w-8 h-8 rounded-full border border-gray-200"
                  referrerPolicy="no-referrer"
                />
              )}
              {/* ユーザー名（PC のみ表示） */}
              <span className="hidden sm:block text-sm text-gray-600 max-w-[120px] truncate">
                {session.user.name}
              </span>
              {/* API Key ボタン（PixDraft 連携用） */}
              <div className="relative" ref={apiKeyRef}>
                <button
                  onClick={handleApiKeyToggle}
                  className="px-2 py-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
                  title={t("header.apiKey")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </button>
                {showApiKey && apiKey && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200
                                  rounded-lg shadow-lg p-3 z-50">
                    <p className="text-xs text-gray-500 mb-1">{t("header.apiKey")}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-50 px-2 py-1.5 rounded border border-gray-100
                                       text-gray-700 font-mono truncate select-all">
                        {apiKey}
                      </code>
                      <button
                        onClick={handleCopyApiKey}
                        className={`shrink-0 px-2 py-1.5 text-xs rounded transition-colors ${
                          apiKeyCopied
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {apiKeyCopied ? t("header.apiKeyCopied") : t("header.apiKeyCopy")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ログアウトボタン */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1.5 text-xs font-medium text-gray-500
                           border border-gray-200 rounded-lg
                           hover:bg-gray-50 transition-colors"
              >
                {t("header.logout")}
              </button>
            </div>
          ) : (
            /* 未ログイン：ログインボタン */
            <button
              className="px-4 py-2 text-sm font-medium text-blue-600
                         border border-blue-200 rounded-lg
                         hover:bg-blue-50 transition-colors"
              onClick={() => router.push("/login")}
            >
              {t("header.login")}
            </button>
          )}
        </div>

        {/* Privacy / Terms リンク */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 text-[10px] text-gray-300">
          <Link href="/privacy" className="hover:text-gray-500 transition-colors">{t("footer.privacy")}</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-gray-500 transition-colors">{t("footer.terms")}</Link>
        </div>
      </div>
    </header>
  );
}
