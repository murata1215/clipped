"use client";

/**
 * AuthProvider コンポーネント
 *
 * NextAuth の SessionProvider をラップするクライアントコンポーネント。
 * app/layout.tsx（Server Component）から呼び出して、
 * 全ページで useSession() を使えるようにする。
 *
 * @param children - 子コンポーネント（アプリケーション全体）
 */
import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
