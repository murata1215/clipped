/**
 * Notes API エンドポイント（詳細取得・更新・削除）
 *
 * 認証済みユーザーの個別メモに対する操作。
 * セッションの user.id で所有者を検証し、他ユーザーのメモにはアクセスできない。
 *
 * GET    /api/notes/{noteId} - メモ詳細取得
 * PUT    /api/notes/{noteId} - メモ更新（楽観ロック付き）
 * DELETE /api/notes/{noteId} - メモ論理削除
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 認証済みユーザーが所有するメモを取得するヘルパー
 * 認証チェック + 所有者チェック + 論理削除チェックを一括で行う。
 *
 * @param noteId - 対象メモの ID
 * @returns [note, errorResponse] - メモが見つかれば note を返す。エラー時は errorResponse を返す
 */
async function getAuthorizedNote(noteId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return [null, NextResponse.json({ error: "認証が必要です" }, { status: 401 })] as const;
  }

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      images: { orderBy: { order: "asc" } },
      noteTags: { include: { tag: true } },
    },
  });

  if (!note || note.deleted) {
    return [null, NextResponse.json({ error: "メモが見つかりません" }, { status: 404 })] as const;
  }

  if (note.userId !== session.user.id) {
    return [null, NextResponse.json({ error: "アクセス権限がありません" }, { status: 403 })] as const;
  }

  return [note, null] as const;
}

/**
 * メモデータをレスポンス用の形式に変換するヘルパー
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatNote(note: any) {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    color: note.color,
    pinned: note.pinned,
    order: note.order,
    tags: note.noteTags.map((nt: { tag: { name: string } }) => nt.tag.name),
    images: note.images.map((img: { id: string; filename: string; mimeType: string; width: number | null; height: number | null }) => ({
      id: img.id,
      filename: img.filename,
      mimeType: img.mimeType,
      width: img.width,
      height: img.height,
      url: `/api/notes/${note.id}/images/${img.id}`,
    })),
    version: note.version,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

/**
 * GET /api/notes/{noteId} - メモ詳細取得
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const { noteId } = params;
  const [note, errorResponse] = await getAuthorizedNote(noteId);
  if (errorResponse) return errorResponse;

  return NextResponse.json(formatNote(note));
}

/**
 * PUT /api/notes/{noteId} - メモ更新（楽観ロック付き）
 *
 * リクエストボディ:
 * {
 *   title?: string,
 *   body?: string,
 *   color?: string,
 *   pinned?: boolean,
 *   order?: number,
 *   tags?: string[],
 *   version: number  ← 必須（楽観ロック用、現在のバージョンを指定）
 * }
 *
 * 楽観ロック:
 *   リクエストの version と DB の version が一致しない場合は 409 Conflict を返す。
 *   更新成功時は version を +1 してレスポンスに含める。
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const { noteId } = params;
  const [note, errorResponse] = await getAuthorizedNote(noteId);
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const { title, body: noteBody, color, pinned, order, tags, version } = body;

  // 楽観ロック: version チェック
  if (version !== undefined && version !== note!.version) {
    return NextResponse.json(
      {
        error: "競合が発生しました。メモが他の場所で更新されています。",
        currentVersion: note!.version,
      },
      { status: 409 }
    );
  }

  // タグの更新: 既存のタグ紐付けを削除して再作成
  if (tags !== undefined) {
    await prisma.noteTag.deleteMany({ where: { noteId } });
    if (tags.length > 0) {
      for (const tagName of tags as string[]) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        await prisma.noteTag.create({
          data: { noteId, tagId: tag.id },
        });
      }
    }
  }

  // メモ本体を更新（version を +1）
  const updated = await prisma.note.update({
    where: { id: noteId },
    data: {
      ...(title !== undefined && { title }),
      ...(noteBody !== undefined && { body: noteBody }),
      ...(color !== undefined && { color }),
      ...(pinned !== undefined && { pinned }),
      ...(order !== undefined && { order }),
      version: { increment: 1 },
    },
    include: {
      images: { orderBy: { order: "asc" } },
      noteTags: { include: { tag: true } },
    },
  });

  return NextResponse.json(formatNote(updated));
}

/**
 * DELETE /api/notes/{noteId} - メモ論理削除
 *
 * 物理削除は行わず、deleted フラグを true に設定する。
 * レスポンス: 204 No Content
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const { noteId } = params;
  const [, errorResponse] = await getAuthorizedNote(noteId);
  if (errorResponse) return errorResponse;

  await prisma.note.update({
    where: { id: noteId },
    data: { deleted: true },
  });

  return new NextResponse(null, { status: 204 });
}
