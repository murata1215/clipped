"use client";

import { LocalNote } from "@/lib/localStorage";

/**
 * DragOverlayCard コンポーネントのプロパティ
 */
type DragOverlayCardProps = {
  /** ドラッグ中のメモデータ */
  note: LocalNote;
  /** カードの幅（Masonry のカラム幅に合わせる） */
  width: number;
};

/**
 * メモカードの背景色マッピング（NoteCard と同じ定義）
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
 * DragOverlayCard コンポーネント
 *
 * ドラッグ中にカーソルに追従して表示される見た目上のカードクローン。
 * NoteCard と同じ視覚的デザインだが、インタラクティブな要素（ボタンなど）は含まない。
 *
 * 「持ち上げ」感を演出するため:
 * - shadow-xl で強い影を付与
 * - scale(1.03) で少し拡大
 * - rotate(2deg) で軽い傾き
 * - pointer-events: none で操作を無効化
 */
export default function DragOverlayCard({ note, width }: DragOverlayCardProps) {
  const bgColor = colorMap[note.color] || colorMap.default;

  return (
    <div
      style={{ width }}
      className={`${bgColor} rounded-lg border border-gray-200
                  shadow-xl transform scale-[1.03] rotate-2
                  pointer-events-none`}
    >
      {/* 添付画像サムネイル：先頭1枚のみ表示 */}
      {note.images.length > 0 && (
        <div className="w-full overflow-hidden rounded-t-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={note.images[0].dataUrl}
            alt="添付画像"
            className="w-full h-auto object-cover max-h-48"
          />
        </div>
      )}

      {/* カード本体（タイトル・本文・タグ） */}
      <div className="p-3">
        {/* タイトル */}
        {note.title && (
          <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
            {note.title}
          </h3>
        )}

        {/* 本文プレビュー */}
        {note.body && (
          <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap">
            {note.body}
          </p>
        )}

        {/* タグ一覧 */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500
                           rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ピン留めインジケータ */}
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
