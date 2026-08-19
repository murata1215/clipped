/**
 * メモデータサービス hook
 *
 * ログイン状態に応じてデータソースを自動切り替えする抽象層。
 * - ログイン済み: /api/notes（PostgreSQL）
 * - 未ログイン: localStorage
 *
 * API レスポンスの images[].url を LocalImage.dataUrl にマッピングすることで、
 * 既存の NoteCard, NoteModal, ImageAnnotation 等のコンポーネントを変更せずに
 * 画像表示が動作する（<img src=...> は base64 DataURL でも相対 URL でも対応）。
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { LocalNote, LocalImage, CreateNoteInput, UpdateNoteInput } from "@/lib/localStorage";
import {
  getNotes as getLocalNotes,
  createNote as createLocalNote,
  updateNote as updateLocalNote,
  deleteNote as deleteLocalNote,
  searchNotes as searchLocalNotes,
  reorderNotes as reorderLocalNotes,
  clearNotes as clearLocalNotes,
} from "@/lib/localStorage";
import {
  fetchNotes,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
  uploadImageApi,
  deleteImageApi,
  reorderNotesApi,
  type ApiNote,
  type ApiImage,
} from "@/lib/noteApiClient";

// ============================================================
// 型定義
// ============================================================

/**
 * useNoteService() hook の返り値型
 */
export type NoteService = {
  /** メモ一覧 */
  notes: LocalNote[];
  /** ローディング中かどうか */
  loading: boolean;
  /** サーバーモード（ログイン済み）かどうか */
  isServerMode: boolean;
  /** メモ一覧を再読み込み */
  reloadNotes: (search?: string) => Promise<void>;
  /** メモを新規作成 */
  createNote: (input: CreateNoteInput) => Promise<LocalNote>;
  /** メモを更新 */
  updateNote: (id: string, input: UpdateNoteInput) => Promise<LocalNote | null>;
  /** メモを削除 */
  deleteNote: (id: string) => Promise<boolean>;
  /** メモの並び順を更新 */
  reorderNotes: (orderedIds: string[]) => Promise<void>;
  /** 画像をアップロード（サーバーモードのみ） */
  uploadImage: (noteId: string, file: File | Blob) => Promise<LocalImage>;
  /** 画像を削除（サーバーモードのみ） */
  deleteImage: (noteId: string, imageId: string) => Promise<void>;
  /** 画像を差し替え（マーカー/切り抜き後のアップロード + 旧画像削除） */
  replaceImage: (noteId: string, oldImageId: string, newDataUrl: string) => Promise<LocalImage>;
};

// ============================================================
// ヘルパー: API → LocalNote 変換
// ============================================================

/**
 * API レスポンスの画像を LocalImage に変換する
 * url を dataUrl にマッピングすることで、既存コンポーネントが変更なしで動作する
 */
function apiImageToLocal(img: ApiImage): LocalImage {
  return {
    id: img.id,
    dataUrl: img.url,
    mimeType: img.mimeType,
    width: img.width ?? undefined,
    height: img.height ?? undefined,
  };
}

/**
 * API レスポンスのメモを LocalNote に変換する
 */
function apiNoteToLocal(apiNote: ApiNote): LocalNote {
  return {
    id: apiNote.id,
    title: apiNote.title,
    body: apiNote.body,
    color: apiNote.color,
    pinned: apiNote.pinned,
    images: apiNote.images.map(apiImageToLocal),
    tags: apiNote.tags,
    order: apiNote.order,
    createdAt: apiNote.createdAt,
    updatedAt: apiNote.updatedAt,
  };
}

/**
 * base64 DataURL を Blob に変換する
 * Canvas のマーカー/切り抜き結果をサーバーにアップロードするために使用
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

// ============================================================
// メインの hook
// ============================================================

/**
 * メモデータサービス hook
 *
 * セッション状態に応じて localStorage / API を自動切り替え。
 * API レスポンスは LocalNote 型に変換して返すため、
 * 呼び出し側はデータソースを意識する必要がない。
 */
