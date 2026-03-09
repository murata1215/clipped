"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { updateNote as updateLocalNote, type LocalNote, type LocalImage, type UpdateNoteInput } from "@/lib/localStorage";
import { resizeToDataUrl } from "@/lib/imageUtils";
import ColorPicker from "./ColorPicker";
import TagInput from "./TagInput";
import ImageCropModal from "./ImageCropModal";
import ImageAnnotation from "./ImageAnnotation";

/**
 * NoteModal コンポーネントのプロパティ
 */
type NoteModalProps = {
  /** 編集対象のメモ */
  note: LocalNote;
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
  /** メモ保存関数（useNoteService から渡される、未指定時は localStorage） */
  onSave?: (id: string, input: UpdateNoteInput) => Promise<LocalNote | null>;
  /** 画像アップロード関数（サーバーモード時のみ） */
  onUploadImage?: (noteId: string, file: File | Blob) => Promise<LocalImage>;
  /** 画像削除関数（サーバーモード時のみ） */
  onDeleteImage?: (noteId: string, imageId: string) => Promise<void>;
  /** 画像差し替え関数（マーカー/切り抜き後、サーバーモード時のみ） */
  onReplaceImage?: (noteId: string, oldImageId: string, newDataUrl: string) => Promise<LocalImage>;
  /** サーバーモードかどうか */
  isServerMode?: boolean;
};

/**
 * メモカードの背景色マッピング（モーダル背景用）
 */
const colorBgMap: Record<string, string> = {
  default: "bg-white",
  yellow: "bg-note-yellow",
  green: "bg-note-green",
  blue: "bg-note-blue",
  pink: "bg-note-pink",
  purple: "bg-note-purple",
};

/**
 * 画像編集モードの型定義
 * null: 編集なし / "crop": 切り抜きモード / "annotate": マーカーモード
 */
type ImageEditMode = null | "crop" | "annotate";

/**
 * NoteModal コンポーネント
 *
 * メモの本格的な編集モーダル。画面中央にオーバーレイ付きで表示する。
 *
 * 主要機能:
 * - タイトル・本文の編集（自動拡張 textarea）
 * - **自動保存（debounce 1500ms）** — 保存ボタンなし
 * - カラーピッカー（6色の背景色選択）
 * - タグ入力（Enter / カンマで確定、×で削除）
 * - 画像サムネイル一覧（ホバーで編集メニュー表示）
 * - 画像の切り抜き（Canvas ベースの矩形選択）
 * - 画像へのマーカー描画（カスタム Canvas）
 * - モーダル内 Ctrl+V で画像追加
 * - Esc キーまたはオーバーレイクリックで閉じる
 */
