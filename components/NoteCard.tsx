"use client";

import React from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { LocalNote } from "@/lib/localStorage";
import { useI18n } from "@/lib/i18n";

/**
 * NoteCard コンポーネントのプロパティ
 */
type NoteCardProps = {
  /** 表示するメモデータ */
  note: LocalNote;
  /** カードクリック時のコールバック（モーダルを開く） */
  onClick: (note: LocalNote) => void;
  /** ピン留めトグル時のコールバック */
  onTogglePin: (id: string) => void;
  /** 削除ボタンクリック時のコールバック */
  onDelete: (id: string) => void;
  /**
   * 外部から適用される CSS スタイル
   * Masonry レイアウトの absolute positioning で使用
   */
  style?: React.CSSProperties;
  /** ドラッグ中かどうか（ゴースト表示用） */
  isDragging?: boolean;
  /** @dnd-kit のドラッグリスナー（ドラッグ開始イベントなど） */
  dragListeners?: SyntheticListenerMap;
  /** @dnd-kit のドラッグ属性（role, tabIndex など） */
  dragAttributes?: DraggableAttributes;
  /** 画像読み込み完了時のコールバック（Masonry 再計算用） */
  onImageLoad?: () => void;
};

/**
 * メモカードの背景色マッピング
 * Tailwind の動的クラスを使用するため、safelist に登録済み
 */
const colorMap: Record<string, string> = {
  default: "bg-white",
  yellow: "bg-note-yellow",
  green: "bg-note-green",
  blue: "bg-note-blue",
  pink: "bg-note-pink",
  purple: "bg-note-purple",
};

/**
 * NoteCard コンポーネント
 *
 * メモ一覧グリッド内の個別カード。
 * Google Keep 風のデザインで、カード背景色・ピン留め・
 * ホバー時のアクションボタンを表示する。
 *
 * forwardRef を使用して外部から ref を受け取り、
 * Masonry レイアウトエンジンによる高さ測定を可能にする。
 *
 * - カード全体をクリック → モーダルで編集
 * - ピンアイコン → ピン留めトグル
 * - 削除アイコン → メモ削除
 * - 画像がある場合は先頭1枚のサムネイルを表示
 */
const NoteCard = React.forwardRef<HTMLDivElement, NoteCardProps>(
  (
    {
      note,
      onClick,
      onTogglePin,
      onDelete,
      style,
      isDragging = false,
      dragListeners,
      dragAttributes,
      onImageLoad,
    },
    ref
  ) => {
    const { t } = useI18n();
    /** カードの背景色クラスを取得（未定義の場合はデフォルト白） */
    const bgColor = colorMap[note.color] || colorMap.default;

    return (
      <div
        ref={ref}
        style={style}
        className={`group relative ${bgColor} rounded-lg border border-gray-200
                    hover:shadow-md transition-shadow cursor-pointer
                    ${isDragging ? "opacity-30" : "opacity-100"}`}
        onClick={() => onClick(note)}
        {...dragListeners}
        {...dragAttributes}
      >
        {/* 添付画像サムネイル：先頭1枚のみ表示 */}
        {note.images.length > 0 && (
          <div className="w-full overflow-hidden rounded-t-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={note.images[0].dataUrl}
              alt={t("card.imageAlt")}
              className="w-full h-auto object-cover max-h-48"
              onLoad={onImageLoad}
            />
          </div>
        )}

        {/* カード本体（タイトル・本文・タグ） */}
        <div className="p-3">
          {/* タイトル：空でなければ表示 */}
          {note.title && (
            <h3 className="text-xl font-medium text-gray-900 mb-1 line-clamp-2">
              {note.title}
            </h3>
          )}

          {/* 本文プレビュー：画像なしテキストメモは20行、画像ありは8行 */}
          {note.body && (
            <p className={`text-base text-gray-600 whitespace-pre-wrap ${
              note.images.length > 0 ? "line-clamp-[8]" : "line-clamp-[20]"
            }`}>
              {note.body}
            </p>
          )}

          {/* タグ一覧 */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm px-2 py-0.5 bg-gray-100 text-gray-500
                             rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ホバー時に表示されるアクションボタン群 */}
        <div
          className="absolute bottom-1 right-1 flex gap-1
                      opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {/* ピン留めトグルボタン */}
          <button
            title={note.pinned ? t("card.unpin") : t("card.pin")}
            className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              // カード全体のクリックイベントが発火しないようにする
              e.stopPropagation();
              onTogglePin(note.id);
            }}
          >
            {/* ピンアイコン：ピン留め時は塗りつぶし */}
            <svg
              className="w-4 h-4"
              fill={note.pinned ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>

          {/* 削除ボタン */}
          <button
            title={t("card.delete")}
            className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >
            {/* ゴミ箱アイコン */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* ピン留めインジケータ（右上、常時表示） */}
        {note.pinned && (
          <div className="absolute top-2 right-2 text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

NoteCard.displayName = "NoteCard";

export default NoteCard;
