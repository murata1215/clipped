/**
 * Twitter Card 画像
 *
 * opengraph-image.tsx と同じデザインを再利用。
 * Next.js が自動的に <meta name="twitter:image"> に注入する。
 */
export { default, size, contentType } from "./opengraph-image";

export const runtime = "edge";
