/**
 * NextAuth.js API ルートハンドラー
 *
 * /api/auth/* へのリクエストを NextAuth が処理する。
 * - GET /api/auth/signin → ログインページへリダイレクト
 * - POST /api/auth/signin/google → Google OAuth フロー開始
 * - GET /api/auth/callback/google → Google からのコールバック処理
 * - POST /api/auth/signout → ログアウト処理
 * - GET /api/auth/session → 現在のセッション情報取得
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
