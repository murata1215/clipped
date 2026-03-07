"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// 型定義
// ============================================================

/**
 * ツールの種類
 * - "pen": フリーハンドペン描画
 * - "arrow": 矢印ツール（始点→終点にきれいな矢印を描画）
 * - "circle": 丸（楕円）ツール（ドラッグで楕円を配置）
 */
type ToolType = "pen" | "arrow" | "circle";

/**
 * ImageAnnotation コンポーネントのプロパティ
 */
type ImageAnnotationProps = {
  /** 描画対象の画像 DataURL */
  imageSrc: string;
  /** 描画確定時のコールバック（描画後の DataURL を返す） */
  onSave: (annotatedDataUrl: string) => void;
  /** キャンセル時のコールバック */
  onCancel: () => void;
  /** タブ切り替えコールバック（省略時はスタンドアロンモード、タブ非表示） */
  onSwitchMode?: (mode: "crop" | "annotate") => void;
  /** 現在のモード（タブのアクティブ表示用） */
  currentMode?: "crop" | "annotate";
};

/**
 * ストローク（1回の描画操作）のデータ
 * Undo 機能はストローク単位で行う
 */
type Stroke = {
  /** ストロークの色 */
  color: string;
  /** ストロークの太さ（px） */
  lineWidth: number;
  /** ストロークの透明度（0.0〜1.0、蛍光ペン風の半透明描画に使用） */
  opacity: number;
  /** ストロークを構成する座標点の配列 */
  points: { x: number; y: number }[];
  /**
   * ツール種別
   * - undefined は後方互換で "pen" 扱い（既存データとの互換性維持）
   * - "pen": フリーハンド描画（points に可変長座標配列）
   * - "arrow": 矢印（points[0]=始点, points[1]=終点 の2点のみ）
   * - "circle": 楕円（points[0]=バウンディングボックス角1, points[1]=対角 の2点のみ）
   */
  toolType?: ToolType;
};

/**
 * マーカー設定の型定義
 * localStorage に保存して次回マーカー起動時に復元する
 */
type MarkerPrefs = {
  /** ペンの色 */
  color: string;
  /** ペンの太さ（px） */
  width: number;
  /** ペンの透明度（0.0〜1.0） */
  opacity: number;
  /** 選択中のツール種別（未保存時は "pen" として扱う） */
  toolType?: ToolType;
};

// ============================================================
// 定数
// ============================================================

/** ペンの色選択肢 */
const PEN_COLORS = [
  { value: "#FF0000", label: "赤" },
  { value: "#FFFF00", label: "黄" },
  { value: "#00FF00", label: "緑" },
  { value: "#0088FF", label: "青" },
  { value: "#000000", label: "黒" },
  { value: "#FFFFFF", label: "白" },
];

/** ペンの太さの最小値（px） */
const PEN_WIDTH_MIN = 2;
/** ペンの太さの最大値（px） — 極太マーカーに対応 */
const PEN_WIDTH_MAX = 40;
/** ペンの太さのデフォルト値（px） */
const PEN_WIDTH_DEFAULT = 12;

/** 透明度のデフォルト値（蛍光ペン風） */
const PEN_OPACITY_DEFAULT = 0.4;

/** マーカー設定の localStorage キー */
const MARKER_PREFS_KEY = "clipped:marker-prefs";

/** ToolType として有効な値の一覧（バリデーション用） */
const VALID_TOOL_TYPES: ToolType[] = ["pen", "arrow", "circle"];

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * localStorage から前回のマーカー設定を読み込む
 *
 * 保存済みの色・太さ・透明度・ツール種別を復元する。
 * 値が不正な場合はデフォルト値にフォールバックする。
 * SSR 環境（typeof window === "undefined"）では常にデフォルトを返す。
 *
 * @returns マーカー設定オブジェクト
 */
