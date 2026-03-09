/**
 * 画像取得・削除 API エンドポイント
 *
 * 認証済みユーザーが所有するメモの画像を取得・削除する。
 *
 * GET    /api/notes/{noteId}/images/{imageId} - 画像バイナリ取得
 * DELETE /api/notes/{noteId}/images/{imageId} - 画像削除
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getImageFilePath, deleteImageFile } from "@/lib/imageStorage";

/**
 * 認証済みユーザーが所有するメモの画像を取得するヘルパー
 *
 * @param noteId - メモ ID
 * @param imageId - 画像 ID
 * @returns [image, errorResponse] - 画像が見つかれば image を返す
 */
async function getAuthorizedImage(noteId: string, imageId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return [null, NextResponse.json({ error: "認証が必要です" }, { status: 401 })] as const;
  }

  const image = await prisma.image.findUnique({
    where: { id: imageId },
    include: { note: true },
  });

  if (!image || image.noteId !== noteId) {
    return [null, NextResponse.json({ error: "画像が見つかりません" }, { status: 404 })] as const;
  }

  if (image.note.deleted) {
    return [null, NextResponse.json({ error: "メモが見つかりません" }, { status: 404 })] as const;
  }

  if (image.note.userId !== session.user.id) {
    return [null, NextResponse.json({ error: "アクセス権限がありません" }, { status: 403 })] as const;
  }

  return [image, null] as const;
}

/**
 * GET /api/notes/{noteId}/images/{imageId} - 画像バイナリ取得
 *
 * レスポンス:
 *   200: 画像バイナリ（Content-Type 付き）
 *   401/403/404: エラー
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { noteId: string; imageId: string } }
) {
  const { noteId, imageId } = params;
  const [image, errorResponse] = await getAuthorizedImage(noteId, imageId);
  if (errorResponse) return errorResponse;

  // ディスクからファイルを読み込み
  const filePath = await getImageFilePath(image!.filename);
  if (!filePath) {
    return NextResponse.json(
      { error: "画像ファイルが見つかりません" },
      { status: 404 }
    );
  }

  const fileBuffer = await fs.readFile(filePath);

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": image!.mimeType,
      "Cache-Control": "private, max-age=604800",
    },
  });
}

/**
 * DELETE /api/notes/{noteId}/images/{imageId} - 画像削除
 *
 * ディスク上のファイルと DB の Image レコードを両方削除する。
 *
 * レスポンス:
 *   204: 削除成功
 *   401/403/404: エラー
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { noteId: string; imageId: string } }
) {
  const { noteId, imageId } = params;
  const [image, errorResponse] = await getAuthorizedImage(noteId, imageId);
  if (errorResponse) return errorResponse;

  // ディスクからファイルを削除（失敗しても DB レコードは削除する）
  await deleteImageFile(image!.filename);

  // DB レコードを削除
  await prisma.image.delete({
    where: { id: imageId },
  });

  return new NextResponse(null, { status: 204 });
}
