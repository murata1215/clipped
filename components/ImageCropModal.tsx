"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getCroppedImage, type CropArea } from "@/lib/cropUtils";

// ============================================================
// 型定義
// ============================================================

/**
 * ImageCropModal コンポーネントのプロパティ
 */
type ImageCropModalProps = {
  /** 切り抜き対象の画像 DataURL */
  imageSrc: string;
  /** 切り抜き確定時のコールバック（切り抜き後の DataURL を返す） */
  onCropComplete: (croppedDataUrl: string) => void;
  /**
   * モーダルキャンセル（「戻る」）時のコールバック
   * ImageAnnotation と型を揃えるため annotatedDataUrl をオプショナルで受け取るが、
   * 切り抜きモードからは引数なしで呼ばれる
   */
  onCancel: (annotatedDataUrl?: string) => void;
  /**
   * タブ切り替えコールバック（省略時はスタンドアロンモード、タブ非表示）
   * ImageAnnotation と型を揃えるため annotatedDataUrl をオプショナルで受け取る
   */
  onSwitchMode?: (mode: "crop" | "annotate" | "memo", annotatedDataUrl?: string) => void;
  /** 現在のモード（タブのアクティブ表示用） */
  currentMode?: "crop" | "annotate";
};

/**
 * ドラッグ操作のモード
 * - "create": 新しい矩形を作成中
 * - "move": 既存の矩形を移動中
 * - "resize": 既存の矩形をリサイズ中
 * - null: ドラッグしていない
 */
type DragMode = "create" | "move" | "resize" | null;

/**
 * リサイズハンドルの位置
 * 矩形の四隅と四辺の中点の 8 箇所
 */
type ResizeHandle =
  | "nw" | "ne" | "sw" | "se"   // 四隅
  | "n" | "s" | "e" | "w";       // 四辺中点

/**
 * マウス / タッチ座標のペア
 */
type Point = { x: number; y: number };

// ============================================================
// 定数
// ============================================================

/** リサイズハンドルのヒットエリアサイズ（px） */
const HANDLE_SIZE = 10;

/** 最小選択範囲サイズ（px）— これ未満のドラッグは無視 */
const MIN_RECT_SIZE = 10;

// ============================================================
// コンポーネント
// ============================================================

/**
 * ImageCropModal コンポーネント
 *
 * カスタム Canvas ベースの矩形選択切り抜きモーダル。
 * 全画面オーバーレイで表示し、以下の操作が可能:
 *
 * - 画像上でドラッグ: 矩形選択を作成
 * - 矩形内でドラッグ: 選択範囲を移動
 * - 四隅 / 四辺のハンドルをドラッグ: 選択範囲をリサイズ
 * - 選択範囲外をドラッグ: 新しい矩形を作成
 * - 「切り抜き」ボタン: 選択範囲で切り抜きを確定
 * - 「キャンセル」ボタン: 変更を破棄してモーダルを閉じる
 *
 * 選択範囲外は半透明の黒でオーバーレイし、選択範囲を視覚的に強調する。
 */
