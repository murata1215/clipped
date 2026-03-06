"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * トーストメッセージの型定義
 */
export type ToastMessage = {
  /** トーストの一意識別子 */
  id: string;
  /** 表示するメッセージ */
  message: string;
  /** 表示時間（ms）。デフォルト 5000ms */
  duration?: number;
};

/**
 * Toast コンポーネントのプロパティ
 */
type ToastProps = {
  /** 表示するトーストメッセージの配列 */
  toasts: ToastMessage[];
  /** トーストを閉じる時のコールバック */
  onDismiss: (id: string) => void;
};

/**
 * Toast コンポーネント
 *
 * 画面右下にスライドインするトースト通知。
 * 複数のトーストをスタック表示し、指定時間後に自動消去する。
 * LoginNudge や将来の保存通知などで共通利用する。
 */
export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * 個別のトーストアイテム
 * 自動消去タイマーとフェードアニメーションを管理する。
 */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  /** フェードアウトアニメーション用の表示状態 */
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    // アニメーション完了後に実際に削除
    setTimeout(() => onDismiss(toast.id), 300);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    // マウント直後にフェードイン
    requestAnimationFrame(() => setVisible(true));

    // 指定時間後に自動消去
    const timer = setTimeout(dismiss, toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.duration, dismiss]);

  return (
    <div
      className={`bg-gray-800 text-white text-sm px-4 py-3 rounded-lg shadow-lg
                  max-w-sm transition-all duration-300
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{toast.message}</span>
        <button
          className="text-gray-400 hover:text-white shrink-0"
          onClick={dismiss}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
