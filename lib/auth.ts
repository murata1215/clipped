/**
 * NextAuth.js v5 設定ファイル
 *
 * Google OAuth 2.0 プロバイダを使用した認証設定。
 * Phase 8 で Prisma Adapter を追加し、ログイン時に User/Account を
 * PostgreSQL に自動保存するようにした。
 * セッションは引き続き JWT ストラテジーを使用（DB セッション不要）。
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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
   * Prisma Adapter
   * ログイン時に User, Account レコードを自動作成/更新する。
   * JWT ストラテジーと併用するため、Session テーブルは使用しない。
   */
  adapter: PrismaAdapter(prisma),

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
   * JWT ストラテジーを使用（Prisma Adapter があっても DB セッションは使わない）
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
   * JWT トークンとセッションオブジェクトに DB ユーザー ID を含める
   */
  callbacks: {
    /**
     * JWT コールバック
     * Prisma Adapter が作成した DB ユーザー ID をトークンに保持する。
     * @param token - JWT トークン
     * @param user - ログイン時のみ存在するユーザー情報（Prisma が返す User レコード）
     */
    jwt({ token, user }) {
      if (user) {
        // 初回ログイン時: Prisma が作成/取得した DB ユーザー ID をトークンに保存
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
        // JWT トークンの id（DB ユーザー ID）をセッションに反映
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
