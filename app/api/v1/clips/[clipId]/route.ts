/**
 * クリップ詳細 API エンドポイント（Prisma ベース）
 *
 * PixDraft の EP2 に対応:
 *   GET /api/v1/clips/{clip_id}
 *   Authorization: Bearer {token}
 *
 * 指定されたクリップの詳細情報（メモ + 全画像 URL）を返す。
 */

import { NextRequest } from "next/server";
import {
  validateApiKey,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/clips/{clipId} - クリップ詳細取得
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

    // ベース URL を組み立て
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || (() => { const u = new URL(request.url); return `${u.protocol}//${u.host}`; })();

    // Prisma クエリ
    const note = await prisma.note.findUnique({
      where: { id: clipId },
      include: {
        images: { orderBy: { order: "asc" } },
      },
    });

    if (!note || note.deleted) {
      return notFoundResponse("クリップ", clipId);
    }

    // v1 フォーマットに変換
    return Response.json({
      id: note.id,
      title: note.title,
      memo: note.body,
      photos: note.images.map((img) => ({
        id: img.id,
        filename: img.filename,
        url: `${baseUrl}/api/v1/photos/${img.id}`,
        mime_type: img.mimeType,
        width: img.width,
        height: img.height,
      })),
      created_at: note.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[Clips API] 詳細取得エラー:", error);
    return serverErrorResponse("クリップ詳細の取得中にエラーが発生しました。");
  }
}
