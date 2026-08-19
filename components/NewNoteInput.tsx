"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * NewNoteInput コンポーネントのプロパティ
 */
type NewNoteInputProps = {
  /** メモ作成時のコールバック（タイトルと本文を渡す） */
  onCreate: (data: { title: string; body: string }) => void;
  /** ペーストボタン押下時のコールバック（クリップボードからメモ作成） */
  onPaste?: () => void;
};

/**
 * NewNoteInput コンポーネント
 *
 * メモ一覧上部に常設される Google Keep 風のインライン作成エリア。
 *
 * 動作フロー:
 * 1. 初期状態: 「メモを入力...」のプレースホルダーが表示された1行入力欄
 * 2. クリックで展開: タイトル欄と本文欄が表示される
 * 3. フォーカスが外れたら:
 *    - タイトルまたは本文に入力がある → メモを作成して折り畳み
 *    - 両方空 → 何もせず折り畳み
 */
export default function NewNoteInput({ onCreate, onPaste }: NewNoteInputProps) {
  const { t } = useI18n();
  /** 展開状態の管理 */
  const [isExpanded, setIsExpanded] = useState(false);
  /** タイトル入力値 */
  const [title, setTitle] = useState("");
  /** 本文入力値 */
  const [body, setBody] = useState("");
  /** コンテナ全体の ref（フォーカス外れ検知に使用） */
  const containerRef = useRef<HTMLDivElement>(null);
  /** 本文 textarea の ref（展開時のフォーカス制御用） */
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /**
   * フォーカスが外れた際の処理
   * コンテナ外にフォーカスが移ったかどうかを判定し、
   * 外に移った場合はメモを保存して折り畳む
   */
  const handleBlur = (e: React.FocusEvent) => {
    // relatedTarget がコンテナ内の要素なら、まだフォーカスは中にある
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;

    // タイトルまたは本文に入力がある場合はメモを作成
    if (title.trim() || body.trim()) {
      onCreate({ title: title.trim(), body: body.trim() });
    }

    // 状態をリセットして折り畳む
    setTitle("");
    setBody("");
    setIsExpanded(false);
  };

  /**
   * 展開時に本文 textarea にフォーカスを移す
   */
  useEffect(() => {
    if (isExpanded && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-4">
      <div
        ref={containerRef}
        className="bg-white rounded-lg border border-gray-200 shadow-sm
                   hover:shadow-md transition-shadow"
        onBlur={handleBlur}
      >
        {isExpanded ? (
          /* 展開状態: タイトル + 本文の入力フォーム */
          <div className="p-4">
            {/* タイトル入力欄 */}
            <input
              type="text"
              placeholder={t("newNote.titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm font-medium text-gray-900 placeholder-gray-400
                         outline-none mb-2"
            />
            {/* 本文入力欄（複数行） */}
            <textarea
              ref={bodyRef}
              placeholder={t("newNote.placeholder")}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full text-sm text-gray-700 placeholder-gray-400
                         outline-none resize-none"
            />
            {/* 閉じるボタン */}
            <div className="flex justify-end mt-2">
              <button
                className="px-4 py-1.5 text-sm font-medium text-gray-600
                           rounded hover:bg-gray-100 transition-colors"
                onMouseDown={(e) => {
                  // onBlur より先に発火させるため mouseDown を使用
                  e.preventDefault();
                  if (title.trim() || body.trim()) {
                    onCreate({ title: title.trim(), body: body.trim() });
                  }
                  setTitle("");
                  setBody("");
                  setIsExpanded(false);
                }}
              >
                {t("newNote.close")}
              </button>
            </div>
          </div>
        ) : (
          /* 折り畳み状態: クリックで展開するプレースホルダー + ペーストボタン */
          <div className="flex items-center">
            <div
              className="flex-1 px-4 py-3 cursor-text"
              onClick={() => setIsExpanded(true)}
            >
              <span className="text-sm text-gray-400">{t("newNote.placeholder")}</span>
            </div>
            {onPaste && (
              <button
                className="px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50
                           transition-colors rounded-r-lg"
                onClick={onPaste}
                title={t("newNote.pasteButton")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
