/**
 * OGP画像（Open Graph Protocol）
 *
 * Next.js の規約ベースファイルにより、ビルド時に自動的に
 * /opengraph-image として PNG 画像を生成し、<meta property="og:image"> に注入される。
 *
 * サイズ: 1200 x 630 px（OGP 推奨サイズ）
 * デザイン: 白背景、ロゴ + タイトル + サブタイトル（ミニマル）
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        {/* ロゴ風アイコン（CSSで再現） */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            backgroundColor: "#111111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            C
          </span>
        </div>

        {/* タイトル */}
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#111111",
            marginBottom: 16,
          }}
        >
          Clipped
        </span>

        {/* サブタイトル */}
        <span
          style={{
            fontSize: 28,
            color: "#666666",
            marginBottom: 8,
          }}
        >
          Paste &amp; Note
        </span>

        {/* 説明 */}
        <span
          style={{
            fontSize: 22,
            color: "#999999",
          }}
        >
          Just Ctrl+V. Screenshot &amp; memo app.
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
