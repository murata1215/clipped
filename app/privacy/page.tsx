/**
 * プライバシーポリシーページ
 *
 * Google OAuth 本番審査用の法的ページ。
 * 多言語対応（I18nProvider のロケールに連動）。
 */
"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { privacyContent } from "@/locales/legal/privacy";

export default function PrivacyPage() {
  const { locale } = useI18n();
  const content = privacyContent[locale];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー（シンプル版） */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Clipped" className="w-6 h-6" />
            <span className="text-lg font-bold">Clipped</span>
          </Link>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h1>
        <p className="text-sm text-gray-500 mb-8">{content.lastUpdated}</p>

        <div className="space-y-6">
          {content.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{section.heading}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{section.body}</p>
            </section>
          ))}
        </div>

        {/* フッターリンク */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex gap-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-700 transition-colors">
            Terms of Service
          </Link>
          <Link href="/" className="hover:text-gray-700 transition-colors">
            ← Back to Clipped
          </Link>
        </div>
      </main>
    </div>
  );
}
