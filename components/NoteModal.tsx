"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { updateNote, type LocalNote, type LocalImage } from "@/lib/localStorage";
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
export default function NoteModal({ note, onClose }: NoteModalProps) {
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
   * 画像付きメモの場合はマーカーモードで開始し、ペタペタ貼り付け後に
   * カードクリックで直接画像編集に入れるようにする。
   * 画像なしメモの場合は従来通りメモ編集画面（null）で開始。
   */
  const hasImages = note.images.length > 0;
  const [editMode, setEditMode] = useState<ImageEditMode>(
    hasImages ? "annotate" : null
  );
  /** 編集対象の画像 ID（画像ありメモは1枚目をデフォルト選択） */
  const [editingImageId, setEditingImageId] = useState<string | null>(
    hasImages ? note.images[0].id : null
  );
  /** 保存エラーメッセージ（容量超過時に表示） */
  const [saveError, setSaveError] = useState<string | null>(null);

  // ================================================================
  // 保存エラー通知のリスナー
  // ================================================================

  /**
   * localStorage 容量超過時のカスタムイベントをリッスンして、
   * 画面上にエラーメッセージを表示する。
   * 5秒後に自動的にメッセージを消す。
   */
  useEffect(() => {
    const handleSaveError = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSaveError(detail?.message || "保存に失敗しました");
      // 5秒後にエラーメッセージを消す
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
   * debounce なしの即時保存。タイマーからの呼び出しとクローズ時の呼び出しで使用。
   */
  const saveNow = useCallback(() => {
    updateNote(note.id, { title, body, color, tags, images });
  }, [note.id, title, body, color, tags, images]);

  /**
   * 変更があるたびに debounce タイマーをリセットして自動保存をスケジュールする。
   * 1500ms 間操作がなければ保存が実行される。
   */
  useEffect(() => {
    // 前回のタイマーをクリア
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    // 1500ms 後に保存
    saveTimerRef.current = setTimeout(() => {
      saveNow();
    }, 1500);

    // クリーンアップ: コンポーネントアンマウント時にタイマーをクリア
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [title, body, color, tags, images, saveNow]);

  // ================================================================
  // キーボードイベント
  // ================================================================

  /**
   * Esc キーでモーダルを閉じる
   * 画像編集モード中でも一覧に直帰する（保存して閉じる）。
   */
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

  /**
   * モーダル内での Ctrl+V で画像を追加する
   * テキスト入力欄へのペーストは通常通り動作する（画像ペースト時のみ介入）
   */
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((i) => i.type.startsWith("image/"));

      if (imageItem) {
        e.preventDefault();
        const blob = imageItem.getAsFile();
        if (!blob) return;

        try {
          const localImage = await resizeToDataUrl(blob, 800);
          setImages((prev) => [...prev, localImage]);
        } catch (err) {
          console.error("モーダル内画像ペーストに失敗:", err);
        }
      }
      // テキストペーストは textarea のデフォルト動作に任せる
    };

    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener("paste", handlePaste);
      return () => modal.removeEventListener("paste", handlePaste);
    }
  }, []);

  // ================================================================
  // ハンドラ
  // ================================================================

  /**
   * モーダルを閉じる
   * 閉じる前に未保存の変更を即座に保存する。
   */
  const handleClose = () => {
    // 保留中のタイマーをクリアして即座に保存
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    updateNote(note.id, { title, body, color, tags, images });
    onClose();
  };

  /**
   * 画像を削除する
   * @param imageId - 削除する画像の ID
   */
  const handleRemoveImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  /**
   * 画像編集モードを開始する
   * @param imageId - 編集対象の画像 ID
   * @param mode - 編集モード（"crop" or "annotate"）
   */
  const handleStartImageEdit = (imageId: string, mode: "crop" | "annotate") => {
    setEditingImageId(imageId);
    setEditMode(mode);
  };

  /**
   * 画像切り抜き完了ハンドラ
   * 切り抜き後の DataURL で画像データを更新する
   * @param croppedDataUrl - 切り抜き後の base64 DataURL
   */
  const handleCropComplete = useCallback(
    (croppedDataUrl: string) => {
      if (!editingImageId) return;
      setImages((prev) =>
        prev.map((img) =>
          img.id === editingImageId
            ? { ...img, dataUrl: croppedDataUrl }
            : img
        )
      );
      setEditMode(null);
      setEditingImageId(null);
    },
    [editingImageId]
  );

  /**
   * 画像編集からの「戻る」ハンドラ
   *
   * マーカー画面の「戻る」ボタンや黒背景クリック時に呼ばれる。
   * ImageAnnotation から描画後の DataURL が引数として渡される。
   *
   * 【重要】React の setImages は非同期バッチ処理のため、
   * onSave(dataUrl) → setImages → onCancel() → updateNote(images)
   * の順では images が古いクロージャ値になり描画が保存されない。
   * そのため DataURL を引数で直接受け取り、ローカル変数 finalImages を
   * 同期的に構築してから updateNote に渡す方式にしている。
   *
   * @param annotatedDataUrl - マーカー描画後の Canvas DataURL（省略時は画像更新なし）
   */
  const handleEditCancel = useCallback((annotatedDataUrl?: string) => {
    // 保留中の自動保存タイマーをクリアして即座に保存
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // 描画後 DataURL が渡された場合、images を同期的に更新
    let finalImages = images;
    if (annotatedDataUrl && editingImageId) {
      finalImages = images.map((img) =>
        img.id === editingImageId
          ? { ...img, dataUrl: annotatedDataUrl }
          : img
      );
      // React state も更新（画面表示の整合性のため）
      setImages(finalImages);
    }

    // 同期的に構築した finalImages で localStorage に保存
    updateNote(note.id, { title, body, color, tags, images: finalImages });
    onClose();
  }, [note.id, title, body, color, tags, images, editingImageId, onClose]);

  /**
   * 画像編集モード切り替えハンドラ
   *
   * タブ UI からの呼び出しで、マーカー ⇔ 切り抜き ⇔ メモ を切り替える。
   * "memo" が指定された場合は画像編集を終了してメモ編集画面に戻る。
   * editingImageId は維持したまま editMode のみ変更する。
   *
   * ImageAnnotation からの呼び出し時は annotatedDataUrl が渡されるため、
   * タブ切り替え前に描画データを images に同期反映する。
   *
   * @param mode - 切り替え先のモード
   * @param annotatedDataUrl - マーカー描画後の Canvas DataURL（マーカータブからの切り替え時）
   */
  const handleSwitchEditMode = useCallback((mode: "crop" | "annotate" | "memo", annotatedDataUrl?: string) => {
    // 描画後 DataURL が渡された場合、images を同期的に更新
    if (annotatedDataUrl && editingImageId) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === editingImageId
            ? { ...img, dataUrl: annotatedDataUrl }
            : img
        )
      );
    }

    if (mode === "memo") {
      // メモ編集画面に切り替え（画像編集を終了）
      setEditMode(null);
      setEditingImageId(null);
    } else {
      setEditMode(mode);
    }
  }, [editingImageId]);

  /** モーダルの背景色クラス */
  const bgColor = colorBgMap[color] || colorBgMap.default;

  /** 現在編集中の画像データ（切り抜き / マーカー モーダル表示用） */
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
          {/* 保存エラー通知（localStorage 容量超過時） */}
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

          {/* 画像サムネイル一覧（クリックで直接マーカー編集を開く） */}
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

                  {/* 画像削除ボタン（右上の×） */}
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

          {/* 編集エリア（スクロール対応） */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* タイトル入力欄 */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトル"
              className="w-full text-lg font-medium text-gray-900 placeholder-gray-400
                         outline-none bg-transparent mb-3"
            />

            {/* 本文入力欄（自動拡張） */}
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

          {/* フッター: カラーピッカー + 閉じるボタン */}
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

      {/* 画像切り抜きモーダル（z-60 で NoteModal の上に表示、タブ切り替え対応） */}
      {editMode === "crop" && editingImage && (
        <ImageCropModal
          imageSrc={editingImage.dataUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleEditCancel}
          onSwitchMode={handleSwitchEditMode}
          currentMode="crop"
        />
      )}

      {/* 画像マーカーモーダル（z-60 で NoteModal の上に表示、タブ切り替え対応） */}
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
