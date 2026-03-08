"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * ヘッダーコンポーネントのプロパティ
 */
type HeaderProps = {
  /** 検索クエリの変更時に呼ばれるコールバック */
  onSearch: (query: string) => void;
};

/**
 * ヘッダーコンポーネント
 *
 * アプリケーション上部に表示される共通ヘッダー。
 * ロゴ、検索バー、認証ボタンを含む。
 * 未ログイン時は「Googleでログイン」ボタンを表示し、
 * ログイン済み時はアバターとログアウトボタンを表示する。
 */
export default function Header({ onSearch }: HeaderProps) {
  /** 検索入力フィールドの値 */
  const [searchQuery, setSearchQuery] = useState("");
  /** NextAuth セッション情報 */
  const { data: session, status } = useSession();
  const router = useRouter();

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
        {/* ロゴ：アプリ名とキャッチコピー */}
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-xl font-bold text-gray-800">
            📋 Clipped
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
              placeholder="メモを検索..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg
                         text-sm text-gray-700 placeholder-gray-400
                         focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-200
                         transition-colors"
            />
          </div>
        </div>

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
                  alt={session.user.name || "ユーザー"}
                  className="w-8 h-8 rounded-full border border-gray-200"
                  referrerPolicy="no-referrer"
                />
              )}
              {/* ユーザー名（PC のみ表示） */}
              <span className="hidden sm:block text-sm text-gray-600 max-w-[120px] truncate">
                {session.user.name}
              </span>
              {/* ログアウトボタン */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1.5 text-xs font-medium text-gray-500
                           border border-gray-200 rounded-lg
                           hover:bg-gray-50 transition-colors"
              >
                ログアウト
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
              Googleでログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
