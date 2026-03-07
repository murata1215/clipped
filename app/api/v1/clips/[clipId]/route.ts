/**
 * クリップ詳細 API エンドポイント
 *
 * PixDraft の EP2 に対応:
 *   GET /api/v1/clips/{clip_id}
 *   Authorization: Bearer {token}
 *
 * 指定されたクリップの詳細情報（メモ + 全画像 URL）を返す。
 * PixDraft はこのレスポンスの photos[].url から画像をダウンロードする。
 */

import { NextRequest } from "next/server";
import {
  validateApiKey,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/apiAuth";
import { getClipDetail } from "@/lib/serverStorage";

/**
 * GET /api/v1/clips/{clipId} - クリップ詳細取得
 *
 * パスパラメータ:
 *   clipId - クリップの一意識別子
 *
 * レスポンス:
 * {
 *   "id": "xxx",
 *   "title": "...",
 *   "memo": "...",
 *   "photos": [{ id, filename, url, mime_type, width, height }],
 *   "created_at": "2026-03-07T10:00:00Z"
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clipId: string } }
) {
  // 認証チェック
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const { clipId } = params;

    // ベース URL を組み立て（画像 URL 生成用）
    // CLIPPED_PUBLIC_URL 環境変数を優先使用（Apache reverse proxy 背後では
    // request.url が localhost:3200 になるため、外部向け URL を環境変数で指定）
    const baseUrl = process.env.CLIPPED_PUBLIC_URL
      || (() => { const u = new URL(request.url); return `${u.protocol}//${u.host}/clipped`; })();

    // クリップ詳細を取得
    const clip = await getClipDetail(clipId, baseUrl);

    if (!clip) {
      return notFoundResponse("クリップ", clipId);
    }

    return Response.json(clip);
  } catch (error) {
    console.error("[Clips API] 詳細取得エラー:", error);
    return serverErrorResponse("クリップ詳細の取得中にエラーが発生しました。");
  }
}