export default function NoteModal({
  note,
  onClose,
  onSave,
  onUploadImage,
  onDeleteImage,
  onReplaceImage,
  isServerMode,
}: NoteModalProps) {
  // ================================================================
  // ステート管理
  // ================================================================

  /** 編集中のタイトル */
  const [title, setTitle] = useState(note.title);
  /** 編集中の本文 */
  const [body, setBody] = useState(note.body);
  /** 編集中のカラー */
  const [color, setColor] = useState(note.color);
  /** 編集中のタグ配列 */
  const [tags, setTags] = useState(note.tags);
  /** 編集中の画像配列 */
  const [images, setImages] = useState<LocalImage[]>(note.images);
  /** 自動保存タイマーの ref */
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  /** モーダルコンテナの ref */
  const modalRef = useRef<HTMLDivElement>(null);

  /**
   * 画像編集モード（null: メモ編集 / "crop": 切り抜き / "annotate": マーカー）
   */
  const hasImages = note.images.length > 0;
  const [editMode, setEditMode] = useState<ImageEditMode>(
    hasImages ? "annotate" : null
  );
  /** 編集対象の画像 ID */
  const [editingImageId, setEditingImageId] = useState<string | null>(
    hasImages ? note.images[0].id : null
  );
  /** 保存エラーメッセージ */
  const [saveError, setSaveError] = useState<string | null>(null);

  // ================================================================
  // 保存ヘルパー
  // ================================================================

  /**
   * メモを保存する統一関数
   * onSave が渡されていれば API 経由、なければ localStorage に保存
   */
  const saveNote = useCallback(
    async (id: string, input: UpdateNoteInput) => {
      if (onSave) {
        try {
          await onSave(id, input);
        } catch (err) {
          console.error("メモの保存に失敗:", err);
          setSaveError("保存に失敗しました");
          setTimeout(() => setSaveError(null), 5000);
        }
      } else {
        updateLocalNote(id, input);
      }
    },
    [onSave]
  );

  // ================================================================
  // 保存エラー通知のリスナー（localStorage 容量超過用）
  // ================================================================

  useEffect(() => {
    const handleSaveError = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSaveError(detail?.message || "保存に失敗しました");
      setTimeout(() => setSaveError(null), 5000);
    };
    window.addEventListener("clipped:save-error", handleSaveError);
    return () => window.removeEventListener("clipped:save-error", handleSaveError);
  }, []);

  // ================================================================
  // 自動保存（debounce 1500ms）
  // ================================================================

  /**
   * 自動保存を実行する
   * サーバーモード時は画像を含めない（images は API 側で管理される）
   */
  const saveNow = useCallback(() => {
    if (isServerMode) {
      // サーバーモード: テキストフィールドのみ保存（画像は API で個別管理）
      saveNote(note.id, { title, body, color, tags });
    } else {
      saveNote(note.id, { title, body, color, tags, images });
    }
  }, [note.id, title, body, color, tags, images, isServerMode, saveNote]);

  /**
   * 変更があるたびに debounce タイマーをリセットして自動保存をスケジュールする
   */
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveNow();
    }, 1500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [title, body, color, tags, images, saveNow]);

  // ================================================================
  // キーボードイベント
  // ================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, color, tags, images, editMode]);

  // ================================================================
  // モーダル内ペースト処理
  // ================================================================

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((i) => i.type.startsWith("image/"));

      if (imageItem) {
        e.preventDefault();
        const blob = imageItem.getAsFile();
        if (!blob) return;

        try {
          if (isServerMode && onUploadImage) {
            // サーバーモード: API にアップロード
            const newImage = await onUploadImage(note.id, blob);
            setImages((prev) => [...prev, newImage]);
          } else {
            // ローカルモード: リサイズして base64
            const localImage = await resizeToDataUrl(blob, 800);
            setImages((prev) => [...prev, localImage]);
          }
        } catch (err) {
          console.error("モーダル内画像ペーストに失敗:", err);
        }
      }
    };

    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener("paste", handlePaste);
      return () => modal.removeEventListener("paste", handlePaste);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isServerMode, onUploadImage, note.id]);

  // ================================================================
  // ハンドラ
  // ================================================================

  /**
   * モーダルを閉じる
   */
  const handleClose = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    if (isServerMode) {
      saveNote(note.id, { title, body, color, tags });
    } else {
      saveNote(note.id, { title, body, color, tags, images });
    }
    onClose();
  };

  /**
   * 画像を削除する
   */
  const handleRemoveImage = async (imageId: string) => {
    if (isServerMode && onDeleteImage) {
      try {
        await onDeleteImage(note.id, imageId);
      } catch (err) {
        console.error("画像の削除に失敗:", err);
      }
    }
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  /**
   * 画像編集モードを開始する
   */
  const handleStartImageEdit = (imageId: string, mode: "crop" | "annotate") => {
    setEditingImageId(imageId);
    setEditMode(mode);
  };

  /**
   * 画像切り抜き完了ハンドラ
   */
  const handleCropComplete = useCallback(
    async (croppedDataUrl: string) => {
      if (!editingImageId) return;

      if (isServerMode && onReplaceImage) {
        // サーバーモード: 切り抜き結果をアップロードして旧画像を差し替え
        try {
          const newImage = await onReplaceImage(note.id, editingImageId, croppedDataUrl);
          setImages((prev) =>
            prev.map((img) =>
              img.id === editingImageId ? newImage : img
            )
          );
        } catch (err) {
          console.error("切り抜き画像の保存に失敗:", err);
        }
      } else {
        // ローカルモード: dataUrl を直接更新
        setImages((prev) =>
          prev.map((img) =>
            img.id === editingImageId
              ? { ...img, dataUrl: croppedDataUrl }
              : img
          )
        );
      }
      setEditMode(null);
      setEditingImageId(null);
    },
    [editingImageId, isServerMode, onReplaceImage, note.id]
  );

  /**
   * 画像編集からの「戻る」ハンドラ
   *
   * ImageAnnotation から描画後の DataURL が引数として渡される。
   * React の setImages は非同期バッチ処理のため、DataURL を引数で直接受け取り
   * ローカル変数 finalImages を同期的に構築してから保存する。
   */
  const handleEditCancel = useCallback(async (annotatedDataUrl?: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    let finalImages = images;
    if (annotatedDataUrl && editingImageId) {
      if (isServerMode && onReplaceImage) {
        // サーバーモード: 描画結果をアップロードして旧画像を差し替え
        try {
          const newImage = await onReplaceImage(note.id, editingImageId, annotatedDataUrl);
          finalImages = images.map((img) =>
            img.id === editingImageId ? newImage : img
          );
          setImages(finalImages);
        } catch (err) {
          console.error("マーカー画像の保存に失敗:", err);
        }
      } else {
        // ローカルモード: dataUrl を直接更新
        finalImages = images.map((img) =>
          img.id === editingImageId
            ? { ...img, dataUrl: annotatedDataUrl }
            : img
        );
        setImages(finalImages);
      }
    }

    // 保存して閉じる
    if (isServerMode) {
      saveNote(note.id, { title, body, color, tags });
    } else {
      saveNote(note.id, { title, body, color, tags, images: finalImages });
    }
    onClose();
  }, [note.id, title, body, color, tags, images, editingImageId, onClose, isServerMode, onReplaceImage, saveNote]);

  /**
   * 画像編集モード切り替えハンドラ
   */
  const handleSwitchEditMode = useCallback((mode: "crop" | "annotate" | "memo", annotatedDataUrl?: string) => {
    if (annotatedDataUrl && editingImageId) {
      if (isServerMode && onReplaceImage) {
        // サーバーモード: 描画結果をアップロード（非同期だがUIは切り替えを先に進める）
        onReplaceImage(note.id, editingImageId, annotatedDataUrl).then((newImage) => {
          setImages((prev) =>
            prev.map((img) =>
              img.id === editingImageId ? newImage : img
            )
          );
        }).catch((err) => {
          console.error("画像差し替えに失敗:", err);
        });
      } else {
        setImages((prev) =>
          prev.map((img) =>
            img.id === editingImageId
              ? { ...img, dataUrl: annotatedDataUrl }
              : img
          )
        );
      }
    }

    if (mode === "memo") {
      setEditMode(null);
      setEditingImageId(null);
    } else {
      setEditMode(mode);
    }
  }, [editingImageId, isServerMode, onReplaceImage, note.id]);

  /** モーダルの背景色クラス */
  const bgColor = colorBgMap[color] || colorBgMap.default;

  /** 現在編集中の画像データ */
  const editingImage = editingImageId
    ? images.find((img) => img.id === editingImageId)
    : null;

  // ================================================================
  // レンダリング
  // ================================================================

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        onClick={handleClose}
      >
        <div
          ref={modalRef}
          className={`${bgColor} rounded-lg shadow-xl w-full max-w-lg mx-4
                      max-h-[85vh] flex flex-col transition-colors`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 保存エラー通知 */}
          {saveError && (
            <div className="mx-4 mt-3 px-3 py-2 bg-red-100 border border-red-300
                            text-red-700 text-xs rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{saveError}</span>
            </div>
          )}

          {/* 画像サムネイル一覧 */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 pb-0">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt="添付画像"
                    className="w-24 h-24 object-cover rounded-lg cursor-pointer
                               hover:ring-2 hover:ring-blue-400 transition-all"
                    onClick={() => handleStartImageEdit(img.id, "annotate")}
                  />

                  {/* 画像削除ボタン */}
                  <button
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 text-white
                               rounded-full flex items-center justify-center text-xs
                               opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(img.id)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 編集エリア */}
          <div className="flex-1 overflow-y-auto p-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトル"
              className="w-full text-lg font-medium text-gray-900 placeholder-gray-400
                         outline-none bg-transparent mb-3"
            />

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="メモを入力..."
              rows={4}
              className="w-full text-sm text-gray-700 placeholder-gray-400
                         outline-none resize-none bg-transparent min-h-[100px]"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
          </div>

          {/* タグ入力エリア */}
          <div className="px-4 pb-2 border-t border-gray-200/50">
            <div className="pt-2">
              <TagInput tags={tags} onChange={setTags} />
            </div>
          </div>

          {/* フッター */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200/50">
            <ColorPicker value={color} onChange={setColor} />
            <button
              className="px-4 py-1.5 text-sm font-medium text-gray-600
                         rounded hover:bg-black/5 transition-colors"
              onClick={handleClose}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* 画像切り抜きモーダル */}
      {editMode === "crop" && editingImage && (
        <ImageCropModal
          imageSrc={editingImage.dataUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleEditCancel}
          onSwitchMode={handleSwitchEditMode}
          currentMode="crop"
        />
      )}

      {/* 画像マーカーモーダル */}
      {editMode === "annotate" && editingImage && (
        <ImageAnnotation
          imageSrc={editingImage.dataUrl}
          onCancel={handleEditCancel}
          onSwitchMode={handleSwitchEditMode}
          currentMode="annotate"
        />
      )}
    </>
  );
}
