/**
 * サーバーサイドストレージユーティリティ
 *
 * localStorage のデータをサーバーのファイルシステムに保存・取得する。
 * クリップ（メモ + 画像）のデータをJSON ファイルと画像ファイルで管理する。
 *
 * ストレージ構造:
 *   data/
 *   ├── clips.json          ← クリップ（メモ）のメタデータ配列
 *   └── photos/
 *       ├── {imageId}.png   ← base64 デコード後の画像ファイル
 *       ├── {imageId}.jpg
 *       └── ...
 *
 * Phase 8（PostgreSQL + Prisma）導入後は、このモジュールを
 * Prisma クエリに差し替えることで移行可能。
 * API エンドポイント側の変更は不要。
 */

import fs from "fs/promises";
import path from "path";

// ============================================================
// 型定義
// ============================================================

/**
 * サーバーに保存されるクリップの画像データ
 * ファイルシステムに保存した画像のメタデータ
 */
export type ServerPhoto = {
  /** 画像の一意識別子（クライアント側の LocalImage.id に対応） */
  id: string;
  /** 元のファイル名（拡張子付き、例: "image.png"） */
  filename: string;
  /** MIME タイプ（例: "image/png", "image/jpeg"） */
  mimeType: string;
  /** 画像の幅（px）。不明な場合は undefined */
  width?: number;
  /** 画像の高さ（px）。不明な場合は undefined */
  height?: number;
};

/**
 * サーバーに保存されるクリップのメタデータ
 * クライアント側の LocalNote に対応する
 */
export type ServerClip = {
  /** クリップの一意識別子（クライアント側の LocalNote.id に対応） */
  id: string;
  /** クリップのタイトル */
  title: string;
  /** メモ本文（プレーンテキスト） */
  memo: string;
  /** クリップの背景色 */
  color: string;
  /** ピン留め状態 */
  pinned: boolean;
  /** タグ一覧 */
  tags: string[];
  /** 添付画像のメタデータ配列 */
  photos: ServerPhoto[];
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 更新日時（ISO 8601） */
  updatedAt: string;
};

/**
 * 同期 API で受け取るメモデータ（クライアントの LocalNote 互換）
 * base64 DataURL を含む画像データを持つ
 */
