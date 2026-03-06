"use client";

import { useState } from "react";

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
 * ロゴ、検索バー、ログインボタンを含む。
 * 未ログイン時は「Googleでログイン」ボタンを表示し、
 * ログイン済み時はアバターを表示する（Phase 7 で実装予定）。
 */
export default function Header({ onSearch }: HeaderProps) {
  /** 検索入力フィールドの値 */
  const [searchQuery, setSearchQuery] = useState("");

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

        {/* ログインボタン（未ログイン時） */}
        {/* TODO: Phase 7 でログイン状態に応じた表示切替を実装 */}
        <button
          className="shrink-0 px-4 py-2 text-sm font-medium text-blue-600
                     border border-blue-200 rounded-lg
                     hover:bg-blue-50 transition-colors"
          onClick={() => {
            // TODO: Phase 7 で signIn("google") を呼び出す
            alert("ログイン機能は今後実装されます");
          }}
        >
          Googleでログイン
        </button>
      </div>
    </header>
  );
}
