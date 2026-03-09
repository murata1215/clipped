"use client";

import { useEffect } from "react";
import { FIRST_PASTE_KEY } from "@/lib/localStorage";
import { resizeToDataUrl } from "@/lib/imageUtils";
import type { LocalNote, LocalImage, CreateNoteInput } from "@/lib/localStorage";

/**
 * PasteHandler コンポーネントのプロパティ
 */
type PasteHandlerProps = {
  /** モーダルが開いているかどうか（開いていればグローバルペーストをスキップ） */
  isModalOpen: boolean;
  /** ペーストで新規メモが作成された時のコールバック */
  onNotePasted: (note: LocalNote) => void;
  /** メモ作成関数（useNoteService から渡される） */
  onCreateNote: (input: CreateNoteInput) => Promise<LocalNote>;
  /** 画像アップロード関数（サーバーモード時のみ） */
  onUploadImage?: (noteId: string, file: File | Blob) => Promise<LocalImage>;
  /** サーバーモードかどうか */
  isServerMode?: boolean;
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
 * - 画像（スクリーンショット等）: サーバーモード時は API にアップロード、
 *   未ログイン時は canvas でリサイズ → base64 → 新規メモ
 * - テキスト: プレーンテキストとして新規メモの本文に設定
 * - HTML: プレーンテキストにフォールバック
 * - ファイルドロップ: 画像ファイルのみ対応、1ファイル = 1メモ
 *
 * モーダルが開いている場合はスキップし、モーダル内のペースト処理に委譲する。
 * UI を持たない透過的なコンポーネント（null をレンダリング）。
 */
export default function PasteHandler({
  isModalOpen,
  onNotePasted,
  onCreateNote,
  onUploadImage,
  isServerMode,
}: PasteHandlerProps) {
  useEffect(() => {
    /**
     * 画像ファイルからメモを作成する共通処理
     *
     * サーバーモード: メモ作成 → 画像アップロード（2段階）
     * ローカルモード: リサイズ → base64 → メモ作成（1段階）
     */
    const createNoteFromImage = async (blob: File | Blob) => {
      if (isServerMode && onUploadImage) {
        // サーバーモード: まずメモを作成して、画像をアップロード
        const note = await onCreateNote({});
        await onUploadImage(note.id, blob);
        onNotePasted(note);
      } else {
        // ローカルモード: リサイズして base64 でメモに埋め込み
        const localImage = await resizeToDataUrl(blob, 800);
        const note = await onCreateNote({ images: [localImage] });
        recordFirstPaste();
        onNotePasted(note);
      }
    };

    /**
     * グローバルペーストイベントハンドラ
     */
    const handlePaste = async (e: ClipboardEvent) => {
      if (isModalOpen) return;

      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((i) => i.type.startsWith("image/"));

      if (imageItem) {
        e.preventDefault();
        const blob = imageItem.getAsFile();
        if (!blob) return;

        try {
          await createNoteFromImage(blob);
        } catch (err) {
          console.error("画像のペースト処理に失敗しました:", err);
        }
      } else {
        const text = e.clipboardData?.getData("text/plain");
        if (text?.trim()) {
          e.preventDefault();
          try {
            const note = await onCreateNote({ body: text.trim() });
            recordFirstPaste();
            onNotePasted(note);
          } catch (err) {
            console.error("テキストのペースト処理に失敗しました:", err);
          }
        }
      }
    };

    /**
     * ドラッグオーバーイベントハンドラ
     */
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    /**
     * ファイルドロップイベントハンドラ
     */
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (isModalOpen) return;

      const files = Array.from(e.dataTransfer?.files ?? []);
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      for (const file of imageFiles) {
        try {
          await createNoteFromImage(file);
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
  }, [isModalOpen, onNotePasted, onCreateNote, onUploadImage, isServerMode]);

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
