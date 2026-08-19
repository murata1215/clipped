import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

/**
 * Google Fonts から Inter を読み込み
 * Google Keep 風のクリーンなフォント
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

/**
 * サイトのメタデータ定義（英語デフォルト）
 * クライアント側で document.title を動的に更新する
 */
export const metadata: Metadata = {
  title: "Clipped - Paste & Note",
  description: "Just Ctrl+V. A browser-based note app like Google Keep.",
  icons: {
    icon: "/logo.png",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL("https://clipped.devrelay.io"),
  openGraph: {
    title: "Clipped - Paste & Note",
    description: "Just Ctrl+V. A browser-based note app like Google Keep.",
    url: "https://clipped.devrelay.io",
    siteName: "Clipped",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipped - Paste & Note",
    description: "Just Ctrl+V. A browser-based note app like Google Keep.",
  },
};

/**
 * ルートレイアウト
 * 全ページ共通のHTMLラッパー。フォントとTailwindを適用する。
 * I18nProvider が <html lang> 属性をクライアント側で動的に設定する。
 * @param children - 各ページのコンテンツ
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
