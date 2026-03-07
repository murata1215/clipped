/**
 * クリップ一覧 API エンドポイント
 *
 * PixDraft の EP1 に対応:
 *   GET /api/v1/clips?page=1&per_page=20&search=京都
 *   Authorization: Bearer {token}
 *
 * クリップ（メモ + 画像のセット）の一覧を返す。
 * ページネーションとキーワード検索に対応。
 *
 * サムネイル URL は1枚目の画像の URL を自動生成して返す。
 */

import { NextRequest } from "next/server";
import { validateApiKey, unauthorizedResponse, serverErrorResponse } from "@/lib/apiAuth";
import { getClipList } from "@/lib/serverStorage";

/**
 * GET /api/v1/clips - クリップ一覧取得
 *
 * クエリパラメータ:
 *   page     - ページ番号（デフォルト: 1）
 *   per_page - 1ページあたり件数（デフォルト: 20、最大: 50）
 *   search   - キーワード検索（メモ内容・タイトルで部分一致）
 *
 * レスポンス:
 * {
 *   "clips": [{ id, title, memo, thumbnail_url, photo_count, created_at, updated_at }],
 *   "pagination": { page, per_page, total, total_pages }
 * }
 */
export async function GET(request: NextRequest) {
  // 認証チェック
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータをパース（不正値はデフォルトにフォールバック）
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const perPage = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("per_page") || "20", 10) || 20)
    );
    const search = searchParams.get("search");

    // ベース URL を組み立て（画像 URL 生成用）
    // basePath "/clipped" を考慮して、リクエスト URL からベースを構築
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}/clipped`;

    // クリップ一覧を取得
    const result = await getClipList(page, perPage, search, baseUrl);

    return Response.json(result);
  } catch (error) {
    console.error("[Clips API] 一覧取得エラー:", error);
    return serverErrorResponse("クリップ一覧の取得中にエラーが発生しました。");
  }
}
