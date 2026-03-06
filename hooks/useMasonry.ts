"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ============================================================
// 型定義
// ============================================================

/**
 * Masonry レイアウトにおける各カードの位置情報
 * absolute positioning で使用される座標と寸法
 */
export type CardPosition = {
  /** カードの一意識別子（LocalNote.id に対応） */
  id: string;
  /** コンテナ左端からの水平位置（px） */
  x: number;
  /** コンテナ上端からの垂直位置（px） */
  y: number;
  /** カードの幅（px） */
  width: number;
  /** カードの高さ（px、実測値） */
  height: number;
};

/**
 * useMasonry フックの戻り値
 */
export type UseMasonryReturn = {
  /** 各カードの計算済み位置配列 */
  positions: CardPosition[];
  /** コンテナの計算済み総高さ（px） */
  totalHeight: number;
  /** 現在のカラム幅（px） */
  columnWidth: number;
  /** 現在のカラム数 */
  columnCount: number;
  /** 測定完了フラグ（true になったらカードを表示してよい） */
  measured: boolean;
  /**
   * 各カードに付与する測定用 ref コールバック
   * NoteCard の ref に渡して高さを測定する
   * @param id - カードの ID
   * @returns ref コールバック関数
   */
  measureRef: (id: string) => (el: HTMLDivElement | null) => void;
  /** 手動で再測定をトリガーする関数（画像読み込み完了時など） */
  remeasure: () => void;
};

// ============================================================
// 定数
// ============================================================

/** カード間のギャップ（px） */
const GAP = 16;

/**
 * レスポンシブブレークポイント設定
 * 現在の NoteGrid と同じ列数を維持:
 * - < 640px: 1列（モバイル）
 * - 640-1023px: 2列（タブレット）
 * - 1024-1279px: 3列（デスクトップ）
 * - >= 1280px: 4列（ワイド）
 */
const BREAKPOINTS = [
  { minWidth: 1280, columns: 4 },
  { minWidth: 1024, columns: 3 },
  { minWidth: 640, columns: 2 },
  { minWidth: 0, columns: 1 },
];

/**
 * コンテナ幅からカラム数を決定する
 * ブレークポイント設定に基づいて、現在の幅に適した列数を返す
 * @param containerWidth - コンテナの幅（px）
 * @returns カラム数
 */
function getColumnCount(containerWidth: number): number {
  for (const bp of BREAKPOINTS) {
    if (containerWidth >= bp.minWidth) {
      return bp.columns;
    }
  }
  return 1;
}

// ============================================================
// フック本体
// ============================================================

/**
 * useMasonry - カスタム Masonry レイアウトエンジン
 *
 * Google Keep と同じアプローチで Masonry レイアウトを実現する:
 * 1. 各カードの高さを DOM から実測
 * 2. 最短カラム優先アルゴリズムで配置位置を計算
 * 3. absolute positioning 用の座標を返す
 *
 * CSS columns ではなく JS で位置を計算するため、
 * @dnd-kit と組み合わせてドラッグ&ドロップが可能になる。
 *
 * @param itemIds - 表示順に並んだカード ID の配列
 * @param containerRef - Masonry コンテナの DOM 参照
 * @param gap - カード間のギャップ（px）。デフォルト 16
 * @returns Masonry レイアウトの位置情報と制御関数
 */
