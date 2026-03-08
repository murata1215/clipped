"use client";

import { useEffect } from "react";
import { createNote, FIRST_PASTE_KEY } from "@/lib/localStorage";
import { resizeToDataUrl } from "@/lib/imageUtils";
import type { LocalNote } from "@/lib/localStorage";

/**
 * PasteHandler コンポーネントのプロパティ
 */
type PasteHandlerProps = {
  /** モーダルが開いているかどうか（開いていればグローバルペーストをスキップ） */
  isModalOpen: boolean;
  /** ペーストで新規メモが作成された時のコールバック */
  onNotePasted: (note: LocalNote) => void;
};

/**
 * PasteHandler コンポーネント
 *
 * window レベルで paste イベントおよび dragover/drop イベントをリッスンし、
 * Ctrl+V またはファイルドロップで即座にメモを作成する。
 * Clipped のコア機能。ページが最前面でアクティブであれば、要素のフォーカスなしで
 * ペーストイベントに反応する。
 *
 * 対応コンテンツ:
 * - 画像（スクリーンショット等）: canvas でリサイズ → base64 → 新規メモ
 * - テキスト: プレーンテキストとして新規メモの本文に設定
 * - HTML: プレーンテキストにフォールバック
 * - ファイルドロップ: 画像ファイルのみ対応、1ファイル = 1メモ
 *
 * モーダルが開いている場合はスキップし、モーダル内のペースト処理に委譲する。
 * UI を持たない透過的なコンポーネント（null をレンダリング）。
 *
 * @dnd-kit との競合について:
 * @dnd-kit は PointerEvent ベースで動作するため、HTML5 の dragover/drop
 * イベントとは競合しない。ファイルドロップは e.dataTransfer.types に "Files"
 * が含まれることで判別可能。
 */
export default function PasteHandler({ isModalOpen, onNotePasted }: PasteHandlerProps) {
  useEffect(() => {
    /**
     * グローバルペーストイベントハンドラ
     *
     * 処理フロー:
     * 1. モーダルが開いていればスキップ
     * 2. input / textarea にフォーカスがあればスキップ（通常の入力を妨げない）
     * 3. クリップボードに画像があれば画像処理
     * 4. テキストがあればテキスト処理
     * 5. メモを作成し、コールバックで親に通知
     */
    const handlePaste = async (e: ClipboardEvent) => {
      // モーダルが開いている場合はグローバルペーストをスキップ
      if (isModalOpen) return;

      // input や textarea にフォーカスがある場合はスキップ
      // （NewNoteInput 等の通常入力を妨げないため）
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const items = Array.from(e.clipboardData?.items ?? []);
      /** クリップボード内の画像アイテムを検索 */
      const imageItem = items.find((i) => i.type.startsWith("image/"));

      if (imageItem) {
        // === 画像ペースト処理 ===
        e.preventDefault();
        const blob = imageItem.getAsFile();
        if (!blob) return;

        try {
          /** canvas でリサイズして base64 に変換（最大 800px） */
          const localImage = await resizeToDataUrl(blob, 800);

          /** 画像付きの新規メモを作成 */
          const note = createNote({
            images: [localImage],
          });

          /** 初回ペースト日時を記録（ログイン誘導用） */
          recordFirstPaste();

          /** 親コンポーネントに通知（モーダルを開く） */
          onNotePasted(note);
        } catch (err) {
          console.error("画像のペースト処理に失敗しました:", err);
        }
      } else {
        // === テキストペースト処理 ===
        const text = e.clipboardData?.getData("text/plain");
        if (text?.trim()) {
          e.preventDefault();

          /** テキストを本文にセットした新規メモを作成 */
          const note = createNote({
            body: text.trim(),
          });

          /** 初回ペースト日時を記録 */
          recordFirstPaste();

          /** 親コンポーネントに通知 */
          onNotePasted(note);
        }
      }
    };

    /**
     * ドラッグオーバーイベントハンドラ
     *
     * ブラウザのデフォルト動作（ファイルを新しいタブで開く）を抑止し、
     * コピーカーソルを表示する。これがないと drop イベントが発火しない。
     */
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    /**
     * ファイルドロップイベントハンドラ
     *
     * 処理フロー:
     * 1. ブラウザのデフォルト動作を抑止
     * 2. モーダルが開いていればスキップ（モーダル操作を邪魔しない）
     * 3. ドロップされたファイルから画像のみフィルタ
     * 4. 各画像を resizeToDataUrl でリサイズ → base64 変換
     * 5. 1ファイル = 1メモとして createNote で作成
     * 6. onNotePasted で親に通知（グリッドに追加）
     *
     * 画像以外のファイル（PDF、Excel 等）は無視する。
     * 将来 Phase 8（PostgreSQL）導入後にサーバーサイド保存で対応予定。
     */
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();

      // モーダルが開いている場合はドロップをスキップ
      if (isModalOpen) return;

      // ドロップされたファイル一覧を取得
      const files = Array.from(e.dataTransfer?.files ?? []);

      // 画像ファイルのみフィルタ（image/png, image/jpeg, image/gif 等）
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));

      // 画像ファイルがなければ何もしない
      if (imageFiles.length === 0) return;

      // 各画像ファイルを順番に処理（1ファイル = 1メモ）
      for (const file of imageFiles) {
        try {
          /** canvas でリサイズして base64 に変換（最大 800px） */
          const localImage = await resizeToDataUrl(file, 800);

          /** 画像付きの新規メモを作成 */
          const note = createNote({
            images: [localImage],
          });

          /** 初回ペースト日時を記録（ログイン誘導用） */
          recordFirstPaste();

          /** 親コンポーネントに通知（グリッドに追加） */
          onNotePasted(note);
        } catch (err) {
          console.error("ファイルドロップの処理に失敗しました:", err);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [isModalOpen, onNotePasted]);

  // UI を持たないコンポーネント
  return null;
}

/**
 * 初回ペースト日時を localStorage に記録する
 * ログイン誘導（Phase 6）で「初回ペーストから3日後」の判定に使用。
 * すでに記録済みの場合は上書きしない。
 */
function recordFirstPaste(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(FIRST_PASTE_KEY)) {
    localStorage.setItem(FIRST_PASTE_KEY, new Date().toISOString());
  }
}
