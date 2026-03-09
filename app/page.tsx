"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import NewNoteInput from "@/components/NewNoteInput";
import PasteHandler from "@/components/PasteHandler";
import ErrorBoundary from "@/components/ErrorBoundary";
import SyncButton from "@/components/SyncButton";

/**
 * NoteGrid: @dnd-kit/core がブラウザ専用 DOM API に依存するため、
 * SSR を無効化してクライアント側でのみロードする
 */
const NoteGrid = dynamic(() => import("@/components/NoteGrid"), { ssr: false });

/**
 * NoteModal: ImageCropModal（Canvas ベース矩形選択）と ImageAnnotation（Canvas API）が
 * ブラウザ専用のため、SSR を無効化してクライアント側でのみロードする
 */
const NoteModal = dynamic(() => import("@/components/NoteModal"), { ssr: false });
import LoginNudge from "@/components/LoginNudge";
import Toast, { type ToastMessage } from "@/components/Toast";
import { useNoteService } from "@/lib/noteService";
import type { LocalNote } from "@/lib/localStorage";
import { createId } from "@paralleldrive/cuid2";

/**
 * メモ一覧ページ（メインページ）
 *
 * アプリケーションのトップページ。以下の機能を統合する:
 * - ヘッダー（検索バー + ログインボタン）
 * - 新規メモ作成エリア（NewNoteInput）
 * - メモ一覧グリッド（NoteGrid → NoteCard）
 * - グローバルペースト処理（PasteHandler）
 * - モーダルエディタ（NoteModal）
 * - ログイン誘導（LoginNudge）
 * - トースト通知（Toast）
 *
 * ログイン済みの場合は /api/notes（PostgreSQL）を使用し、
 * 未ログインの場合は localStorage を使用する。
 * useNoteService() hook がデータソースを自動切り替えする。
 */
export default function HomePage() {
  // ================================================================
  // データサービス（localStorage / API 自動切り替え）
  // ================================================================
  const svc = useNoteService();

  // ================================================================
  // ステート管理
  // ================================================================

  /** 現在の検索クエリ */
  const [searchQuery, setSearchQuery] = useState("");
  /** 編集中のメモ（モーダル表示用、null ならモーダルは閉じている） */
  const [editingNote, setEditingNote] = useState<LocalNote | null>(null);
  /** トースト通知の配列 */
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ================================================================
  // メモ一覧の読み込み
  // ================================================================

  /**
   * メモ一覧をリロードする
   * 検索クエリがある場合は検索結果を、なければ全件を取得
   */
  const reloadNotes = useCallback(() => {
    svc.reloadNotes(searchQuery.trim() || undefined);
  }, [svc.reloadNotes, searchQuery]);

  /**
   * 初回マウント時にメモを読み込む
   */
  useEffect(() => {
    reloadNotes();
  }, [reloadNotes]);

  // ================================================================
  // トースト通知
  // ================================================================

  /**
   * トーストを表示する
   * @param message - 表示するメッセージ
   */
  const showToast = useCallback((message: string) => {
    const toast: ToastMessage = {
      id: createId(),
      message,
      duration: 6000,
    };
    setToasts((prev) => [...prev, toast]);
  }, []);

  /**
   * トーストを閉じる
   * @param id - 閉じるトーストの ID
   */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ================================================================
  // イベントハンドラ
  // ================================================================

  /**
   * 検索クエリの変更ハンドラ
   * Header コンポーネントから呼ばれる
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  /**
   * 新規メモ作成ハンドラ
   * NewNoteInput から呼ばれ、メモを追加後に一覧を更新
   */
  const handleCreate = useCallback(
    async (data: { title: string; body: string }) => {
      await svc.createNote({ title: data.title, body: data.body });
    },
    [svc.createNote]
  );

  /**
   * カードクリックハンドラ
   * NoteCard がクリックされた時に呼ばれ、モーダルを開く
   */
  const handleNoteClick = useCallback((note: LocalNote) => {
    setEditingNote(note);
  }, []);

  /**
   * ピン留めトグルハンドラ
   * メモのピン留め状態を反転させて一覧を更新
   */
  const handleTogglePin = useCallback(
    async (id: string) => {
      const note = svc.notes.find((n) => n.id === id);
      if (note) {
        await svc.updateNote(id, { pinned: !note.pinned });
      }
    },
    [svc.notes, svc.updateNote]
  );

  /**
   * メモ削除ハンドラ
   */
  const handleDelete = useCallback(
    async (id: string) => {
      await svc.deleteNote(id);
    },
    [svc.deleteNote]
  );

  /**
   * ペーストで新規メモが作成された時のハンドラ
   * PasteHandler から呼ばれる。svc 内部で notes state は更新済み。
   */
  const handleNotePasted = useCallback(() => {
    // svc.createNote 内で setNotes 済みなので追加操作は不要
  }, []);

  /**
   * モーダルを閉じるハンドラ
   * 一覧を再読み込みして最新状態を反映
   */
  const handleModalClose = useCallback(() => {
    setEditingNote(null);
    reloadNotes();
  }, [reloadNotes]);

  /**
   * メモ並び替えハンドラ
   * ドラッグ&ドロップの結果を受けて order を更新する
   * @param orderedIds - 新しい並び順の ID 配列
   */
  const handleReorder = useCallback(
    async (orderedIds: string[]) => {
      await svc.reorderNotes(orderedIds);
    },
    [svc.reorderNotes]
  );

  // ================================================================
  // レンダリング
  // ================================================================

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--background)]">
        {/* グローバルペースト処理（UI なし） */}
        <PasteHandler
          isModalOpen={editingNote !== null}
          onNotePasted={handleNotePasted}
          onCreateNote={svc.createNote}
          onUploadImage={svc.isServerMode ? svc.uploadImage : undefined}
          isServerMode={svc.isServerMode}
        />

        {/* ヘッダー（検索バー + ログインボタン） */}
        <Header onSearch={handleSearch} />

        {/* ログイン誘導バナー（メモ5件超で表示） */}
        <LoginNudge onShowToast={showToast} noteCount={svc.notes.length} />

        {/* 新規メモ作成エリア */}
        <NewNoteInput onCreate={handleCreate} />

        {/* メモ一覧グリッド */}
        <main className="max-w-7xl mx-auto">
          {svc.loading ? (
            <div className="flex justify-center py-12">
              <div className="text-gray-400 text-sm">読み込み中...</div>
            </div>
          ) : (
            <NoteGrid
              notes={svc.notes}
              onNoteClick={handleNoteClick}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          )}
        </main>

        {/* モーダルエディタ */}
        {editingNote && (
          <NoteModal
            note={editingNote}
            onClose={handleModalClose}
            onSave={svc.updateNote}
            onUploadImage={svc.isServerMode ? svc.uploadImage : undefined}
            onDeleteImage={svc.isServerMode ? svc.deleteImage : undefined}
            onReplaceImage={svc.isServerMode ? svc.replaceImage : undefined}
            isServerMode={svc.isServerMode}
          />
        )}

        {/* サーバー同期ボタン（未ログイン時のみ表示） */}
        {!svc.isServerMode && <SyncButton onShowToast={showToast} />}

        {/* トースト通知 */}
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ErrorBoundary>
  );
}
