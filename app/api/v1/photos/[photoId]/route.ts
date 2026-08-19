/**
 * 画像ダウンロード API エンドポイント（Prisma ベース）
 *
 * PixDraft の EP3 に対応:
 *   GET /api/v1/photos/{photo_id}
 *   Authorization: Bearer {token}
 *
 * 指定された画像のバイナリデータを返す。
 * Prisma で Image レコードを検索し、ディスクからファイルを読み取る。
 */

import { NextRequest } from "next/server";
import fs from "fs/promises";
import {
  validateApiKey,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getImageFilePath } from "@/lib/imageStorage";

/**
 * GET /api/v1/photos/{photoId} - 画像バイナリダウンロード
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

    // Prisma で Image レコードを検索
    const image = await prisma.image.findUnique({
      where: { id: photoId },
      include: { note: true },
    });

    if (!image || image.note.deleted) {
      return notFoundResponse("画像", photoId);
    }

    // ディスクから画像ファイルを読み込み
    const filePath = await getImageFilePath(image.filename);
    if (!filePath) {
      return notFoundResponse("画像ファイル", photoId);
    }

    const fileBuffer = await fs.readFile(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("[Photos API] 画像取得エラー:", error);
    return serverErrorResponse("画像の取得中にエラーが発生しました。");
  }
}
