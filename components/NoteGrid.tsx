"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { LocalNote } from "@/lib/localStorage";
import { useMasonry, type CardPosition } from "@/hooks/useMasonry";
import NoteCard from "./NoteCard";
import DragOverlayCard from "./DragOverlayCard";

// ============================================================
// 型定義
// ============================================================

/**
 * NoteGrid コンポーネントのプロパティ
 */
type NoteGridProps = {
  /** 表示するメモの配列（ソート済み） */
  notes: LocalNote[];
  /** カードクリック時のコールバック */
  onNoteClick: (note: LocalNote) => void;
  /** ピン留めトグル時のコールバック */
  onTogglePin: (id: string) => void;
  /** 削除時のコールバック */
  onDelete: (id: string) => void;
  /** 並び順変更時のコールバック（新しい ID 順を渡す） */
  onReorder: (orderedIds: string[]) => void;
};

// ============================================================
// DraggableCard サブコンポーネント
// ============================================================

/**
 * DraggableCard のプロパティ
 */
type DraggableCardProps = {
  note: LocalNote;
  position: CardPosition;
  onClick: (note: LocalNote) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  /** Masonry の高さ測定用 ref を設定するコールバック */
  measureRef: (el: HTMLDivElement | null) => void;
  /** ドラッグ中の ID（このカードがドラッグ中かの判定に使用） */
  activeId: string | null;
  /** 画像読み込み完了コールバック */
  onImageLoad: () => void;
  /** ドラッグ中かどうか（アニメーション無効化用） */
  isDraggingAny: boolean;
};

/**
 * DraggableCard コンポーネント
 *
 * @dnd-kit の useDraggable フックを使用して、
 * NoteCard にドラッグ機能を付与するラッパー。
 *
 * Masonry レイアウトの absolute positioning スタイルと
 * ドラッグハンドルの listeners/attributes を NoteCard に渡す。
 */
function DraggableCard({
  note,
  position,
  onClick,
  onTogglePin,
  onDelete,
  measureRef,
  activeId,
  onImageLoad,
  isDraggingAny,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: note.id,
  });

  /**
   * ref の統合: useDraggable の ref と Masonry 測定用 ref を両方設定する
   */
  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      setNodeRef(el);
      measureRef(el);
    },
    [setNodeRef, measureRef]
  );

  return (
    <NoteCard
      ref={combinedRef}
      note={note}
      onClick={onClick}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      isDragging={isDragging || activeId === note.id}
      dragListeners={listeners}
      dragAttributes={attributes}
      onImageLoad={onImageLoad}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: position.width,
        // ドラッグ中はアニメーションを無効化（位置がリアルタイムで変わるため）
        transition: isDraggingAny ? "none" : "all 300ms ease",
      }}
    />
  );
}

// ============================================================
// NoteGrid メインコンポーネント
// ============================================================

/**
 * NoteGrid コンポーネント
 *
 * メモカードを Masonry 風グリッドで表示し、ドラッグ&ドロップで並べ替え可能にする。
 *
 * Google Keep と同じアプローチ:
 * - JS でカード高さを測定し、absolute positioning で配置（Masonry）
 * - @dnd-kit でドラッグ&ドロップ
 * - PointerSensor の distance:8 でクリックとドラッグを自動判別
 *
 * レスポンシブ対応:
 * - モバイル: 1列
 * - タブレット: 2列
 * - デスクトップ: 3列
 * - ワイド: 4列
 */
