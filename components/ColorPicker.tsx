"use client";

/**
 * ColorPicker コンポーネントのプロパティ
 */
type ColorPickerProps = {
  /** 現在選択中のカラー値 */
  value: string;
  /** カラー変更時のコールバック */
  onChange: (color: string) => void;
};

/**
 * メモカードの背景色定義
 * value: localStorage / DB に保存する値
 * label: ツールチップに表示する日本語名
 * bg: プレビュー用の Tailwind 背景色クラス
 * ring: 選択時のリング色
 */
const COLORS = [
  { value: "default", label: "デフォルト", bg: "bg-white", ring: "ring-gray-400" },
  { value: "yellow", label: "黄色", bg: "bg-note-yellow", ring: "ring-yellow-500" },
  { value: "green", label: "緑", bg: "bg-note-green", ring: "ring-green-500" },
  { value: "blue", label: "青", bg: "bg-note-blue", ring: "ring-blue-500" },
  { value: "pink", label: "ピンク", bg: "bg-note-pink", ring: "ring-pink-500" },
  { value: "purple", label: "紫", bg: "bg-note-purple", ring: "ring-purple-500" },
];

/**
 * ColorPicker コンポーネント
 *
 * メモの背景色を6色から選択するカラーピッカー。
 * NoteModal のフッター部分に配置される。
 * 選択中のカラーにはチェックマークとリングを表示。
 */
export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2">
      {COLORS.map((color) => {
        /** 現在選択中かどうか */
        const isSelected = value === color.value;

        return (
          <button
            key={color.value}
            title={color.label}
            className={`w-7 h-7 rounded-full border border-gray-300
                        flex items-center justify-center
                        transition-all ${color.bg}
                        ${isSelected ? `ring-2 ${color.ring}` : "hover:ring-2 hover:ring-gray-300"}`}
            onClick={() => onChange(color.value)}
          >
            {/* 選択中はチェックマークを表示 */}
            {isSelected && (
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
