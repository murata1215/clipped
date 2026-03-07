/**
 * API 認証ユーティリティ
 *
 * 外部サービス（PixDraft 等）からの API リクエストを認証するための
 * ヘルパー関数を提供する。
 *
 * 現在は静的 API キー方式（要望書の案B）を採用:
 * - 環境変数 `CLIPPED_API_KEY` にキーを設定
 * - リクエスト時: `Authorization: Bearer {api_key}`
 *
 * 将来的には:
 * - Phase 7 (Google OAuth) 導入後: JWT 検証に移行可能
 * - 複数アプリ対応: DB で API キーを管理
 */

// ============================================================
// API キー検証
// ============================================================

/**
 * リクエストの Authorization ヘッダーから API キーを検証する
 *
 * Bearer トークン形式のみ受け付ける:
 *   Authorization: Bearer {api_key}
 *
 * 環境変数 `CLIPPED_API_KEY` が未設定の場合は常に認証失敗とする
 * （セキュリティ上、キー未設定での API 公開を防止）
 *
 * @param request - 検証対象の HTTP リクエスト
 * @returns 認証成功なら true、失敗なら false
 */
export function validateApiKey(request: Request): boolean {
  // 環境変数から API キーを取得
  const expectedKey = process.env.CLIPPED_API_KEY;

  // API キーが未設定の場合は常に拒否（安全側に倒す）
  if (!expectedKey) {
    console.warn(
      "[API Auth] CLIPPED_API_KEY が未設定です。API は利用できません。"
    );
    return false;
  }

  // Authorization ヘッダーを取得
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  // "Bearer " プレフィックスの確認
  if (!authHeader.startsWith("Bearer ")) return false;

  // トークン部分を抽出して照合
  const token = authHeader.slice(7);
  return token === expectedKey;
}

// ============================================================
// レスポンス生成ヘルパー
// ============================================================

/**
 * 認証失敗時の 401 Unauthorized レスポンスを生成する
 * @returns 401 レスポンス
 */
export function unauthorizedResponse(): Response {
  return Response.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message:
          "認証に失敗しました。有効な API キーを Authorization ヘッダーに設定してください。",
      },
    },
    { status: 401 }
  );
}

/**
 * リソースが見つからない場合の 404 Not Found レスポンスを生成する
 * @param resource - リソース名（例: "クリップ", "画像"）
 * @param id - リソースの ID
 * @returns 404 レスポンス
 */
export function notFoundResponse(resource: string, id: string): Response {
  return Response.json(
    {
      error: {
        code: "NOT_FOUND",
        message: `${resource}（ID: ${id}）が見つかりません。`,
      },
    },
    { status: 404 }
  );
}

/**
 * サーバー内部エラーの 500 レスポンスを生成する
 * @param message - エラーメッセージ
 * @returns 500 レスポンス
 */
export function serverErrorResponse(message: string): Response {
  return Response.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message,
      },
    },
    { status: 500 }
  );
}