export type SyncNoteInput = {
  id: string;
  title: string;
  body: string;
  color: string;
  pinned: boolean;
  images: {
    id: string;
    dataUrl: string;
    mimeType: string;
    width?: number;
    height?: number;
  }[];
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * クリップ一覧 API のレスポンス型
 */
export type ClipListResponse = {
  clips: {
    id: string;
    title: string;
    memo: string;
    thumbnail_url: string | null;
    photo_count: number;
    created_at: string;
    updated_at: string;
  }[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

/**
 * クリップ詳細 API のレスポンス型
 */
export type ClipDetailResponse = {
  id: string;
  title: string;
  memo: string;
  photos: {
    id: string;
    filename: string;
    url: string;
    mime_type: string;
    width?: number;
    height?: number;
  }[];
  created_at: string;
};

// ============================================================
// 定数
// ============================================================

/** データディレクトリのパス */
const DATA_DIR = path.join(process.cwd(), "data");

/** クリップメタデータの JSON ファイルパス */
const CLIPS_FILE = path.join(DATA_DIR, "clips.json");

/** 画像ファイルの保存ディレクトリパス */
const PHOTOS_DIR = path.join(DATA_DIR, "photos");

// ============================================================
// 内部ヘルパー
// ============================================================

/**
 * データディレクトリとサブディレクトリの存在を保証する
 * 初回アクセス時にディレクトリがなければ作成する
 */
async function ensureDirectories(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(PHOTOS_DIR, { recursive: true });
}

/**
 * clips.json からクリップデータを読み込む
 *
 * ファイルが存在しない場合は空配列を返す。
 * JSON パースに失敗した場合もエラーを握りつぶして空配列を返す
 * （壊れたデータで API が完全に停止するのを防ぐ）。
 *
 * @returns サーバーに保存されているクリップの配列
 */
async function loadClips(): Promise<ServerClip[]> {
  try {
    const raw = await fs.readFile(CLIPS_FILE, "utf-8");
    return JSON.parse(raw) as ServerClip[];
  } catch {
    // ファイルが存在しないか、JSON パースに失敗した場合
    return [];
  }
}

/**
 * クリップデータを clips.json に保存する
 *
 * @param clips - 保存するクリップの配列
 */
async function saveClips(clips: ServerClip[]): Promise<void> {
  await ensureDirectories();
  await fs.writeFile(CLIPS_FILE, JSON.stringify(clips, null, 2), "utf-8");
}

/**
 * MIME タイプからファイル拡張子を取得する
 *
 * 対応形式: JPEG, PNG, WebP, GIF
 * 不明な場合は "bin" を返す
 *
 * @param mimeType - MIME タイプ（例: "image/png"）
 * @returns ファイル拡張子（ドットなし、例: "png"）
 */
function mimeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] || "bin";
}

/**
 * base64 DataURL を解析して MIME タイプとバイナリデータを取得する
 *
 * DataURL 形式: "data:{mimeType};base64,{base64Data}"
 *
 * @param dataUrl - base64 エンコードされた DataURL 文字列
 * @returns [MIMEタイプ, Bufferバイナリデータ] のタプル
 */
function parseDataUrl(dataUrl: string): [string, Buffer] {
  // "data:image/png;base64,iVBOR..." を分割
  const commaIndex = dataUrl.indexOf(",");
  const header = dataUrl.substring(0, commaIndex);
  const base64Data = dataUrl.substring(commaIndex + 1);

  // ヘッダーから MIME タイプを抽出: "data:image/png;base64"
  const mimeMatch = header.match(/data:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

  // base64 文字列を Buffer に変換
  const buffer = Buffer.from(base64Data, "base64");

  return [mimeType, buffer];
}

// ============================================================
// 公開 API
// ============================================================

/**
 * クライアントの localStorage データをサーバーに同期する
 *
 * 処理フロー:
 * 1. 全メモの画像を base64 からデコードしてファイルに保存
 * 2. メモのメタデータを clips.json に保存
 * 3. 不要になった画像ファイルをクリーンアップ
 *
 * 全件置き換え方式: 既存データを全て削除してから保存し直す。
 * 差分同期は Phase 8（PostgreSQL）で実装予定。
 *
 * @param notes - クライアントから送信されたメモデータの配列
 * @returns 同期されたクリップ数
 */
export async function syncData(notes: SyncNoteInput[]): Promise<number> {
  await ensureDirectories();

  /** 今回保存する画像ファイル名のセット（クリーンアップ用） */
  const savedPhotoFiles = new Set<string>();

  /** 変換後のクリップデータ */
  const clips: ServerClip[] = [];

  for (const note of notes) {
    /** このクリップの画像メタデータ */
    const photos: ServerPhoto[] = [];

    for (const image of note.images) {
      // base64 DataURL を解析
      const [mimeType, buffer] = parseDataUrl(image.dataUrl);
      const ext = mimeToExtension(mimeType);

      // ファイル名: {imageId}.{ext}
      const filename = `${image.id}.${ext}`;
      const filePath = path.join(PHOTOS_DIR, filename);

      // 画像ファイルをディスクに書き込み
      await fs.writeFile(filePath, buffer);
      savedPhotoFiles.add(filename);

      photos.push({
        id: image.id,
        filename,
        mimeType: image.mimeType || mimeType,
        width: image.width,
        height: image.height,
      });
    }

    clips.push({
      id: note.id,
      title: note.title,
      memo: note.body,
      color: note.color,
      pinned: note.pinned,
      tags: note.tags,
      photos,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  }

  // クリップメタデータを JSON ファイルに保存
  await saveClips(clips);

  // 不要な画像ファイルを削除（今回の同期で保存されなかったファイル）
  try {
    const existingFiles = await fs.readdir(PHOTOS_DIR);
    for (const file of existingFiles) {
      if (!savedPhotoFiles.has(file)) {
        await fs.unlink(path.join(PHOTOS_DIR, file));
      }
    }
  } catch {
    // readdir 失敗時は無視（ディレクトリが空の場合など）
  }

  return clips.length;
}

/**
 * クリップ一覧を取得する（ページネーション・検索対応）
 *
 * PixDraft の EP1 に対応:
 *   GET /api/v1/clips?page=1&per_page=20&search=京都
 *
 * @param page - ページ番号（1始まり）
 * @param perPage - 1ページあたりの件数（最大50）
 * @param search - 検索クエリ（メモ内容・タイトルで部分一致検索）
 * @param baseUrl - 画像 URL 生成用のベース URL
 * @returns クリップ一覧とページネーション情報
 */
export async function getClipList(
  page: number,
  perPage: number,
  search: string | null,
  baseUrl: string
): Promise<ClipListResponse> {
  let clips = await loadClips();

  // 検索フィルタ: タイトルとメモ本文で部分一致（AND 検索）
  if (search && search.trim()) {
    const keywords = search
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 0);

    clips = clips.filter((clip) => {
      const target = `${clip.title} ${clip.memo}`.toLowerCase();
      return keywords.every((kw) => target.includes(kw));
    });
  }

  // 日付の降順でソート（新しいものが先頭）
  clips.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // ページネーション計算
  const total = clips.length;
  const totalPages = Math.ceil(total / perPage) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * perPage;
  const pageClips = clips.slice(startIndex, startIndex + perPage);

  return {
    clips: pageClips.map((clip) => ({
      id: clip.id,
      title: clip.title,
      memo: clip.memo,
      // サムネイル: 1枚目の画像の URL（なければ null）
      thumbnail_url:
        clip.photos.length > 0
          ? `${baseUrl}/api/v1/photos/${clip.photos[0].id}`
          : null,
      photo_count: clip.photos.length,
      created_at: clip.createdAt,
      updated_at: clip.updatedAt,
    })),
    pagination: {
      page: safePage,
      per_page: perPage,
      total,
      total_pages: totalPages,
    },
  };
}

/**
 * クリップ詳細を取得する（画像 URL 付き）
 *
 * PixDraft の EP2 に対応:
 *   GET /api/v1/clips/{clip_id}
 *
 * @param clipId - 取得するクリップの ID
 * @param baseUrl - 画像 URL 生成用のベース URL
 * @returns クリップ詳細データ。見つからない場合は null
 */
export async function getClipDetail(
  clipId: string,
  baseUrl: string
): Promise<ClipDetailResponse | null> {
  const clips = await loadClips();
  const clip = clips.find((c) => c.id === clipId);

  if (!clip) return null;

  return {
    id: clip.id,
    title: clip.title,
    memo: clip.memo,
    photos: clip.photos.map((photo) => ({
      id: photo.id,
      filename: photo.filename,
      // フルサイズ画像のダウンロード URL
      url: `${baseUrl}/api/v1/photos/${photo.id}`,
      mime_type: photo.mimeType,
      width: photo.width,
      height: photo.height,
    })),
    created_at: clip.createdAt,
  };
}

/**
 * 画像ファイルのパスとメタデータを取得する
 *
 * PixDraft の EP3 に対応:
 *   GET /api/v1/photos/{photo_id}
 *
 * 全クリップを走査して、指定 ID の画像メタデータを検索し、
 * 対応するファイルパスを返す。
 *
 * @param photoId - 取得する画像の ID
 * @returns [ファイルパス, MIMEタイプ] のタプル。見つからない場合は null
 */
export async function getPhotoFile(
  photoId: string
): Promise<[string, string] | null> {
  const clips = await loadClips();

  // 全クリップの全画像から指定 ID を検索
  for (const clip of clips) {
    for (const photo of clip.photos) {
      if (photo.id === photoId) {
        const filePath = path.join(PHOTOS_DIR, photo.filename);

        // ファイルの存在確認
        try {
          await fs.access(filePath);
          return [filePath, photo.mimeType];
        } catch {
          // ファイルが見つからない（メタデータとファイルの不整合）
          return null;
        }
      }
    }
  }

  return null;
}