function loadMarkerPrefs(): MarkerPrefs {
  if (typeof window === "undefined") {
    return { color: "#FF0000", width: PEN_WIDTH_DEFAULT, opacity: PEN_OPACITY_DEFAULT, toolType: "pen" };
  }
  try {
    const saved = localStorage.getItem(MARKER_PREFS_KEY);
    if (saved) {
      const prefs = JSON.parse(saved);
      return {
        color: typeof prefs.color === "string" ? prefs.color : "#FF0000",
        width: Math.max(PEN_WIDTH_MIN, Math.min(PEN_WIDTH_MAX, Number(prefs.width) || PEN_WIDTH_DEFAULT)),
        opacity: Math.max(0.1, Math.min(1.0, Number(prefs.opacity) || PEN_OPACITY_DEFAULT)),
        toolType: VALID_TOOL_TYPES.includes(prefs.toolType) ? prefs.toolType : "pen",
      };
    }
  } catch {
    // JSON パースエラー等は無視してデフォルトを返す
  }
  return { color: "#FF0000", width: PEN_WIDTH_DEFAULT, opacity: PEN_OPACITY_DEFAULT, toolType: "pen" };
}

// ============================================================
// 描画ユーティリティ関数
// ============================================================

/**
 * フリーハンドペンストロークを描画する
 *
 * points 配列の各座標を lineTo で結んで描画する。
 * lineCap="round", lineJoin="round" で丸い仕上がりにする。
 *
 * @param ctx - Canvas 2D コンテキスト
 * @param stroke - 描画するストロークデータ
 */
function drawPenStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 始点に移動
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  // 各点を線で結ぶ
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  ctx.stroke();
}

/**
 * 矢印ストロークを描画する
 *
 * 始点から終点への直線（シャフト）と、終点に三角形の矢じり（arrowhead）を描画する。
 * 「手書きっぽさ」は lineCap="round" で丸い仕上がりにすることで実現する。
 * 矢じりは塗りつぶし三角形で、しっかりした印象にする。
 *
 * points[0] = 始点、points[1] = 終点
 *
 * @param ctx - Canvas 2D コンテキスト
 * @param stroke - 矢印ストロークデータ
 */
function drawArrow(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const start = stroke.points[0];
  const end = stroke.points[1];
  if (!start || !end) return;

  const lw = stroke.lineWidth;

  // --- 矢じりのサイズ計算 ---
  // lineWidth に比例させつつ、最小サイズを保証
  const headLength = Math.max(lw * 3, 20); // 矢じりの長さ
  // headWidth は headLength と角度から自動決定（30°の開き角）

  // 始点→終点の角度を計算
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  // --- シャフト（直線部分）の描画 ---
  // 矢じりの根元まで線を引く（矢じりと重ならないようにする）
  const shaftEndX = end.x - Math.cos(angle) * headLength * 0.7;
  const shaftEndY = end.y - Math.sin(angle) * headLength * 0.7;

  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  // --- 矢じり（三角形）の描画 ---
  // 終点を頂点とし、左右に30°の角度で広がる三角形
  // Math.PI / 6 = 30° は矢じりの開き角度（きれいな三角形になる）
  const leftX = end.x - Math.cos(angle - Math.PI / 6) * headLength;
  const leftY = end.y - Math.sin(angle - Math.PI / 6) * headLength;
  const rightX = end.x - Math.cos(angle + Math.PI / 6) * headLength;
  const rightY = end.y - Math.sin(angle + Math.PI / 6) * headLength;

  ctx.beginPath();
  ctx.fillStyle = stroke.color;
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fill();
}

/**
 * 楕円ストロークを描画する
 *
 * 2点をバウンディングボックスの対角とし、その中に収まる楕円を描画する。
 * ストロークのみ（fill なし）で、指定色・太さ・透明度を適用する。
 * Math.abs でドラッグ方向に依存しない（どの方向にドラッグしても正しく動作）。
 *
 * points[0] = ドラッグ始点（バウンディングボックスの角1）
 * points[1] = ドラッグ終点（バウンディングボックスの対角）
 *
 * @param ctx - Canvas 2D コンテキスト
 * @param stroke - 楕円ストロークデータ
 */
