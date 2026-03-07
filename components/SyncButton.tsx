"use client";

/**
 * SyncButton コンポーネント
 *
 * ブラウザの localStorage に保存されているメモデータを
 * サーバーに同期するためのボタン。
 *
 * 同期フロー:
 * 1. ユーザーがボタンをクリック
 * 2. localStorage から全メモデータを取得
 * 3. POST /api/v1/sync に全データを送信
 * 4. サーバー側で JSON + 画像ファイルとして保存
 * 5. 成功/失敗をコールバックで通知
 *
 * これにより、外部サービス（PixDraft 等）が
 * REST API 経由でメモ・画像にアクセスできるようになる。
 *
 * Phase 8（PostgreSQL）導入後は不要になる予定。
 */

import { useState, useCallback } from "react";
import { getNotes } from "@/lib/localStorage";

// ============================================================
// 型定義
// ============================================================

/**
 * SyncButton コンポーネントのプロパティ
 */
type SyncButtonProps = {
  /** 同期完了時のトースト表示コールバック */
  onShowToast: (message: string) => void;
};

// ============================================================
// 定数
// ============================================================

/**
 * 同期 API のエンドポイント
 * basePath "/clipped" を含む完全パス
 */
const SYNC_API_URL = "/clipped/api/v1/sync";

// ============================================================
// コンポーネント
// ============================================================

/**
 * サーバー同期ボタンコンポーネント
 *
 * 画面右下にフローティングボタンとして表示。
 * クリックすると localStorage のデータをサーバーに同期する。
 *
 * @param onShowToast - トースト通知コールバック
 */
export default function SyncButton({ onShowToast }: SyncButtonProps) {
  /** 同期処理中フラグ */
  const [isSyncing, setIsSyncing] = useState(false);

  /** 最後に同期した日時（表示用） */
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    // localStorage から最後の同期日時を復元
    if (typeof window === "undefined") return null;
    return localStorage.getItem("clipped:last-synced");
  });

  /**
   * 同期処理を実行する
   *
   * 1. localStorage から全メモを取得
   * 2. API に POST リクエストを送信
   * 3. 結果をトースト通知で表示
   */
  const handleSync = useCallback(async () => {
    // 二重送信防止
    if (isSyncing) return;

    setIsSyncing(true);

    try {
      // localStorage から全メモデータを取得
      const notes = getNotes();

      if (notes.length === 0) {
        onShowToast("同期するメモがありません。");
        setIsSyncing(false);
        return;
      }

      // API キーを環境変数から取得（クライアントサイドで利用可能にする）
      // 注意: NEXT_PUBLIC_ プレフィックスで公開される
      const apiKey = process.env.NEXT_PUBLIC_CLIPPED_API_KEY;

      if (!apiKey) {
        onShowToast("API キーが設定されていません。.env.local を確認してください。");
        setIsSyncing(false);
        return;
      }

      // 同期 API にリクエスト送信
      const response = await fetch(SYNC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg =
          errorData?.error?.message || `同期に失敗しました（${response.status}）`;
        onShowToast(errorMsg);
        setIsSyncing(false);
        return;
      }

      const result = await response.json();

      // 同期日時を記録
      const now = new Date().toLocaleString("ja-JP");
      setLastSynced(now);
      localStorage.setItem("clipped:last-synced", now);

      onShowToast(result.message || "同期が完了しました。");
    } catch (error) {
      console.error("[SyncButton] 同期エラー:", error);
      onShowToast("同期中にネットワークエラーが発生しました。");
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, onShowToast]);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-40">
      {/* 最終同期日時の表示 */}
      {lastSynced && (
        <span className="text-[10px] text-gray-400 bg-white/80 px-2 py-0.5 rounded shadow-sm">
          最終同期: {lastSynced}
        </span>
      )}

      {/* 同期ボタン */}
      <button
        onClick={handleSync}
        disabled={isSyncing}
        title="サーバーに同期"
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg
          text-sm font-medium transition-all
          ${
            isSyncing
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          }
        `}
      >
        {/* 同期アイコン（回転アニメーション付き） */}
        <svg
          className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isSyncing ? "同期中..." : "サーバーに同期"}
      </button>
    </div>
  );
}
