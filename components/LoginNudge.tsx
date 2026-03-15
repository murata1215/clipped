"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  FIRST_PASTE_KEY,
  NUDGE_DISMISSED_KEY,
} from "@/lib/localStorage";

/**
 * LoginNudge コンポーネントのプロパティ
 */
type LoginNudgeProps = {
  /** トーストを表示するためのコールバック */
  onShowToast: (message: string) => void;
  /** 現在のメモ件数（親コンポーネントからリアルタイムで受け取る） */
  noteCount: number;
};

/**
 * LoginNudge コンポーネント
 *
 * 未ログインユーザーに対して、押しつけない自然なタイミングで
 * ログインを誘導するコンポーネント。
 *
 * 3つの誘導タイミング:
 * 1. メモが5件を超えたら → ヘッダー下にバナー表示
 * 2. ブラウザを閉じようとしたとき → beforeunload 警告
 * 3. 初回ペーストから3日後 → トースト表示
 */
export default function LoginNudge({ onShowToast, noteCount }: LoginNudgeProps) {
  /** NextAuth セッション情報（ログイン済みなら誘導不要） */
  const { data: session } = useSession();
  /** バナー表示の可否 */
  const [showBanner, setShowBanner] = useState(false);

  /**
   * localStorage の使用量を計算する（MB 単位）
   * noteCount が変わるたびに再計算される
   */
  const storageMB = useMemo(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += key.length + (localStorage.getItem(key)?.length ?? 0);
        }
      }
      // JavaScript 文字列は UTF-16（2バイト/文字）
      return ((total * 2) / 1024 / 1024).toFixed(1);
    } catch {
      return "?";
    }
  }, [noteCount]);

  /**
   * メモ件数に応じてバナーの表示/非表示をリアルタイムに切り替える。
   * noteCount が props で渡されるため、メモ追加/削除のたびに再評価される。
   */
  useEffect(() => {
    const dismissed = localStorage.getItem(NUDGE_DISMISSED_KEY);
    if (noteCount > 5 && !dismissed) {
      setShowBanner(true);
    } else if (noteCount <= 5) {
      // メモが削除されて5件以下になった場合はバナーを非表示に
      setShowBanner(false);
    }
  }, [noteCount]);

  useEffect(() => {
    // --- 2. beforeunload 警告 ---
    // メモがある状態でブラウザを閉じようとしたときに警告
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (noteCount > 0) {
        // ブラウザ標準の離脱確認ダイアログを表示
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // --- 3. 初回ペーストから3日後にトースト ---
    const firstPaste = localStorage.getItem(FIRST_PASTE_KEY);
    if (firstPaste) {
      const firstPasteDate = new Date(firstPaste);
      const threeDaysLater = new Date(firstPasteDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now >= threeDaysLater) {
        // 3日後トーストは1回だけ表示する
        const toastShownKey = "clipped_3day_toast_shown";
        if (!localStorage.getItem(toastShownKey)) {
          localStorage.setItem(toastShownKey, "true");
          // 少し遅延してからトースト表示（ページ読み込み直後は避ける）
          setTimeout(() => {
            onShowToast("スマホからも見たくないですか？ログインすればどこからでもアクセスできます");
          }, 3000);
        }
      }
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [onShowToast, noteCount]);

  /**
   * バナーの×ボタンを押した時の処理
   * NUDGE_DISMISSED_KEY に記録して、次回以降表示しない
   */
  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem(NUDGE_DISMISSED_KEY, "true");
  };

  // ログイン済み、またはバナーが非表示なら何もレンダリングしない
  if (session || !showBanner) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <p className="text-sm text-blue-600">
          💡 ログインするとどの端末からでも使えます
          <span className="ml-2 text-blue-400">（ローカル保存: {storageMB} MB 使用中 ※ブラウザにより保存容量の上限は異なります）</span>
        </p>
        <button
          className="text-blue-400 hover:text-blue-600 p-1"
          onClick={handleDismissBanner}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
