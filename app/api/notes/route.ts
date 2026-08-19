/**
 * Notes API エンドポイント（一覧取得・新規作成）
 *
 * 認証済みユーザーのメモを PostgreSQL で CRUD する。
 * セッションの user.id で所有者を判別し、他ユーザーのメモにはアクセスできない。
 *
 * GET  /api/notes        - メモ一覧取得（ページネーション・検索対応）
 * POST /api/notes        - 新規メモ作成
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notes - メモ一覧取得
 *
 * クエリパラメータ:
 *   page     - ページ番号（デフォルト: 1）
 *   per_page - 1ページあたり件数（デフォルト: 50、最大: 100）
 *   search   - キーワード検索（タイトル・本文で部分一致、AND 検索）
 *
 * レスポンス:
 * {
 *   "notes": [{ id, title, body, color, pinned, order, tags, images, version, createdAt, updatedAt }],
 *   "pagination": { page, per_page, total, total_pages }
 * }
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("per_page") || "50", 10) || 50)
  );
  const search = searchParams.get("search");

  // 検索条件を構築
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    userId: session.user.id,
    deleted: false,
  };

  if (search && search.trim()) {
    const keywords = search.trim().split(/\s+/);
    where.AND = keywords.map((kw) => ({
      OR: [
        { title: { contains: kw, mode: "insensitive" } },
        { body: { contains: kw, mode: "insensitive" } },
      ],
    }));
  }

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" } },
        noteTags: { include: { tag: true } },
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.note.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage) || 1;

  return NextResponse.json({
    notes: notes.map((note) => ({
      id: note.id,
      title: note.title,
      body: note.body,
      color: note.color,
      pinned: note.pinned,
      order: note.order,
      tags: note.noteTags.map((nt) => nt.tag.name),
      images: note.images.map((img) => ({
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
    })),
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: totalPages,
    },
  });
}

/**
 * POST /api/notes - 新規メモ作成
 *
 * リクエストボディ:
 * {
 *   title?: string,
 *   body?: string,
 *   color?: string,
 *   pinned?: boolean,
 *   order?: number,
 *   tags?: string[]
 * }
 *
 * レスポンス: 作成されたメモ（201 Created）
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await request.json();
  const { title, body: noteBody, color, pinned, order, tags } = body;

  const note = await prisma.note.create({
    data: {
      userId: session.user.id,
      title: title ?? "",
      body: noteBody ?? "",
      color: color ?? "default",
      pinned: pinned ?? false,
      order: order ?? 0,
      // タグがあれば、既存タグを検索 or 新規作成して紐付け
      ...(tags && tags.length > 0
        ? {
            noteTags: {
              create: await Promise.all(
                (tags as string[]).map(async (tagName: string) => {
                  const tag = await prisma.tag.upsert({
                    where: { name: tagName },
                    update: {},
                    create: { name: tagName },
                  });
                  return { tagId: tag.id };
                })
              ),
            },
          }
        : {}),
    },
    include: {
      images: { orderBy: { order: "asc" } },
      noteTags: { include: { tag: true } },
    },
  });

  return NextResponse.json(
    {
      id: note.id,
      title: note.title,
      body: note.body,
      color: note.color,
      pinned: note.pinned,
      order: note.order,
      tags: note.noteTags.map((nt) => nt.tag.name),
      images: note.images.map((img) => ({
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
    },
    { status: 201 }
  );
}
