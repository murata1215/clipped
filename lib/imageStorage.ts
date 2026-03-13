/**
 * 画像ファイル保存ユーティリティ
 *
 * アップロードされた画像ファイルをディスクに保存・削除する。
 * ファイル名は cuid2 で生成し、ディレクトリトラバーサルを防止する。
 *
 * ストレージ構造:
 *   data/photos/{imageId}.{ext}
 *
 * Phase 9.5 で sharp によるリサイズ対応を予定。
 */

import fs from "fs/promises";
import path from "path";
import { createId } from "@paralleldrive/cuid2";

// ============================================================
// 定数
// ============================================================

/** 画像ファイルの保存ディレクトリ */
const PHOTOS_DIR = path.join(process.cwd(), "data", "photos");

/** 許可する MIME タイプ */
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/** 1ファイルの最大サイズ（10MB） */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 1メモあたりの最大画像数 */
export const MAX_IMAGES_PER_NOTE = 10;

// ============================================================
// 型定義
// ============================================================

/**
 * 画像保存結果の型
 */
export type SavedImageInfo = {
  /** 生成された画像 ID（cuid2） */
  id: string;
  /** ディスク上のファイル名（{id}.{ext}） */
  filename: string;
  /** MIME タイプ */
  mimeType: string;
  /** ファイルサイズ（バイト） */
  fileSize: number;
};

// ============================================================
// 内部ヘルパー
// ============================================================

/**
 * MIME タイプからファイル拡張子を取得する
 *
 * @param mimeType - MIME タイプ（例: "image/png"）
 * @returns ファイル拡張子（ドットなし）
 */
function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] || "bin";
}

/**
 * 保存ディレクトリの存在を保証する
 *
 * @param subDir - PHOTOS_DIR からの相対サブディレクトリ（省略時はルート）
 */
async function ensurePhotosDir(subDir?: string): Promise<void> {
  const dir = subDir ? path.join(PHOTOS_DIR, subDir) : PHOTOS_DIR;
  await fs.mkdir(dir, { recursive: true });
}

/**
 * 現在の日付を YYYYMMDD 形式で取得する
 */
function todayDateStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// ============================================================
// 公開 API
// ============================================================

/**
 * アップロードされた画像ファイルを検証してディスクに保存する
 *
 * @param file - multipart/form-data から取得した File オブジェクト
 * @param userId - 保存先サブディレクトリに使うユーザー ID
 * @returns 保存結果のメタデータ
 * @throws Error - MIME タイプ不正、ファイルサイズ超過時
 */
export async function saveImageFile(file: File, userId: string): Promise<SavedImageInfo> {
  // MIME タイプ検証
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      `許可されていないファイル形式です: ${file.type}。image/png, image/jpeg, image/webp, image/gif のみ対応しています。`
    );
  }

  // ファイルサイズ検証
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `ファイルサイズが上限を超えています: ${(file.size / 1024 / 1024).toFixed(1)}MB。最大 10MB まで対応しています。`
    );
  }

  const dateStr = todayDateStr();
  const subDir = path.join(userId, dateStr);
  await ensurePhotosDir(subDir);

  const id = createId();
  const ext = mimeToExt(file.type);
  const filename = path.join(subDir, `${id}.${ext}`);
  const filePath = path.join(PHOTOS_DIR, filename);

  // File → ArrayBuffer → Buffer → ディスク書き込み
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  return {
    id,
    filename,
    mimeType: file.type,
    fileSize: buffer.length,
  };
}

/**
 * base64 DataURL から画像ファイルをディスクに保存する
 *
 * Phase 10（localStorage → DB 移行）で使用する。
 * 既存の syncData() と同様のロジック。
 *
 * @param dataUrl - base64 エンコードされた DataURL 文字列
 * @param userId - 保存先サブディレクトリに使うユーザー ID
 * @param mimeTypeHint - MIME タイプのヒント（DataURL から取得できない場合のフォールバック）
 * @returns 保存結果のメタデータ
 */
export async function saveImageFromDataUrl(
  dataUrl: string,
  userId: string,
  mimeTypeHint?: string
): Promise<SavedImageInfo> {
  const dateStr = todayDateStr();
  const subDir = path.join(userId, dateStr);
  await ensurePhotosDir(subDir);

  // DataURL を分割: "data:image/png;base64,iVBOR..."
  const commaIndex = dataUrl.indexOf(",");
  const header = dataUrl.substring(0, commaIndex);
  const base64Data = dataUrl.substring(commaIndex + 1);

  // ヘッダーから MIME タイプを抽出
  const mimeMatch = header.match(/data:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : mimeTypeHint || "image/png";

  const buffer = Buffer.from(base64Data, "base64");

  const id = createId();
  const ext = mimeToExt(mimeType);
  const filename = path.join(subDir, `${id}.${ext}`);
  const filePath = path.join(PHOTOS_DIR, filename);

  await fs.writeFile(filePath, buffer);

  return {
    id,
    filename,
    mimeType,
    fileSize: buffer.length,
  };
}

/**
 * 画像ファイルをディスクから削除する
 *
 * @param filename - 削除するファイル名（{id}.{ext}）
 * @returns 削除成功なら true、ファイルが存在しない場合は false
 */
export async function deleteImageFile(filename: string): Promise<boolean> {
  const filePath = path.join(PHOTOS_DIR, filename);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 画像ファイルのフルパスを取得する
 *
 * @param filename - ファイル名（{id}.{ext}）
 * @returns ファイルのフルパス。存在しない場合は null
 */
export async function getImageFilePath(
  filename: string
): Promise<string | null> {
  const filePath = path.join(PHOTOS_DIR, filename);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}
