/**
 * 画像アップロード API エンドポイント
 *
 * 認証済みユーザーが所有するメモに画像を追加する。
 * multipart/form-data で受け取り、ディスクに保存して Image レコードを作成する。
 *
 * POST /api/notes/{noteId}/images - 画像アップロード
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImageFile, MAX_IMAGES_PER_NOTE } from "@/lib/imageStorage";

/**
 * POST /api/notes/{noteId}/images - 画像アップロード
 *
 * リクエスト:
 *   Content-Type: multipart/form-data
 *   Body: file フィールドに画像ファイル（複数可）
 *
 * 制限:
 *   - 1ファイル最大 10MB
 *   - image/png, image/jpeg, image/webp, image/gif のみ
 *   - 1メモあたり最大 10 画像
 *
 * レスポンス:
 *   201: { images: [{ id, filename, mimeType, width, height, order }] }
 *   400: バリデーションエラー
 *   401: 認証エラー
 *   403: アクセス権限エラー
 *   404: メモが見つからない
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  // 認証チェック
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { noteId } = params;

  // メモの所有者チェック
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { images: true },
  });

  if (!note || note.deleted) {
    return NextResponse.json(
      { error: "メモが見つかりません" },
      { status: 404 }
    );
  }

  if (note.userId !== session.user.id) {
    return NextResponse.json(
      { error: "アクセス権限がありません" },
      { status: 403 }
    );
  }

  // multipart/form-data を解析
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "multipart/form-data 形式でリクエストしてください" },
      { status: 400 }
    );
  }

  // "file" フィールドからファイルを取得（単一 or 複数対応）
  const files = formData.getAll("file").filter(
    (entry): entry is File => entry instanceof File
  );

  if (files.length === 0) {
    return NextResponse.json(
      { error: "ファイルが指定されていません。'file' フィールドに画像を含めてください。" },
      { status: 400 }
    );
  }

  // 画像数上限チェック
  const currentCount = note.images.length;
  if (currentCount + files.length > MAX_IMAGES_PER_NOTE) {
    return NextResponse.json(
      {
        error: `画像数の上限を超えます。現在 ${currentCount} 枚、追加 ${files.length} 枚（上限 ${MAX_IMAGES_PER_NOTE} 枚）`,
      },
      { status: 400 }
    );
  }

  // 各ファイルを保存して Image レコードを作成
  const savedImages = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const info = await saveImageFile(file, session.user.id);

      // DB に Image レコードを作成
      const image = await prisma.image.create({
        data: {
          id: info.id,
          noteId,
          filename: info.filename,
          mimeType: info.mimeType,
          order: currentCount + i,
        },
      });

      savedImages.push({
        id: image.id,
        filename: image.filename,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        order: image.order,
        url: `/api/notes/${noteId}/images/${image.id}`,
      });
    } catch (err) {
      // バリデーションエラー（MIME タイプ不正、サイズ超過など）
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "画像の保存に失敗しました" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ images: savedImages }, { status: 201 });
}