export default function ImageCropModal({
  imageSrc,
  onCropComplete,
  onCancel,
  onSwitchMode,
  currentMode,
}: ImageCropModalProps) {
  // ================================================================
  // Refs
  // ================================================================

  /** Canvas 要素への参照 */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** コンテナ div への参照（Canvas サイズ計算用） */
  const containerRef = useRef<HTMLDivElement>(null);
  /** 画像読み込み用の Image オブジェクト */
  const imageRef = useRef<HTMLImageElement | null>(null);

  // ================================================================
  // ステート管理
  // ================================================================

  /** 選択矩形（Canvas 座標系） */
  const [selection, setSelection] = useState<CropArea | null>(null);
  /** ドラッグモード */
  const [dragMode, setDragMode] = useState<DragMode>(null);
  /** ドラッグ開始時のマウス位置 */
  const [dragStart, setDragStart] = useState<Point | null>(null);
  /** ドラッグ開始時の選択矩形（移動 / リサイズ時の基準） */
  const [dragStartRect, setDragStartRect] = useState<CropArea | null>(null);
  /** リサイズ中のハンドル位置 */
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  /** 画像が読み込まれたかどうか */
  const [imageLoaded, setImageLoaded] = useState(false);
  /** 処理中フラグ（二重実行防止） */
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Canvas 上での画像の表示情報
   * - scale: 画像の表示倍率（Canvas 座標 → 元画像座標への変換に使用）
   * - offsetX/Y: 画像の左上が Canvas 座標のどこに位置するか
   * - displayW/H: Canvas 上での画像の表示サイズ
   */
  const displayInfoRef = useRef({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    displayW: 0,
    displayH: 0,
  });

  // ================================================================
  // 画像読み込みと Canvas 初期化
  // ================================================================

  /**
   * 画像を読み込み、Canvas のサイズを設定する。
   * 画像は Canvas の中央に収まるようにスケーリングして表示する。
   */
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error("ImageCropModal: 画像の読み込みに失敗しました");
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ================================================================
  // Canvas 描画
  // ================================================================

  /**
   * Canvas に画像と選択矩形を描画する。
   * imageLoaded または selection が変わるたびに再描画する。
   *
   * 描画順序:
   * 1. Canvas をクリア
   * 2. 画像をフィット表示（アスペクト比を維持）
   * 3. 選択矩形がある場合: 範囲外を半透明黒でオーバーレイ
   * 4. 選択矩形の点線枠を描画
   * 5. リサイズハンドル（8箇所）を描画
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imageRef.current;
    if (!canvas || !container || !img) return;

    // Canvas をコンテナサイズに合わせる
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 画像をアスペクト比を維持してフィット表示（中央配置）
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = canvas.width / canvas.height;

    let displayW: number, displayH: number, offsetX: number, offsetY: number;

    if (imgAspect > canvasAspect) {
      // 画像が横長: 横幅に合わせる
      displayW = canvas.width;
      displayH = canvas.width / imgAspect;
      offsetX = 0;
      offsetY = (canvas.height - displayH) / 2;
    } else {
      // 画像が縦長: 高さに合わせる
      displayH = canvas.height;
      displayW = canvas.height * imgAspect;
      offsetX = (canvas.width - displayW) / 2;
      offsetY = 0;
    }

    // 表示情報を保存（座標変換で使用）
    displayInfoRef.current = {
      scale: img.naturalWidth / displayW,
      offsetX,
      offsetY,
      displayW,
      displayH,
    };

    // 画像を描画
    ctx.drawImage(img, offsetX, offsetY, displayW, displayH);

    // 選択矩形がある場合の描画
    if (selection) {
      // === 範囲外を半透明黒でオーバーレイ ===
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";

      // 上部
      ctx.fillRect(offsetX, offsetY, displayW, selection.y - offsetY);
      // 下部
      const selBottom = selection.y + selection.height;
      ctx.fillRect(offsetX, selBottom, displayW, offsetY + displayH - selBottom);
      // 左側
      ctx.fillRect(offsetX, selection.y, selection.x - offsetX, selection.height);
      // 右側
      const selRight = selection.x + selection.width;
      ctx.fillRect(selRight, selection.y, offsetX + displayW - selRight, selection.height);

      // === 選択矩形の枠線（白い点線） ===
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
      ctx.setLineDash([]);

      // === リサイズハンドル（8箇所の白い四角） ===
      const handles = getHandlePositions(selection);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 1;

      for (const pos of Object.values(handles)) {
        ctx.fillRect(
          pos.x - HANDLE_SIZE / 2,
          pos.y - HANDLE_SIZE / 2,
          HANDLE_SIZE,
          HANDLE_SIZE
        );
        ctx.strokeRect(
          pos.x - HANDLE_SIZE / 2,
          pos.y - HANDLE_SIZE / 2,
          HANDLE_SIZE,
          HANDLE_SIZE
        );
      }

      // === 選択サイズ表示（右下にテキスト） ===
      const { scale } = displayInfoRef.current;
      const realW = Math.round(selection.width * scale);
      const realH = Math.round(selection.height * scale);
      const sizeText = `${realW} × ${realH}`;
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      const textMetrics = ctx.measureText(sizeText);
      const textX = selection.x + selection.width - textMetrics.width - 8;
      const textY = selection.y + selection.height + 18;
      // テキスト背景
      ctx.fillRect(textX - 4, textY - 13, textMetrics.width + 8, 18);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(sizeText, textX, textY);
    }
  }, [selection, imageLoaded]);

  /**
   * imageLoaded / selection の変更時に再描画
   */
  useEffect(() => {
    if (imageLoaded) {
      draw();
    }
  }, [imageLoaded, selection, draw]);

  /**
   * ウィンドウリサイズ時に再描画
   */
  useEffect(() => {
    const handleResize = () => {
      if (imageLoaded) {
        // 選択範囲をリセット（リサイズ後は座標がずれるため）
        setSelection(null);
        draw();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageLoaded, draw]);

  // ================================================================
  // ハンドル位置計算ユーティリティ
  // ================================================================

  /**
   * 選択矩形の 8 箇所のリサイズハンドル位置を計算する
   *
   * @param sel - 選択矩形
   * @returns 各ハンドルの中心座標
   */
  function getHandlePositions(sel: CropArea): Record<ResizeHandle, Point> {
    const cx = sel.x + sel.width / 2;
    const cy = sel.y + sel.height / 2;
    return {
      nw: { x: sel.x, y: sel.y },
      n:  { x: cx, y: sel.y },
      ne: { x: sel.x + sel.width, y: sel.y },
      w:  { x: sel.x, y: cy },
      e:  { x: sel.x + sel.width, y: cy },
      sw: { x: sel.x, y: sel.y + sel.height },
      s:  { x: cx, y: sel.y + sel.height },
      se: { x: sel.x + sel.width, y: sel.y + sel.height },
    };
  }

  /**
   * マウス位置がどのリサイズハンドルの上にあるかを判定する
   *
   * @param pos - マウスの Canvas 座標
   * @param sel - 現在の選択矩形
   * @returns ヒットしたハンドルの名前、またはなければ null
   */
  function hitTestHandle(pos: Point, sel: CropArea): ResizeHandle | null {
    const handles = getHandlePositions(sel);
    const hitRadius = HANDLE_SIZE + 4; // 少し余裕を持たせる

    for (const [name, hPos] of Object.entries(handles)) {
      if (
        Math.abs(pos.x - hPos.x) <= hitRadius / 2 &&
        Math.abs(pos.y - hPos.y) <= hitRadius / 2
      ) {
        return name as ResizeHandle;
      }
    }
    return null;
  }

  /**
   * マウス位置が選択矩形の内部にあるかを判定する
   *
   * @param pos - マウスの Canvas 座標
   * @param sel - 現在の選択矩形
   * @returns 矩形内なら true
   */
  function isInsideSelection(pos: Point, sel: CropArea): boolean {
    return (
      pos.x >= sel.x &&
      pos.x <= sel.x + sel.width &&
      pos.y >= sel.y &&
      pos.y <= sel.y + sel.height
    );
  }

  // ================================================================
  // マウス / タッチ座標取得
  // ================================================================

  /**
   * マウスイベントまたはタッチイベントから Canvas 座標を取得する
   *
   * @param e - マウスイベントまたはタッチイベント
   * @returns Canvas 上の座標
   */
  function getCanvasPoint(e: React.MouseEvent | React.TouchEvent): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      // タッチイベント
      const touch = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // マウスイベント
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  // ================================================================
  // 選択範囲を画像領域内にクランプ
  // ================================================================

  /**
   * 選択矩形を画像表示領域内に収める
   *
   * @param sel - 制約する選択矩形
   * @returns 画像領域内に収まるように調整された矩形
   */
  function clampToImage(sel: CropArea): CropArea {
    const { offsetX, offsetY, displayW, displayH } = displayInfoRef.current;
    let { x, y, width, height } = sel;

    // 左端
    if (x < offsetX) {
      width -= offsetX - x;
      x = offsetX;
    }
    // 上端
    if (y < offsetY) {
      height -= offsetY - y;
      y = offsetY;
    }
    // 右端
    if (x + width > offsetX + displayW) {
      width = offsetX + displayW - x;
    }
    // 下端
    if (y + height > offsetY + displayH) {
      height = offsetY + displayH - y;
    }

    return { x, y, width: Math.max(0, width), height: Math.max(0, height) };
  }

  /**
   * 移動時に選択矩形を画像領域内にクランプする
   * 矩形サイズは変更せず、位置のみ調整する
   *
   * @param sel - 移動後の選択矩形
   * @returns 画像領域内に収まるように位置を調整された矩形
   */
  function clampMoveToImage(sel: CropArea): CropArea {
    const { offsetX, offsetY, displayW, displayH } = displayInfoRef.current;
    let { x, y } = sel;
    const { width, height } = sel;

    // 左端
    if (x < offsetX) x = offsetX;
    // 上端
    if (y < offsetY) y = offsetY;
    // 右端
    if (x + width > offsetX + displayW) x = offsetX + displayW - width;
    // 下端
    if (y + height > offsetY + displayH) y = offsetY + displayH - height;

    return { x, y, width, height };
  }

  // ================================================================
  // ドラッグイベントハンドラ
  // ================================================================

  /**
   * ドラッグ開始（mousedown / touchstart）
   *
   * マウス位置に応じて3つのモードのいずれかを開始する:
   * 1. リサイズハンドル上 → リサイズモード
   * 2. 選択矩形内 → 移動モード
   * 3. 選択矩形外 → 新規作成モード
   */
  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const pos = getCanvasPoint(e);

      if (selection) {
        // リサイズハンドルのヒットテスト
        const handle = hitTestHandle(pos, selection);
        if (handle) {
          setDragMode("resize");
          setResizeHandle(handle);
          setDragStart(pos);
          setDragStartRect({ ...selection });
          return;
        }

        // 選択矩形内のヒットテスト
        if (isInsideSelection(pos, selection)) {
          setDragMode("move");
          setDragStart(pos);
          setDragStartRect({ ...selection });
          return;
        }
      }

      // 選択範囲外 → 新規作成
      setDragMode("create");
      setDragStart(pos);
      setSelection(null);
    },
    [selection]
  );

  /**
   * ドラッグ中（mousemove / touchmove）
   *
   * ドラッグモードに応じて選択矩形を更新する。
   */
  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!dragMode || !dragStart) return;
      e.preventDefault();

      const pos = getCanvasPoint(e);

      if (dragMode === "create") {
        // === 新規作成モード ===
        // ドラッグ開始点と現在位置で矩形を作成
        const x = Math.min(dragStart.x, pos.x);
        const y = Math.min(dragStart.y, pos.y);
        const width = Math.abs(pos.x - dragStart.x);
        const height = Math.abs(pos.y - dragStart.y);

        setSelection(clampToImage({ x, y, width, height }));
      } else if (dragMode === "move" && dragStartRect) {
        // === 移動モード ===
        // ドラッグ距離分だけ矩形を移動
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;

        setSelection(
          clampMoveToImage({
            x: dragStartRect.x + dx,
            y: dragStartRect.y + dy,
            width: dragStartRect.width,
            height: dragStartRect.height,
          })
        );
      } else if (dragMode === "resize" && dragStartRect && resizeHandle) {
        // === リサイズモード ===
        // ハンドルの種類に応じて矩形の辺を移動
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;

        let { x, y, width, height } = dragStartRect;

        // 左辺を動かすハンドル（nw, w, sw）
        if (resizeHandle.includes("w")) {
          x = dragStartRect.x + dx;
          width = dragStartRect.width - dx;
        }
        // 右辺を動かすハンドル（ne, e, se）
        if (resizeHandle.includes("e")) {
          width = dragStartRect.width + dx;
        }
        // 上辺を動かすハンドル（nw, n, ne）
        if (resizeHandle.includes("n")) {
          y = dragStartRect.y + dy;
          height = dragStartRect.height - dy;
        }
        // 下辺を動かすハンドル（sw, s, se）
        if (resizeHandle.includes("s")) {
          height = dragStartRect.height + dy;
        }

        // 幅 / 高さが負になった場合の反転処理
        if (width < 0) {
          x = x + width;
          width = -width;
        }
        if (height < 0) {
          y = y + height;
          height = -height;
        }

        setSelection(clampToImage({ x, y, width, height }));
      }
    },
    [dragMode, dragStart, dragStartRect, resizeHandle]
  );

  /**
   * ドラッグ終了（mouseup / touchend）
   *
   * ドラッグ状態をリセットする。
   * 作成モードで矩形が小さすぎる場合はクリックと見なして選択を解除する。
   */
  const handlePointerUp = useCallback(() => {
    if (dragMode === "create" && selection) {
      // 最小サイズ未満の矩形は無視（クリック操作と判定）
      if (selection.width < MIN_RECT_SIZE || selection.height < MIN_RECT_SIZE) {
        setSelection(null);
      }
    }

    setDragMode(null);
    setDragStart(null);
    setDragStartRect(null);
    setResizeHandle(null);
  }, [dragMode, selection]);

  // ================================================================
  // カーソル形状の制御
  // ================================================================

  /**
   * マウス位置に応じてカーソル形状を変更する
   * ドラッグ中はドラッグモードに応じたカーソルを表示
   */
  const handleMouseMoveForCursor = useCallback(
    (e: React.MouseEvent) => {
      if (dragMode) return; // ドラッグ中は変更しない
      const canvas = canvasRef.current;
      if (!canvas) return;

      const pos = getCanvasPoint(e);

      if (selection) {
        // リサイズハンドルの上 → リサイズカーソル
        const handle = hitTestHandle(pos, selection);
        if (handle) {
          const cursorMap: Record<ResizeHandle, string> = {
            nw: "nwse-resize", ne: "nesw-resize",
            sw: "nesw-resize", se: "nwse-resize",
            n: "ns-resize", s: "ns-resize",
            e: "ew-resize", w: "ew-resize",
          };
          canvas.style.cursor = cursorMap[handle];
          return;
        }

        // 選択矩形内 → 移動カーソル
        if (isInsideSelection(pos, selection)) {
          canvas.style.cursor = "move";
          return;
        }
      }

      // デフォルト → クロスヘアカーソル
      canvas.style.cursor = "crosshair";
    },
    [selection, dragMode]
  );

  // ================================================================
  // 切り抜き確定
  // ================================================================

  /**
   * 「切り抜き」ボタンのクリックハンドラ
   *
   * Canvas 上の選択矩形座標を元画像のピクセル座標に変換し、
   * getCroppedImage() で切り抜きを実行する。
   */
  const handleConfirm = useCallback(async () => {
    if (!selection || isProcessing) return;

    setIsProcessing(true);
    try {
      const { scale, offsetX, offsetY } = displayInfoRef.current;

      // Canvas 座標 → 元画像のピクセル座標に変換
      const cropArea: CropArea = {
        x: Math.round((selection.x - offsetX) * scale),
        y: Math.round((selection.y - offsetY) * scale),
        width: Math.round(selection.width * scale),
        height: Math.round(selection.height * scale),
      };

      const croppedDataUrl = await getCroppedImage(imageSrc, cropArea);
      onCropComplete(croppedDataUrl);
    } catch (err) {
      console.error("画像の切り抜きに失敗しました:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [imageSrc, selection, isProcessing, onCropComplete]);

  // ================================================================
  // レンダリング
  // ================================================================

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
      {/* ヘッダー: タブ切り替え（または単体タイトル） + アクションボタン */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        {/* タブ UI: マーカー / 切り抜き / メモ の3タブ（onSwitchMode がある場合） */}
        {onSwitchMode ? (
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  currentMode === "annotate"
                    ? "bg-white/20 text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => onSwitchMode("annotate")}
              >
                マーカー
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  currentMode === "crop"
                    ? "bg-white/20 text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => onSwitchMode("crop")}
              >
                切り抜き
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded transition-colors
                           text-gray-400 hover:text-white hover:bg-white/10"
                onClick={() => onSwitchMode("memo")}
              >
                メモ
              </button>
            </div>
            <span className="text-gray-400 text-xs">ドラッグで範囲を選択</span>
          </div>
        ) : (
          <h3 className="text-white text-sm font-medium">
            画像を切り抜き
            <span className="text-gray-400 text-xs ml-2">
              ドラッグで範囲を選択
            </span>
          </h3>
        )}
        <div className="flex gap-2">
          <button
            className="px-4 py-1.5 text-sm text-gray-300 hover:text-white
                       rounded transition-colors"
            onClick={() => onCancel()}
          >
            戻る
          </button>
          <button
            className="px-4 py-1.5 text-sm bg-blue-500 text-white
                       rounded hover:bg-blue-600 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirm}
            disabled={isProcessing || !selection}
          >
            {isProcessing ? "処理中..." : "切り抜き"}
          </button>
        </div>
      </div>

      {/* 切り抜きエリア: Canvas による矩形選択 */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={(e) => {
            handlePointerMove(e);
            handleMouseMoveForCursor(e);
          }}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* 画像読み込み中のインジケーター */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400 text-sm">画像を読み込み中...</div>
          </div>
        )}
      </div>

      {/* フッター: 操作ヒント */}
      <div className="flex items-center justify-center gap-4 px-4 py-3 bg-black/50">
        <span className="text-gray-400 text-xs">
          {selection
            ? "選択範囲をドラッグで移動 / 角をドラッグでリサイズ / 範囲外でドラッグし直し"
            : "画像上をドラッグして切り抜き範囲を選択してください"}
        </span>
      </div>
    </div>
  );
}
