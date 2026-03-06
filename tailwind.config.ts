import type { Config } from "tailwindcss";

/**
 * Tailwind CSS 設定
 * メモカードの背景色など、Clipped 固有のカラー定義を含む
 */
const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        /** メモカードの背景色定義 */
        note: {
          default: "#ffffff",
          yellow: "#fff9c4",
          green: "#c8e6c9",
          blue: "#bbdefb",
          pink: "#f8bbd0",
          purple: "#e1bee7",
        },
      },
    },
  },
  /**
   * メモカードの動的カラークラスを Tailwind のパージから除外するための safelist
   * NoteCard コンポーネントで bg-note-{color} を動的に適用するため必要
   */
  safelist: [
    "bg-note-default",
    "bg-note-yellow",
    "bg-note-green",
    "bg-note-blue",
    "bg-note-pink",
    "bg-note-purple",
  ],
  plugins: [],
};
export default config;
