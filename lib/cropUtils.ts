/**
 * 画像切り抜きユーティリティ
 *
 * 矩形選択で取得した切り抜き範囲（ピクセル座標）を使って、
 * Canvas API で画像を切り抜き、base64 DataURL を生成する。
 */

/**
 * 切り抜き範囲の型定義
 * ImageCropModal の矩形選択で返される切り抜き範囲に対応
 */
export type CropArea = {
  /** 切り抜き開始位置 X（px） */
  x: number;
  /** 切り抜き開始位置 Y（px） */
  y: number;
  /** 切り抜き範囲の幅（px） */
  width: number;
  /** 切り抜き範囲の高さ（px） */
  height: number;
};

/**
 * 画像を指定範囲で切り抜いて base64 DataURL を生成する
 *
 * 処理の流れ:
 * 1. 元画像を Image 要素に読み込み
 * 2. Canvas を切り抜きサイズで作成
 * 3. drawImage で指定範囲のみを描画
 * 4. toDataURL で base64 に変換
 *
 * @param imageSrc - 元画像の DataURL または URL
 * @param cropArea - 切り抜き範囲（ピクセル座標）
 * @returns 切り抜き後の base64 DataURL
 */
export function getCroppedImage(
  imageSrc: string,
  cropArea: CropArea
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // CORS 画像への対応（DataURL の場合は不要だが念のため）
    image.crossOrigin = "anonymous";

    image.onload = () => {
      // 切り抜きサイズの Canvas を作成
      const canvas = document.createElement("canvas");
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas 2D コンテキストの取得に失敗しました"));
        return;
      }

      // 指定範囲を切り抜いて Canvas に描画
      // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
      ctx.drawImage(
        image,
        cropArea.x,           // 元画像の切り抜き開始 X
        cropArea.y,           // 元画像の切り抜き開始 Y
        cropArea.width,       // 元画像の切り抜き幅
        cropArea.height,      // 元画像の切り抜き高さ
        0,                    // Canvas 上の描画開始 X
        0,                    // Canvas 上の描画開始 Y
        cropArea.width,       // Canvas 上の描画幅
        cropArea.height       // Canvas 上の描画高さ
      );

      // PNG 形式で base64 DataURL に変換
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => {
      reject(new Error("画像の読み込みに失敗しました"));
    };

    image.src = imageSrc;
  });
}