export default function NoteGrid({
  notes,
  onNoteClick,
  onTogglePin,
  onDelete,
  onReorder,
}: NoteGridProps) {
  /** Masonry コンテナの DOM 参照 */
  const containerRef = useRef<HTMLDivElement>(null);

  /** 現在ドラッグ中のメモ ID */
  const [activeId, setActiveId] = useState<string | null>(null);

  /** メモ ID の配列（表示順、useMasonry に渡す） */
  const itemIds = useMemo(() => notes.map((n) => n.id), [notes]);

  /** メモの ID → データ のマップ（高速検索用） */
  const notesMap = useMemo(() => {
    const map = new Map<string, LocalNote>();
    notes.forEach((n) => map.set(n.id, n));
    return map;
  }, [notes]);

  /** Masonry レイアウトエンジン */
  const { positions, totalHeight, columnWidth, measured, measureRef, remeasure } =
    useMasonry(itemIds, containerRef);

  // ================================================================
  // @dnd-kit センサー設定
  // ================================================================

  /**
   * PointerSensor: distance: 8 により、8px 以上ドラッグしないとドラッグ開始しない
   * これにより通常のクリック（onClick でモーダルを開く）とドラッグを自動判別
   */
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  /** KeyboardSensor: アクセシビリティ対応（Tab + Space/Enter でドラッグ操作） */
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, keyboardSensor);

  // ================================================================
  // ドラッグイベントハンドラ
  // ================================================================

  /**
   * ドラッグ開始時のハンドラ
   * ドラッグ中のカード ID を記録して DragOverlay に渡す
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  /**
   * ドラッグ終了時のハンドラ
   *
   * ドロップ位置に基づいて、カードの並び順を変更する:
   * 1. ドロップされた座標からドロップ先のインデックスを計算
   * 2. ドラッグ元の配列からカードを除去
   * 3. ドロップ先のインデックスにカードを挿入
   * 4. onReorder で新しい並び順を親コンポーネントに通知
   *
   * ピン留めグループとそれ以外のグループ間のドラッグは無効
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      setActiveId(null);

      if (!delta) return;

      const draggedId = active.id as string;
      const draggedNote = notesMap.get(draggedId);
      if (!draggedNote) return;

      // ドラッグされたカードの元の位置を取得
      const draggedPos = positions.find((p) => p.id === draggedId);
      if (!draggedPos) return;

      // ドロップ先の座標 = 元の位置 + delta（移動量）
      const dropX = draggedPos.x + delta.x;
      const dropY = draggedPos.y + delta.y;
      const dropCenterX = dropX + draggedPos.width / 2;
      const dropCenterY = dropY + draggedPos.height / 2;

      // ピン留めグループ内のメモ ID と、それ以外のメモ ID を分離
      const pinnedIds = notes.filter((n) => n.pinned).map((n) => n.id);
      const unpinnedIds = notes.filter((n) => !n.pinned).map((n) => n.id);

      // ドラッグ元がどちらのグループに属するか判定
      const isPinned = draggedNote.pinned;
      const groupIds = isPinned ? pinnedIds : unpinnedIds;
      const groupPositions = positions.filter((p) => groupIds.includes(p.id));

      // ドラッグされたカードをグループから除外
      const remainingPositions = groupPositions.filter((p) => p.id !== draggedId);
      const remainingIds = groupIds.filter((id) => id !== draggedId);

      // ドロップ位置に最も近いカードを見つけて挿入位置を決定
      let insertIndex = remainingIds.length; // デフォルトは末尾

      if (remainingPositions.length > 0) {
        // 各カードとの距離を計算し、最も近いカードを探す
        let closestIdx = 0;
        let closestDist = Infinity;

        for (let i = 0; i < remainingPositions.length; i++) {
          const pos = remainingPositions[i];
          const centerX = pos.x + pos.width / 2;
          const centerY = pos.y + pos.height / 2;
          const dist = Math.sqrt(
            Math.pow(dropCenterX - centerX, 2) + Math.pow(dropCenterY - centerY, 2)
          );
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }

        // ドロップ位置が最も近いカードの上か下かで挿入位置を決定
        const closestPos = remainingPositions[closestIdx];
        const closestCenterY = closestPos.y + closestPos.height / 2;

        if (dropCenterY < closestCenterY) {
          // 最も近いカードの上にドロップ → そのカードの前に挿入
          insertIndex = closestIdx;
        } else {
          // 最も近いカードの下にドロップ → そのカードの後に挿入
          insertIndex = closestIdx + 1;
        }
      }

      // 新しい並び順を構築
      const newGroupIds = [...remainingIds];
      newGroupIds.splice(insertIndex, 0, draggedId);

      // ピン留めと非ピン留めのグループを結合して最終的な並び順にする
      const newOrderedIds = isPinned
        ? [...newGroupIds, ...unpinnedIds]
        : [...pinnedIds, ...newGroupIds];

      onReorder(newOrderedIds);
    },
    [notes, notesMap, positions, onReorder]
  );

  // ================================================================
  // レンダリング
  // ================================================================

  /* メモが0件の場合の空状態表示 */
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium">メモがありません</p>
        <p className="text-sm mt-1">
          Ctrl+V で画像やテキストを貼り付けるか、上の入力欄からメモを作成できます
        </p>
      </div>
    );
  }

  /** 現在ドラッグ中のメモデータ（DragOverlay 表示用） */
  const activeNote = activeId ? notesMap.get(activeId) ?? null : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Masonry コンテナ: relative + 計算済みの総高さ */}
      <div
        ref={containerRef}
        className="px-4 py-4"
        style={{
          position: "relative",
          height: measured ? totalHeight : "auto",
          // 測定完了前はカードを不可視にする（レイアウトシフト防止）
          minHeight: measured ? undefined : 200,
        }}
      >
        {positions.map((pos) => {
          const note = notesMap.get(pos.id);
          if (!note) return null;

          return (
            <DraggableCard
              key={note.id}
              note={note}
              position={pos}
              onClick={onNoteClick}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
              measureRef={measureRef(note.id)}
              activeId={activeId}
              onImageLoad={remeasure}
              isDraggingAny={activeId !== null}
            />
          );
        })}

        {/*
          未測定カードの測定用レンダリング:
          - 初回（measured=false）: 全カードを不可視で配置して高さを測定
          - 以降（measured=true）: positions に含まれていない新規カードのみ測定対象

          ペーストで新メモが追加された場合、positions には新メモのエントリがないため
          ここで測定用の不可視カードがレンダリングされ、measureRef 経由で
          elementMapRef に DOM 要素が登録される。useMasonry 側で itemIds.length の
          変化を検知して 50ms 後に computeLayout が再実行され、新メモが表示される。
        */}
        {(() => {
          /** positions に含まれている ID のセット（高速検索用） */
          const positionedIds = new Set(positions.map((p) => p.id));
          /** 未測定のカード: 初回は全カード、以降は positions にないカードのみ */
          const unmeasuredNotes = measured
            ? notes.filter((n) => !positionedIds.has(n.id))
            : notes;
          return unmeasuredNotes.map((note) => (
            <div
              key={`measure-${note.id}`}
              ref={measureRef(note.id)}
              style={{
                position: "absolute",
                visibility: "hidden",
                width: columnWidth || "100%",
                maxWidth: 400,
              }}
            >
              <NoteCard
                note={note}
                onClick={() => {}}
                onTogglePin={() => {}}
                onDelete={() => {}}
              />
            </div>
          ));
        })()}
      </div>

      {/* ドラッグ中にカーソルに追従する見た目のカードクローン */}
      <DragOverlay dropAnimation={null}>
        {activeNote && (
          <DragOverlayCard note={activeNote} width={columnWidth} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
