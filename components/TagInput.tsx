"use client";

import { useState, useRef } from "react";

/**
 * TagInput コンポーネントのプロパティ
 */
type TagInputProps = {
  /** 現在のタグ配列 */
  tags: string[];
  /** タグ変更時のコールバック（追加・削除後の新しい配列を渡す） */
  onChange: (tags: string[]) => void;
};

/**
 * TagInput コンポーネント
 *
 * NoteModal 内でタグを追加・削除するための入力 UI。
 * - テキスト入力 → Enter またはカンマで確定
 * - 既存タグは chips として表示（×ボタンで削除）
 * - 重複タグは追加しない
 * - 空文字は無視
 */
export default function TagInput({ tags, onChange }: TagInputProps) {
  /** 入力中のテキスト */
  const [input, setInput] = useState("");
  /** input 要素の ref（フォーカス制御用） */
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * タグを追加する
   * 空文字・重複は無視。追加後に入力欄をクリアする。
   * @param value - 追加するタグ名
   */
  const addTag = (value: string) => {
    const trimmed = value.trim();
    // 空文字または既に存在するタグは追加しない
    if (!trimmed || tags.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange([...tags, trimmed]);
    setInput("");
  };

  /**
   * タグを削除する
   * @param tagToRemove - 削除するタグ名
   */
  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  /**
   * キーボードイベントハンドラ
   * Enter でタグ確定、Backspace で最後のタグ削除（入力欄が空の場合）
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Enter でフォーム送信を防ぎ、タグを追加
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      // 入力欄が空の状態で Backspace → 最後のタグを削除
      removeTag(tags[tags.length - 1]);
    }
  };

  /**
   * 入力変更ハンドラ
   * カンマが含まれていたらタグを確定する
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // カンマが入力されたらカンマの前の部分をタグとして追加
    if (value.includes(",")) {
      const parts = value.split(",");
      // 最後の要素以外をタグとして追加
      parts.slice(0, -1).forEach((part) => addTag(part));
      // 最後の要素（カンマの後）を入力欄に残す
      setInput(parts[parts.length - 1]);
    } else {
      setInput(value);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-[32px] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* タグ chips */}
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 px-2 py-0.5
                     bg-gray-100 text-gray-600 text-xs rounded-full"
        >
          {tag}
          {/* 削除ボタン */}
          <button
            className="ml-0.5 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}

      {/* タグ入力欄 */}
      <input
        ref={inputRef}
        type="text"
        placeholder={tags.length === 0 ? "タグを追加..." : ""}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // フォーカスが外れたときも入力中のテキストをタグとして追加
          if (input.trim()) addTag(input);
        }}
        className="flex-1 min-w-[80px] text-xs text-gray-600
                   placeholder-gray-400 outline-none bg-transparent"
      />
    </div>
  );
}
