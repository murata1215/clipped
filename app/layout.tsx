import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
 * サイトのメタデータ定義
 * SEO とブラウザタブの表示に使用
 */
export const metadata: Metadata = {
  title: "Clipped - 貼るだけメモ",
  description: "Ctrl+V で貼るだけ。ブラウザで使える Google Keep 風メモアプリ",
};

/**
 * ルートレイアウト
 * 全ページ共通のHTMLラッパー。フォントとTailwindを適用する。
 * @param children - 各ページのコンテンツ
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
