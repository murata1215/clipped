/**
 * データ同期 API エンドポイント
 *
 * クライアントの localStorage データをサーバーに同期する。
 * ブラウザの「サーバーに同期」ボタンから呼び出される。
 *
 * POST /api/v1/sync
 *   Authorization: Bearer {api_key}
 *   Content-Type: application/json
 *   Body: { "notes": [LocalNote の配列] }
 *
 * 処理内容:
 * 1. API キー認証
 * 2. リクエストボディの検証
 * 3. 画像を base64 からデコードしてファイルに保存
 * 4. メモのメタデータを clips.json に保存
 *
 * Phase 8（PostgreSQL）導入後は、このエンドポイントは不要になる
 * （メモ保存時に直接 DB に書き込まれるため）。
 */

import { NextRequest } from "next/server";
import {
  validateApiKey,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/apiAuth";
import { syncData, type SyncNoteInput } from "@/lib/serverStorage";

/**
 * POST /api/v1/sync - localStorage データをサーバーに同期
 *
 * リクエストボディ:
 * {
 *   "notes": [
 *     {
 *       "id": "xxx",
 *       "title": "...",
 *       "body": "...",
 *       "images": [{ "id": "...", "dataUrl": "data:image/...;base64,...", ... }],
 *       ...
 *     }
 *   ]
 * }
 *
 * レスポンス（成功時）:
 * {
 *   "success": true,
 *   "synced_clips": 5,
 *   "message": "5件のクリップを同期しました。"
 * }
 */
export async function POST(request: NextRequest) {
  // 認証チェック
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    // リクエストボディをパース
    const body = await request.json();

    // notes フィールドの存在確認
    if (!body.notes || !Array.isArray(body.notes)) {
      return Response.json(
        {
          error: {
            code: "BAD_REQUEST",
            message:
              "リクエストボディに notes 配列が必要です。",
          },
        },
        { status: 400 }
      );
    }

    // データ同期を実行
    const syncedCount = await syncData(body.notes as SyncNoteInput[]);

    return Response.json({
      success: true,
      synced_clips: syncedCount,
      message: `${syncedCount}件のクリップを同期しました。`,
    });
  } catch (error) {
    console.error("[Sync API] 同期エラー:", error);
    return serverErrorResponse(
      "データの同期中にエラーが発生しました。"
    );
  }
}