function drawEllipse(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const p1 = stroke.points[0];
  const p2 = stroke.points[1];
  if (!p1 || !p2) return;

  // バウンディングボックスの中心点を計算
  const centerX = (p1.x + p2.x) / 2;
  const centerY = (p1.y + p2.y) / 2;

  // X方向・Y方向の半径を計算（Math.abs でドラッグ方向に依存しない）
  const radiusX = Math.abs(p2.x - p1.x) / 2;
  const radiusY = Math.abs(p2.y - p1.y) / 2;

  // 半径が極小の場合は描画しない（クリックのみの場合）
  if (radiusX < 1 && radiusY < 1) return;

  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // ctx.ellipse() で楕円パスを作成
  // 引数: centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle
  ctx.ellipse(centerX, centerY, Math.max(radiusX, 0.5), Math.max(radiusY, 0.5), 0, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * 1つのストロークを Canvas に描画する（ツール別ディスパッチ）
 *
 * ストロークの toolType に応じて適切な描画関数に委譲する。
 * toolType が undefined の場合は後方互換で "pen" として扱う。
 *
 * @param ctx - Canvas 2D コンテキスト
 * @param stroke - 描画するストロークデータ
 */
function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke | null) {
  // null ガード: redrawCanvas から呼ばれる際、currentStrokeRef.current が
  // 描画中に null になる可能性があるため安全にチェックする
  if (!stroke || stroke.points.length < 2) return;

  // 現在の globalAlpha を保存して、ストロークごとの透明度を適用
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = stroke.opacity;

  // ツール種別に応じた描画関数にディスパッチ
  const tool = stroke.toolType ?? "pen";

  if (tool === "arrow") {
    drawArrow(ctx, stroke);
  } else if (tool === "circle") {
    drawEllipse(ctx, stroke);
  } else {
    drawPenStroke(ctx, stroke);
  }

  // globalAlpha を元に戻す（他の描画に影響を与えないため）
  ctx.globalAlpha = prevAlpha;
}

// ============================================================
// コンポーネント
// ============================================================

/**
 * ImageAnnotation コンポーネント
 *
 * HTML5 Canvas API を使用して画像上にフリーハンドでマーカーを描画する。
 * 全画面オーバーレイで表示し、以下の操作が可能:
 *
 * - ペンツール: マウスドラッグでフリーハンド描画（半透明マーカー対応）
 * - 矢印ツール: ドラッグで始点→終点に矢印を配置（指示書作成用）
 * - 丸（楕円）ツール: ドラッグで楕円を配置（指示書作成用）
 * - 色選択: 6色から選択
 * - 太さ選択: スライダーで 2〜40px まで可変（極太マーカー対応）
 * - 透明度選択: スライダーで 10%〜100% まで可変（蛍光ペン風描画）
 * - Undo: ストローク単位で取り消し（Ctrl+Z / Cmd+Z 対応）
 * - クリップボードコピー: Ctrl+C / Cmd+C で Canvas 内容をコピー
 * - 設定記憶: 色・太さ・透明度・ツール種別を localStorage に保存し次回復元
 * - 保存: 画像 + 描画を結合して DataURL で出力
 * - キャンセル: 描画を破棄
 *
 * Canvas のスケーリング:
 * - 表示用 Canvas は画面サイズに合わせてフィット拡大表示
 * - 出力用 Canvas は元画像と同じ解像度で生成
 * - 描画座標は表示倍率を考慮してスケーリング
 */
export default function ImageAnnotation({
  imageSrc,
  onSave,
  onCancel,
  onSwitchMode,
  currentMode,
}: ImageAnnotationProps) {
  // ================================================================
  // ステート管理
  // ================================================================

  /** 描画用 Canvas の ref */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Canvas コンテナの ref */
  const containerRef = useRef<HTMLDivElement>(null);
  /** 元画像の Image オブジェクト */
  const imageRef = useRef<HTMLImageElement | null>(null);

  /** 現在のペン色（localStorage から復元） */
  const [penColor, setPenColor] = useState(() => loadMarkerPrefs().color);
  /** 現在のペンの太さ（localStorage から復元、スライダーで 2〜40px） */
  const [penWidth, setPenWidth] = useState(() => loadMarkerPrefs().width);
  /** 現在のペンの透明度（localStorage から復元、0.1〜1.0） */
  const [penOpacity, setPenOpacity] = useState(() => loadMarkerPrefs().opacity);
  /** 現在選択中のツール（localStorage から復元、デフォルト: "pen"） */
  const [toolType, setToolType] = useState<ToolType>(() => loadMarkerPrefs().toolType ?? "pen");
  /** 全ストロークの履歴（Undo 用） */
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  /** 現在描画中のストローク */
  const currentStrokeRef = useRef<Stroke | null>(null);
  /** マウスが押されている（描画中）かどうか */
  const isDrawingRef = useRef(false);

  /** Canvas の表示倍率（元画像に対する表示サイズの比率） */
  const [scale, setScale] = useState(1);
  /** 元画像の幅 */
  const [imageWidth, setImageWidth] = useState(0);
  /** 元画像の高さ */
  const [imageHeight, setImageHeight] = useState(0);
  /** 画像読み込み完了フラグ */
  const [imageLoaded, setImageLoaded] = useState(false);

  /** クリップボードコピー成功時のフィードバック表示フラグ */
  const [copyFeedback, setCopyFeedback] = useState(false);

  // ================================================================
  // マーカー設定の永続化
  // ================================================================

  /**
   * ペン設定（色・太さ・透明度・ツール種別）が変更されるたびに localStorage に保存する。
   * これにより、次回マーカーを開いた時に前回の設定が復元される。
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        MARKER_PREFS_KEY,
        JSON.stringify({ color: penColor, width: penWidth, opacity: penOpacity, toolType })
      );
    } catch {
      // localStorage 容量超過等のエラーは無視（設定が保存されないだけ）
    }
  }, [penColor, penWidth, penOpacity, toolType]);

  // ================================================================
  // 画像読み込みと Canvas 初期化
  // ================================================================

  /**
   * 画像を読み込み、Canvas のサイズを設定する
   *
   * 画像のアスペクト比を維持しつつ、画面に収まるようスケーリング。
   * Canvas は元画像と同じ解像度で作成し、CSS でスケール表示する。
   */
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageWidth(img.naturalWidth);
      setImageHeight(img.naturalHeight);

      // コンテナサイズに合わせて表示倍率を計算
      // コンテナがまだレイアウトされていない場合（clientWidth/Height が 0）は
      // requestAnimationFrame で次フレームに計算を遅延して安全に処理する
      const calcScale = () => {
        const container = containerRef.current;
        if (!container) return;

        const maxW = container.clientWidth - 32; // パディング分を引く
        const maxH = container.clientHeight - 32;

        // コンテナサイズが 0 の場合は次フレームで再試行
        if (maxW <= 0 || maxH <= 0) {
          requestAnimationFrame(calcScale);
          return;
        }

        const scaleX = maxW / img.naturalWidth;
        const scaleY = maxH / img.naturalHeight;
        // コンテナに収まる最大倍率を計算（小さい画像も拡大表示する）
        // 0.01 未満にはしない（極小防止）
        const newScale = Math.max(Math.min(scaleX, scaleY), 0.01);
        setScale(newScale);
      };
      calcScale();

      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  /**
   * Canvas に画像とストロークを描画する
   *
   * 呼び出しタイミング:
   * - 画像読み込み完了時
   * - ストローク追加/Undo 時
   * - リアルタイム描画中
   */
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas をクリアして画像を再描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 保存済みのストロークを全て再描画
    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }

    // 描画中のストロークも描画
    if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current);
    }
  }, [strokes]);

  /**
   * 画像・ストロークの変化時に Canvas を再描画
   */
  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas();
    }
  }, [imageLoaded, redrawCanvas]);

  // ================================================================
  // マウス / タッチイベントハンドラ
  // ================================================================

  /**
   * Canvas 上のイベント座標を、Canvas 内部座標に変換する
   * CSS スケーリングを考慮して正確な描画位置を計算する
   *
   * @param e - マウスイベント
   * @returns Canvas 内部座標 { x, y }
   */
  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      // CSS 表示サイズと Canvas 内部サイズの比率を計算
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  /**
   * タッチイベント座標を Canvas 内部座標に変換する
   * @param e - タッチイベント
   * @returns Canvas 内部座標 { x, y }
   */
  const getCanvasTouchPoint = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const touch = e.touches[0];

      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  /**
   * 描画開始（マウスダウン）
   * 新しいストロークを開始し、最初の点を記録する。
   * ツール種別もストロークに記録する。
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isDrawingRef.current = true;
      const point = getCanvasPoint(e);
      currentStrokeRef.current = {
        color: penColor,
        lineWidth: penWidth,
        opacity: penOpacity,
        toolType,
        points: [point],
      };
    },
    [penColor, penWidth, penOpacity, toolType, getCanvasPoint]
  );

  /**
   * 描画中（マウスムーブ）
   *
   * ツール種別に応じて points の更新方式を分岐する:
   * - pen: 点を追加し続ける（フリーハンド軌跡）
   * - arrow / circle: points[1] を常に上書き（始点 + 現在位置の2点のみ保持）
   *
   * リアルタイムで Canvas を再描画してプレビュー表示する。
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;

      const point = getCanvasPoint(e);
      const stroke = currentStrokeRef.current;
      const tool = stroke.toolType ?? "pen";

      if (tool === "pen") {
        // ペン: 点を追加し続ける（従来動作）
        stroke.points.push(point);
      } else {
        // 矢印・丸: 2点目を常に上書き（始点 + 現在位置のみ保持）
        if (stroke.points.length < 2) {
          stroke.points.push(point);
        } else {
          stroke.points[1] = point;
        }
      }

      redrawCanvas();
    },
    [getCanvasPoint, redrawCanvas]
  );

  /**
   * 描画終了（マウスアップ）
   * 現在のストロークを確定してストローク履歴に追加する
   */
  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    isDrawingRef.current = false;

    // ref の値をローカル変数に退避してから null にリセットする。
    // setStrokes のコールバックは React のバッチ処理で遅延実行されるため、
    // 先に null にすると コールバック内で null 参照エラーが発生する。
    const completedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    // 点が2つ以上あるストロークのみ保存（1点だけのクリックは無視）
    if (completedStroke.points.length >= 2) {
      setStrokes((prev) => [...prev, completedStroke]);
    }
  }, []);

  /**
   * タッチ描画開始
   * handleMouseDown と同様だが、タッチ座標を使用する。
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault(); // スクロールを防止
      isDrawingRef.current = true;
      const point = getCanvasTouchPoint(e);
      currentStrokeRef.current = {
        color: penColor,
        lineWidth: penWidth,
        opacity: penOpacity,
        toolType,
        points: [point],
      };
    },
    [penColor, penWidth, penOpacity, toolType, getCanvasTouchPoint]
  );

  /**
   * タッチ描画中
   * handleMouseMove と同様のツール分岐ロジックを適用する。
   */
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawingRef.current || !currentStrokeRef.current) return;

      const point = getCanvasTouchPoint(e);
      const stroke = currentStrokeRef.current;
      const tool = stroke.toolType ?? "pen";

      if (tool === "pen") {
        // ペン: 点を追加し続ける
        stroke.points.push(point);
      } else {
        // 矢印・丸: 2点目を常に上書き
        if (stroke.points.length < 2) {
          stroke.points.push(point);
        } else {
          stroke.points[1] = point;
        }
      }

      redrawCanvas();
    },
    [getCanvasTouchPoint, redrawCanvas]
  );

  /**
   * タッチ描画終了
   */
  const handleTouchEnd = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;

    // handleMouseUp と同様、ローカル変数に退避してから null リセット
    const completedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    if (completedStroke.points.length >= 2) {
      setStrokes((prev) => [...prev, completedStroke]);
    }
  }, []);

  // ================================================================
  // アクションハンドラ
  // ================================================================

  /**
   * Undo（元に戻す）
   * 最後のストロークを削除して Canvas を再描画する
   */
  const handleUndo = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  /**
   * 全クリア
   * すべてのストロークを削除して画像のみの状態に戻す
   */
  const handleClear = useCallback(() => {
    setStrokes([]);
  }, []);

  /**
   * 保存
   * 画像 + 描画を結合した DataURL を生成して親コンポーネントに渡す
   */
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Canvas の内容を PNG DataURL に変換
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  }, [onSave]);

  /**
   * Canvas の内容をクリップボードにコピーする
   *
   * canvas.toBlob() で PNG Blob を生成し、
   * Clipboard API の navigator.clipboard.write() でクリップボードに書き込む。
   * コピー成功時は copyFeedback を 2 秒間 true にしてフィードバックを表示する。
   */
  const handleCopyToClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Canvas の内容を PNG Blob に変換
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png");
      });
      if (!blob) return;

      // Clipboard API でクリップボードに書き込み
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      // コピー成功フィードバックを 2 秒間表示
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error("クリップボードへのコピーに失敗しました:", err);
    }
  }, []);

  // ================================================================
  // キーボードショートカット
  // ================================================================

  /**
   * キーボードショートカットのハンドラ
   *
   * - Ctrl+Z / Cmd+Z: アンドゥ（最後のストロークを取り消し）
   * - Ctrl+C / Cmd+C: Canvas の内容をクリップボードにコピー
   *
   * マーカー描画画面が表示されている間のみ有効。
   * アンマウント時にリスナーを解除する。
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      // Ctrl+Z / Cmd+Z: アンドゥ
      if (e.key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+C / Cmd+C: クリップボードにコピー
      if (e.key === "c") {
        e.preventDefault();
        handleCopyToClipboard();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleCopyToClipboard]);

  // ================================================================
  // レンダリング
  // ================================================================

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
      {/* ヘッダー: タブ切り替え（または単体タイトル） + アクションボタン */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        {/* onSwitchMode が渡されている場合はタブ UI を表示、なければ単体タイトル */}
        {onSwitchMode ? (
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
          </div>
        ) : (
          <h3 className="text-white text-sm font-medium">マーカーを描画</h3>
        )}
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white
                       rounded transition-colors"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-blue-500 text-white
                       rounded hover:bg-blue-600 transition-colors"
            onClick={handleSave}
          >
            保存
          </button>
        </div>
      </div>

      {/* ツールバー: ツール選択 + 色 + 太さスライダー + 透明度スライダー + Undo + コピー + クリア */}
      <div className="flex items-center gap-3 px-4 py-2 bg-black/30 flex-wrap">
        {/* ツール選択ボタン（ペン / 矢印 / 丸） */}
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-xs mr-1">ツール:</span>

          {/* ペンツール */}
          <button
            title="ペン（フリーハンド）"
            className={`w-8 h-8 flex items-center justify-center rounded transition-all
              ${toolType === "pen"
                ? "bg-white/20 border-2 border-white"
                : "border-2 border-gray-600 hover:border-gray-400"
              }`}
            onClick={() => setToolType("pen")}
          >
            {/* ペンアイコン（SVG） */}
            <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* 矢印ツール */}
          <button
            title="矢印"
            className={`w-8 h-8 flex items-center justify-center rounded transition-all
              ${toolType === "arrow"
                ? "bg-white/20 border-2 border-white"
                : "border-2 border-gray-600 hover:border-gray-400"
              }`}
            onClick={() => setToolType("arrow")}
          >
            {/* 矢印アイコン（SVG）: 右上向き矢印 */}
            <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M5 19L19 5M19 5h-6M19 5v6" />
            </svg>
          </button>

          {/* 丸（楕円）ツール */}
          <button
            title="丸（楕円）"
            className={`w-8 h-8 flex items-center justify-center rounded transition-all
              ${toolType === "circle"
                ? "bg-white/20 border-2 border-white"
                : "border-2 border-gray-600 hover:border-gray-400"
              }`}
            onClick={() => setToolType("circle")}
          >
            {/* 丸アイコン（SVG） */}
            <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
            </svg>
          </button>
        </div>

        {/* ペン色選択 */}
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-xs mr-1">色:</span>
          {PEN_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              className={`w-6 h-6 rounded-full border-2 transition-all
                ${
                  penColor === c.value
                    ? "border-white scale-110"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              style={{ backgroundColor: c.value }}
              onClick={() => setPenColor(c.value)}
            />
          ))}
        </div>

        {/* ペン太さスライダー（2〜40px） */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-xs">太さ:</span>
          <input
            type="range"
            min={PEN_WIDTH_MIN}
            max={PEN_WIDTH_MAX}
            step={1}
            value={penWidth}
            onChange={(e) => setPenWidth(Number(e.target.value))}
            className="w-20 h-1.5 accent-white cursor-pointer"
            title={`太さ: ${penWidth}px`}
          />
          {/* 太さプレビュー: 現在の太さに応じた円を表示 */}
          <div className="flex items-center justify-center w-8">
            <div
              className="rounded-full"
              style={{
                width: Math.max(4, Math.min(penWidth, 24)),
                height: Math.max(4, Math.min(penWidth, 24)),
                backgroundColor: penColor,
                opacity: penOpacity,
              }}
            />
          </div>
          <span className="text-gray-500 text-[10px] w-6 text-right">{penWidth}</span>
        </div>

        {/* 透明度スライダー（10%〜100%） */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-xs">透明度:</span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={Math.round(penOpacity * 100)}
            onChange={(e) => setPenOpacity(Number(e.target.value) / 100)}
            className="w-16 h-1.5 accent-white cursor-pointer"
            title={`透明度: ${Math.round(penOpacity * 100)}%`}
          />
          <span className="text-gray-500 text-[10px] w-8">
            {Math.round(penOpacity * 100)}%
          </span>
        </div>

        {/* Undo ボタン（Ctrl+Z でも操作可能） */}
        <button
          className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded
                     hover:bg-gray-600 transition-colors disabled:opacity-30"
          onClick={handleUndo}
          disabled={strokes.length === 0}
          title="元に戻す（Ctrl+Z）"
        >
          ↩ 戻す
        </button>

        {/* クリップボードにコピーボタン（Ctrl+C でも操作可能） */}
        <button
          className={`px-2 py-1 text-xs rounded transition-colors ${
            copyFeedback
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
          onClick={handleCopyToClipboard}
          title="クリップボードにコピー（Ctrl+C）"
        >
          {copyFeedback ? "✓ コピー済" : "コピー"}
        </button>

        {/* 全クリアボタン */}
        <button
          className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded
                     hover:bg-gray-600 transition-colors disabled:opacity-30"
          onClick={handleClear}
          disabled={strokes.length === 0}
          title="全てクリア"
        >
          全消し
        </button>
      </div>

      {/* Canvas エリア */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden p-4"
      >
        {imageLoaded && (
          <canvas
            ref={canvasRef}
            width={imageWidth}
            height={imageHeight}
            style={{
              width: imageWidth * scale,
              height: imageHeight * scale,
              cursor: "crosshair",
              touchAction: "none",
            }}
            className="border border-gray-600 rounded"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {/* 画像読み込み中の表示 */}
        {!imageLoaded && (
          <p className="text-gray-400 text-sm">画像を読み込み中...</p>
        )}
      </div>
    </div>
  );
}
