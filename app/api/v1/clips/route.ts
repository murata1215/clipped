/**
 * クリップ一覧 API エンドポイント（Prisma ベース）
 *
 * PixDraft の EP1 に対応:
 *   GET /api/v1/clips?page=1&per_page=20&search=京都
 *   Authorization: Bearer {token}
 *
 * クリップ（メモ + 画像のセット）の一覧を返す。
 * ページネーションとキーワード検索に対応。
 * 全ログインユーザーのメモを対象（API キーはグローバル）。
 */

import { NextRequest } from "next/server";
import { validateApiKey, unauthorizedResponse, serverErrorResponse } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/clips - クリップ一覧取得
 */
export async function GET(request: NextRequest) {
  // 認証チェック
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータをパース
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const perPage = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("per_page") || "20", 10) || 20)
    );
    const search = searchParams.get("search");

    // ベース URL を組み立て（画像 URL 生成用）
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || (() => { const u = new URL(request.url); return `${u.protocol}//${u.host}`; })();

    // 検索条件を構築（全ユーザー対象、論理削除は除外）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { deleted: false };

    if (search && search.trim()) {
      const keywords = search.trim().split(/\s+/);
      where.AND = keywords.map((kw) => ({
        OR: [
          { title: { contains: kw, mode: "insensitive" } },
          { body: { contains: kw, mode: "insensitive" } },
        ],
      }));
    }

    // Prisma クエリ
    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          _count: { select: { images: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.note.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage) || 1;

    // レスポンスを v1 フォーマットに変換
    const clips = notes.map((note) => {
      const firstImage = note.images[0];
      return {
        id: note.id,
        title: note.title,
        memo: note.body,
        thumbnail_url: firstImage
          ? `${baseUrl}/api/v1/photos/${firstImage.id}`
          : null,
        photo_count: note._count.images,
        created_at: note.createdAt.toISOString(),
        updated_at: note.updatedAt.toISOString(),
      };
    });

    return Response.json({
      clips,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error("[Clips API] 一覧取得エラー:", error);
    return serverErrorResponse("クリップ一覧の取得中にエラーが発生しました。");
  }
}