export function useMasonry(
  itemIds: string[],
  containerRef: React.RefObject<HTMLDivElement | null>,
  gap: number = GAP
): UseMasonryReturn {
  /** 各カードの計算済み位置 */
  const [positions, setPositions] = useState<CardPosition[]>([]);
  /** コンテナ全体の高さ */
  const [totalHeight, setTotalHeight] = useState(0);
  /** 現在のカラム幅 */
  const [columnWidth, setColumnWidth] = useState(0);
  /** 現在のカラム数 */
  const [columnCount, setColumnCount] = useState(1);
  /** 測定完了フラグ */
  const [measured, setMeasured] = useState(false);

  /**
   * 各カードの DOM 要素を保持する Map
   * measureRef で登録され、computeLayout で読み取られる
   */
  const elementMapRef = useRef<Map<string, HTMLDivElement>>(new Map());

  /**
   * レイアウトを再計算するカウンター
   * この値が変わるたびに useEffect が再実行される
   */
  const [layoutTrigger, setLayoutTrigger] = useState(0);

  /**
   * Masonry レイアウトの位置を計算する
   *
   * アルゴリズム（最短カラム優先）:
   * 1. 各カラムの現在の高さを 0 で初期化
   * 2. カードを順番に処理し、最も短いカラムに配置
   * 3. 配置したカラムの高さを更新
   * 4. 全カラムの最大高さがコンテナの総高さになる
   */
  const computeLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // コンテナ幅を取得し、カラム数とカラム幅を計算
    const containerWidth = container.offsetWidth;
    if (containerWidth === 0) return;

    const cols = getColumnCount(containerWidth);
    // カラム幅 = (コンテナ幅 - ギャップ合計) / カラム数
    const colWidth = (containerWidth - (cols - 1) * gap) / cols;

    setColumnCount(cols);
    setColumnWidth(colWidth);

    // 各カラムの累積高さを追跡する配列
    const columnHeights = new Array(cols).fill(0);

    const newPositions: CardPosition[] = [];

    for (const id of itemIds) {
      const el = elementMapRef.current.get(id);
      // DOM 要素がまだ登録されていないカードはスキップ
      if (!el) continue;

      // カードの実際の高さを測定
      const height = el.offsetHeight;

      // 最短カラムのインデックスを見つける
      let shortestCol = 0;
      for (let i = 1; i < cols; i++) {
        if (columnHeights[i] < columnHeights[shortestCol]) {
          shortestCol = i;
        }
      }

      // 配置座標を計算
      const x = shortestCol * (colWidth + gap);
      const y = columnHeights[shortestCol];

      newPositions.push({ id, x, y, width: colWidth, height });

      // カラムの高さを更新（カード高さ + ギャップ）
      columnHeights[shortestCol] += height + gap;
    }

    setPositions(newPositions);
    // コンテナの総高さ = 最も高いカラムの高さ - 末尾のギャップ
    const maxHeight = Math.max(...columnHeights, 0);
    setTotalHeight(maxHeight > 0 ? maxHeight - gap : 0);
    setMeasured(true);
  }, [itemIds, containerRef, gap]);

  /**
   * 各カードに付与する測定用 ref コールバック
   *
   * NoteCard の ref に渡すことで、DOM 要素が描画されたタイミングで
   * elementMap に登録される。全カードが登録されるとレイアウト計算が可能になる。
   *
   * 注意: ここでは setLayoutTrigger を呼ばない。
   * measureRef(id) は毎レンダリングで新しいクロージャを返すため、
   * React が ref を再実行して null → el の順で呼ばれる。
   * この中で setState を呼ぶと無限ループ（React error #185）になるため、
   * 再測定のトリガーは別の useEffect（itemIds 変化検知）で行う。
   *
   * @param id - カードの ID
   * @returns DOM 要素を受け取る ref コールバック
   */
  const measureRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) {
        elementMapRef.current.set(id, el);
      } else {
        elementMapRef.current.delete(id);
      }
    },
    []
  );

  /**
   * 手動で再測定をトリガーする
   * 画像の遅延読み込みが完了した時などに呼び出す
   */
  const remeasure = useCallback(() => {
    setLayoutTrigger((prev) => prev + 1);
  }, []);

  /**
   * カード数の変化を検知して再測定をトリガーする
   *
   * ペーストで新メモが追加された場合やメモ削除時に、itemIds.length が変わる。
   * NoteGrid 側で未測定カードの測定用不可視カードがレンダリングされるのを
   * 待ってから（50ms 遅延）layoutTrigger をインクリメントして computeLayout を再実行。
   * これにより新メモの DOM 要素が elementMapRef に登録済みの状態でレイアウト計算される。
   */
  const prevItemCountRef = useRef(0);

  useEffect(() => {
    if (prevItemCountRef.current !== itemIds.length) {
      prevItemCountRef.current = itemIds.length;
      // 測定用カードの DOM がレンダリングされるのを待ってから再計算
      const timerId = setTimeout(() => {
        setLayoutTrigger((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timerId);
    }
  }, [itemIds]);

  /**
   * レイアウト計算の実行
   * itemIds の変化、layoutTrigger のインクリメント、computeLayout の更新で再実行
   */
  useEffect(() => {
    // requestAnimationFrame で次のフレームでレイアウト計算を実行
    // これにより DOM の描画が完了してから高さを測定できる
    const rafId = requestAnimationFrame(() => {
      computeLayout();
    });
    return () => cancelAnimationFrame(rafId);
  }, [computeLayout, layoutTrigger]);

  /**
   * ResizeObserver でコンテナ幅の変化を監視
   * ウィンドウリサイズ時にカラム数を再計算してレイアウトを更新
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      computeLayout();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef, computeLayout]);

  return {
    positions,
    totalHeight,
    columnWidth,
    columnCount,
    measured,
    measureRef,
    remeasure,
  };
}
