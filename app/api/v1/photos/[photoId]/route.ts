/**
 * 画像ダウンロード API エンドポイント
 *
 * PixDraft の EP3 に対応:
 *   GET /api/v1/photos/{photo_id}
 *   Authorization: Bearer {token}
 *
 * 指定された画像のバイナリデータを返す。
 * PixDraft サーバーはこの URL から直接 fetch して画像を取得する。
 *
 * レスポンス:
 *   Content-Type: image/png（等、画像の MIME タイプ）
 *   Body: 画像バイナリデータ
 *
 * 将来的な拡張:
 *   - ?w=400 のようなリサイズパラメータ対応（sharp 導入後）
 *   - ?token=xxx の署名付き URL（認証不要のダウンロード）
 */

import { NextRequest } from "next/server";
import fs from "fs/promises";
import {
  validateApiKey,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/apiAuth";
import { getPhotoFile } from "@/lib/serverStorage";

/**
 * GET /api/v1/photos/{photoId} - 画像バイナリダウンロード
 *
 * パスパラメータ:
 *   photoId - 画像の一意識別子
 *
 * レスポンス:
 *   成功時: 画像バイナリ（Content-Type 付き）
 *   失敗時: JSON エラーレスポンス
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  // 認証チェック
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const { photoId } = params;

    // 画像ファイルのパスと MIME タイプを取得
    const result = await getPhotoFile(photoId);

    if (!result) {
      return notFoundResponse("画像", photoId);
    }

    const [filePath, mimeType] = result;

    // 画像ファイルを読み込んでバイナリレスポンスを返す
    const fileBuffer = await fs.readFile(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        // キャッシュ設定: 画像は同期で更新されるため、短めの maxAge
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("[Photos API] 画像取得エラー:", error);
    return serverErrorResponse("画像の取得中にエラーが発生しました。");
  }
}