export function useNoteService(): NoteService {
  const { data: session, status } = useSession();
  const isServerMode = status === "authenticated" && !!session?.user?.id;

  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [loading, setLoading] = useState(false);

  /** 楽観ロック用の version マップ（noteId → version） */
  const versionMapRef = useRef<Map<string, number>>(new Map());

  /** マイグレーション実行済みフラグ（同一セッション内の二重実行防止） */
  const migrationDoneRef = useRef(false);

  /**
   * ログイン時に localStorage のメモをサーバーへ自動マイグレーションする
   *
   * SyncButton 廃止に伴い、未ログイン時に作成したメモを
   * ログイン後に自動的にサーバーへ移行する。
   * 全件成功後に localStorage をクリアし、二重移行を防止する。
   */
  useEffect(() => {
    if (!isServerMode || migrationDoneRef.current) return;
    migrationDoneRef.current = true;

    const localNotes = getLocalNotes();
    if (localNotes.length === 0) return;

    (async () => {
      console.log(`[Migration] localStorage → サーバー: ${localNotes.length} 件のメモを移行開始`);
      let successCount = 0;

      for (const note of localNotes) {
        try {
          // メモ本体を作成
          const apiNote = await createNoteApi({
            title: note.title,
            body: note.body,
            color: note.color,
            pinned: note.pinned,
            tags: note.tags,
          });

          // base64 画像があればアップロード
          for (const img of note.images) {
            if (img.dataUrl && img.dataUrl.startsWith("data:")) {
              try {
                const blob = await dataUrlToBlob(img.dataUrl);
                const file = new File([blob], `${img.id}.jpg`, { type: blob.type || "image/jpeg" });
                await uploadImageApi(apiNote.id, file);
              } catch (imgErr) {
                console.warn(`[Migration] 画像アップロード失敗（続行）: noteId=${apiNote.id}`, imgErr);
              }
            }
          }

          successCount++;
        } catch (err) {
          console.error(`[Migration] メモ移行失敗: "${note.title}"`, err);
        }
      }

      // 全件成功した場合のみ localStorage をクリア
      if (successCount === localNotes.length) {
        clearLocalNotes();
        console.log(`[Migration] 完了: ${successCount} 件を移行、localStorage をクリア`);
      } else {
        console.warn(`[Migration] 部分成功: ${successCount}/${localNotes.length} 件。localStorage は保持`);
      }

      // サーバーから最新一覧を再取得
      try {
        const apiNotes = await fetchNotes();
        for (const n of apiNotes) {
          versionMapRef.current.set(n.id, n.version);
        }
        setNotes(apiNotes.map(apiNoteToLocal));
      } catch {
        // リロードは後続の reloadNotes で行われるため無視
      }
    })();
  }, [isServerMode]);

  /**
   * version マップを API レスポンスから更新する
   */
  const updateVersionMap = useCallback((apiNotes: ApiNote[]) => {
    for (const n of apiNotes) {
      versionMapRef.current.set(n.id, n.version);
    }
  }, []);

  /**
   * メモ一覧を再読み込みする
   */
  const reloadNotes = useCallback(async (search?: string) => {
    if (isServerMode) {
      setLoading(true);
      try {
        const apiNotes = await fetchNotes(search);
        updateVersionMap(apiNotes);
        setNotes(apiNotes.map(apiNoteToLocal));
      } catch (err) {
        console.error("メモ一覧の取得に失敗:", err);
      } finally {
        setLoading(false);
      }
    } else {
      if (search?.trim()) {
        setNotes(searchLocalNotes(search));
      } else {
        setNotes(getLocalNotes());
      }
    }
  }, [isServerMode, updateVersionMap]);

  /**
   * メモを新規作成する
   */
  const createNote = useCallback(async (input: CreateNoteInput): Promise<LocalNote> => {
    if (isServerMode) {
      const apiNote = await createNoteApi({
        title: input.title,
        body: input.body,
        color: input.color,
        pinned: input.pinned,
        order: input.order,
        tags: input.tags,
      });
      versionMapRef.current.set(apiNote.id, apiNote.version);
      const localNote = apiNoteToLocal(apiNote);
      setNotes((prev) => [localNote, ...prev]);
      return localNote;
    } else {
      const note = createLocalNote(input);
      setNotes(getLocalNotes());
      return note;
    }
  }, [isServerMode]);

  /**
   * メモを更新する
   */
  const updateNote = useCallback(async (id: string, input: UpdateNoteInput): Promise<LocalNote | null> => {
    if (isServerMode) {
      try {
        const version = versionMapRef.current.get(id);
        const apiNote = await updateNoteApi(id, {
          title: input.title,
          body: input.body,
          color: input.color,
          pinned: input.pinned,
          order: input.order,
          tags: input.tags,
          version,
        });
        versionMapRef.current.set(apiNote.id, apiNote.version);
        const localNote = apiNoteToLocal(apiNote);
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? localNote : n))
        );
        return localNote;
      } catch (err) {
        console.error("メモの更新に失敗:", err);
        return null;
      }
    } else {
      const result = updateLocalNote(id, input);
      setNotes(getLocalNotes());
      return result;
    }
  }, [isServerMode]);

  /**
   * メモを削除する
   */
  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    if (isServerMode) {
      try {
        await deleteNoteApi(id);
        versionMapRef.current.delete(id);
        setNotes((prev) => prev.filter((n) => n.id !== id));
        return true;
      } catch (err) {
        console.error("メモの削除に失敗:", err);
        return false;
      }
    } else {
      const result = deleteLocalNote(id);
      setNotes(getLocalNotes());
      return result;
    }
  }, [isServerMode]);

  /**
   * メモの並び順を更新する
   */
  const reorderNotes = useCallback(async (orderedIds: string[]) => {
    if (isServerMode) {
      // 楽観的更新: 先にローカル state を更新
      setNotes((prev) => {
        const noteMap = new Map(prev.map((n) => [n.id, n]));
        return orderedIds
          .map((id) => noteMap.get(id))
          .filter((n): n is LocalNote => !!n);
      });

      try {
        await reorderNotesApi(orderedIds, versionMapRef.current);
        // version が更新されるので再取得
        const apiNotes = await fetchNotes();
        updateVersionMap(apiNotes);
        setNotes(apiNotes.map(apiNoteToLocal));
      } catch (err) {
        console.error("並び替えに失敗:", err);
      }
    } else {
      reorderLocalNotes(orderedIds);
      setNotes(getLocalNotes());
    }
  }, [isServerMode, updateVersionMap]);

  /**
   * 画像をアップロードする
   */
  const uploadImage = useCallback(async (noteId: string, file: File | Blob): Promise<LocalImage> => {
    const apiImages = await uploadImageApi(noteId, file);
    const uploaded = apiImages[0];
    const localImage = apiImageToLocal(uploaded);

    // notes state を更新
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, images: [...n.images, localImage] }
          : n
      )
    );

    return localImage;
  }, []);

  /**
   * 画像を削除する
   */
  const deleteImage = useCallback(async (noteId: string, imageId: string): Promise<void> => {
    await deleteImageApi(noteId, imageId);

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, images: n.images.filter((img) => img.id !== imageId) }
          : n
      )
    );
  }, []);

  /**
   * 画像を差し替える（マーカー/切り抜き後）
   *
   * 1. base64 DataURL を Blob に変換
   * 2. 新画像をアップロード
   * 3. 旧画像を削除
   * 4. ローカル state を更新
   */
  const replaceImage = useCallback(async (
    noteId: string,
    oldImageId: string,
    newDataUrl: string
  ): Promise<LocalImage> => {
    const blob = await dataUrlToBlob(newDataUrl);
    const file = new File([blob], "edited.png", { type: blob.type || "image/png" });

    const apiImages = await uploadImageApi(noteId, file);
    const newImage = apiImageToLocal(apiImages[0]);

    // 旧画像を削除（失敗しても続行）
    try {
      await deleteImageApi(noteId, oldImageId);
    } catch {
      console.warn("旧画像の削除に失敗（続行）:", oldImageId);
    }

    // ローカル state を更新（旧画像を新画像で置換）
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              images: n.images.map((img) =>
                img.id === oldImageId ? newImage : img
              ),
            }
          : n
      )
    );

    return newImage;
  }, []);

  return {
    notes,
    loading,
    isServerMode,
    reloadNotes,
    createNote,
    updateNote,
    deleteNote,
    reorderNotes,
    uploadImage,
    deleteImage,
    replaceImage,
  };
}
