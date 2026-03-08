/**
 * NextAuth.js v5 設定ファイル
 *
 * Google OAuth 2.0 プロバイダを使用した認証設定。
 * Phase 7 では JWT セッションのみ（DB adapter なし）。
 * Phase 8 で Prisma adapter を追加予定。
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * NextAuth ハンドラーと認証ヘルパーをエクスポート
 *
 * - handlers: API ルートで使用する GET/POST ハンドラー
 * - auth: サーバーサイドでセッションを取得するヘルパー
 * - signIn: サーバーサイドからログインを開始するヘルパー
 * - signOut: サーバーサイドからログアウトするヘルパー
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  /**
   * 認証プロバイダ設定
   * 環境変数 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET を使用
   */
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  /**
   * セッション設定
   * JWT ストラテジーを使用（DB 不要）
   */
  session: {
    strategy: "jwt",
  },

  /**
   * カスタムページ設定
   * ログインページを /login に変更
   */
  pages: {
    signIn: "/login",
  },

  /**
   * コールバック設定
   * JWT トークンとセッションオブジェクトにユーザー ID を含める
   */
  callbacks: {
    /**
     * JWT コールバック
     * Google の sub（ユーザー固有 ID）をトークンに保持する。
     * Phase 8 で DB ユーザー ID に切り替え予定。
     * @param token - JWT トークン
     * @param user - ログイン時のみ存在するユーザー情報
     */
    jwt({ token, user }) {
      if (user) {
        // 初回ログイン時のみ: Google のユーザー ID をトークンに保存
        token.id = user.id;
      }
      return token;
    },

    /**
     * セッションコールバック
     * クライアント側で useSession() から user.id にアクセスできるようにする。
     * @param session - セッションオブジェクト
     * @param token - JWT トークン
     */
    session({ session, token }) {
      if (session.user && token.id) {
        // JWT トークンの id をセッションに反映
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
