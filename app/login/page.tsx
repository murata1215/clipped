/**
 * ログインページ
 *
 * Google OAuth でのログインを提供するカスタムログインページ。
 * NextAuth の pages.signIn で指定されたパス（/login）に対応する。
 * ログイン済みの場合はトップページにリダイレクトする。
 */
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  /**
   * ログイン済みの場合はトップページにリダイレクト
   */
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  /** ローディング中またはリダイレクト中 */
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">{t("login.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full mx-4">
        {/* ロゴセクション */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Clipped" className="w-9 h-9" />
            <h1 className="text-3xl font-bold text-gray-800">
              {t("login.title")}
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            {t("login.tagline")}
          </p>
        </div>

        {/* ログインカード */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-4 text-center">
            {t("login.description")}
          </p>

          {/* Google ログインボタン */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3
                       bg-white border border-gray-300 rounded-lg
                       hover:bg-gray-50 transition-colors
                       text-sm font-medium text-gray-700"
          >
            {/* Google アイコン（SVG） */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("login.googleBtn")}
          </button>

          {/* 注記 */}
          <p className="text-xs text-gray-400 mt-4 text-center">
            {t("login.note")}
          </p>
        </div>

        {/* トップページに戻るリンク */}
        <div className="text-center mt-4">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t("login.skipLink")}
          </button>
        </div>

        {/* フッターリンク */}
        <div className="text-center mt-8 text-xs text-gray-400 space-x-3">
          <a href="/privacy" className="hover:text-gray-600 transition-colors">{t("footer.privacy")}</a>
          <span>|</span>
          <a href="/terms" className="hover:text-gray-600 transition-colors">{t("footer.terms")}</a>
        </div>
      </div>
    </div>
  );
}
