/**
 * 画像処理ユーティリティ
 *
 * クリップボードからペーストされた画像を canvas でリサイズし、
 * base64 DataURL に変換する。未ログイン時は localStorage に保存するため、
 * 容量を抑えるためにリサイズが必要。
 */

import { createId } from "@paralleldrive/cuid2";
import type { LocalImage } from "./localStorage";

/**
 * 画像 Blob を canvas でリサイズし、LocalImage オブジェクトを返す
 *
 * 処理の流れ:
 * 1. Blob → Image 要素に読み込み
 * 2. 元画像のサイズを取得
 * 3. maxSize を超える場合はアスペクト比を保ったままリサイズ
 * 4. canvas に描画して base64 DataURL に変換
 *
 * @param blob - クリップボードから取得した画像 Blob
 * @param maxSize - リサイズ後の最大辺サイズ（px）。デフォルト 1600
 * @returns LocalImage オブジェクト（id, dataUrl, mimeType, width, height）
 */
export async function resizeToDataUrl(
  blob: Blob,
  maxSize: number = 1600
): Promise<LocalImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    /** FileReader で Blob を DataURL に変換して Image に読み込む */
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        /** 元画像のサイズ */
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        /**
         * リサイズ計算
         * 長辺が maxSize を超える場合のみリサイズする。
         * アスペクト比を維持するため、長辺を maxSize に合わせて短辺を比率で計算。
         */
        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            // 横長画像: 幅を maxSize に
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            // 縦長画像: 高さを maxSize に
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        /** canvas に描画してリサイズ */
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D コンテキストの取得に失敗しました"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        /** JPEG 形式で base64 DataURL を取得（PNG より大幅に軽量） */
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        resolve({
          id: createId(),
          dataUrl,
          mimeType: "image/jpeg",
          width,
          height,
        });
      };

      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(blob);
  });
}
