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
import {
  LocalNote,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  reorderNotes,
} from "@/lib/localStorage";
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
 * 未ログイン時は localStorage のデータを表示。
 * TODO: ログイン済み時はサーバー API からデータを取得（Phase 8）。
 */
export default function HomePage() {
  // ================================================================
  // ステート管理
  // ================================================================

  /** メモ一覧の状態管理 */
  const [notes, setNotes] = useState<LocalNote[]>([]);
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
    if (searchQuery.trim()) {
      setNotes(searchNotes(searchQuery));
    } else {
      setNotes(getNotes());
    }
  }, [searchQuery]);

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
   * NewNoteInput から呼ばれ、localStorage にメモを追加後に一覧を更新
   */
  const handleCreate = useCallback(
    (data: { title: string; body: string }) => {
      createNote({ title: data.title, body: data.body });
      reloadNotes();
    },
    [reloadNotes]
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
    (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (note) {
        updateNote(id, { pinned: !note.pinned });
        reloadNotes();
      }
    },
    [notes, reloadNotes]
  );

  /**
   * メモ削除ハンドラ
   * localStorage からメモを物理削除して一覧を更新
   */
  const handleDelete = useCallback(
    (id: string) => {
      deleteNote(id);
      reloadNotes();
    },
    [reloadNotes]
  );

  /**
   * ペーストで新規メモが作成された時のハンドラ
   * PasteHandler から呼ばれ、一覧を更新してモーダルを開く
   */
  const handleNotePasted = useCallback(
    (note: LocalNote) => {
      reloadNotes();
      setEditingNote(note);
    },
    [reloadNotes]
  );

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
   * ドラッグ&ドロップの結果を受けて、localStorage の order を更新し
   * メモ一覧を再読み込みする
   * @param orderedIds - 新しい並び順の ID 配列
   */
  const handleReorder = useCallback(
    (orderedIds: string[]) => {
      reorderNotes(orderedIds);
      reloadNotes();
    },
    [reloadNotes]
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
        />

        {/* ヘッダー（検索バー + ログインボタン） */}
        <Header onSearch={handleSearch} />

        {/* ログイン誘導バナー（メモ5件超で表示） */}
        <LoginNudge onShowToast={showToast} noteCount={notes.length} />

        {/* 新規メモ作成エリア */}
        <NewNoteInput onCreate={handleCreate} />

        {/* メモ一覧グリッド */}
        <main className="max-w-7xl mx-auto">
          <NoteGrid
            notes={notes}
            onNoteClick={handleNoteClick}
            onTogglePin={handleTogglePin}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        </main>

        {/* モーダルエディタ */}
        {editingNote && (
          <NoteModal
            note={editingNote}
            onClose={handleModalClose}
          />
        )}

        {/* サーバー同期ボタン（右下フローティング） */}
        <SyncButton onShowToast={showToast} />

        {/* トースト通知 */}
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ErrorBoundary>
  );
}
