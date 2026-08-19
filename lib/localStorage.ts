/**
 * localStorage 操作ユーティリティ
 *
 * 未ログインユーザーのメモデータを localStorage で管理する。
 * ログイン後はサーバー側 API に切り替わるため、このモジュールは
 * 未ログイン状態でのみ使用される。
 *
 * 保存キー: "clipped_notes"
 * データ形式: LocalNote[] の JSON 文字列
 */

import { createId } from "@paralleldrive/cuid2";

// ============================================================
// 型定義
// ============================================================

/**
 * ローカル画像データ
 * 未ログイン時は base64 DataURL で localStorage に保存される。
 * localStorage の容量上限（約5MB）に注意。
 */
export type LocalImage = {
  /** 画像の一意識別子 */
  id: string;
  /** base64 エンコードされた画像データ（data:image/...;base64,...） */
  dataUrl: string;
  /** MIME タイプ（例: image/png） */
  mimeType: string;
  /** 画像の幅（px） */
  width?: number;
  /** 画像の高さ（px） */
  height?: number;
};

/**
 * ローカルメモデータ
 * localStorage に保存されるメモの型定義。
 * サーバー側の Note モデルと互換性を持つ構造。
 */
export type LocalNote = {
  /** メモの一意識別子（cuid2 で生成） */
  id: string;
  /** メモのタイトル */
  title: string;
  /** メモの本文 */
  body: string;
  /** メモの背景色（"default" | "yellow" | "green" | "blue" | "pink" | "purple"） */
  color: string;
  /** ピン留め状態 */
  pinned: boolean;
  /** 添付画像の配列（base64） */
  images: LocalImage[];
  /** タグの配列（タグ名の文字列） */
  tags: string[];
  /** 表示順序（小さいほど先頭、ドラッグ&ドロップで変更可能） */
  order: number;
  /** 作成日時（ISO8601） */
  createdAt: string;
  /** 更新日時（ISO8601） */
  updatedAt: string;
};

/**
 * メモ作成時の入力データ型
 * id, createdAt, updatedAt は自動生成されるため省略可
 */
export type CreateNoteInput = Partial<Omit<LocalNote, "id" | "createdAt" | "updatedAt">>;

/**
 * メモ更新時の入力データ型
 * 部分更新を許可するため全フィールドを Partial にする
 */
export type UpdateNoteInput = Partial<Omit<LocalNote, "id" | "createdAt" | "updatedAt">>;

// ============================================================
// 定数
// ============================================================

/** localStorage のキー名 */
const STORAGE_KEY = "clipped_notes";

/** 初回ペースト日時を記録するキー（ログイン誘導用） */
export const FIRST_PASTE_KEY = "clipped_first_paste";

/** ログイン誘導バナーを非表示にしたかどうかのキー */
export const NUDGE_DISMISSED_KEY = "clipped_nudge_dismissed";

// ============================================================
// 内部ヘルパー
// ============================================================

/**
 * localStorage から全メモデータを読み込む
 *
 * マイグレーション: order フィールドが未定義の既存ノートには、
 * 現在のソート順（pinned DESC → updatedAt DESC）に基づいて連番を割り当てる。
 * これにより、order フィールド追加前のデータとの後方互換性を維持する。
 *
 * @returns LocalNote の配列。パースに失敗した場合は空配列を返す
 */
function loadNotes(): LocalNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalNote[];

    // マイグレーション: order が未定義のノートがあれば連番を振る
    const needsMigration = parsed.some((n) => n.order === undefined || n.order === null);
    if (needsMigration) {
      // 既存のソート順（pinned DESC → updatedAt DESC）で並べてから order を割り当て
      const sorted = [...parsed].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      sorted.forEach((n, i) => {
        n.order = i;
      });
      saveNotes(sorted);
      return sorted;
    }

    return parsed;
  } catch {
    // JSON パースエラーなどの場合は空配列を返す
    return [];
  }
}

/**
 * localStorage にメモデータを保存する
 *
 * localStorage には容量上限（通常 5-10MB）があるため、
 * 大きな画像 DataURL を含むメモが増えると QuotaExceededError が発生する。
 * その場合はエラーを握りつぶさず、呼び出し元に保存失敗を通知する。
 *
 * @param notes - 保存するメモの配列
 * @returns 保存成功なら true、失敗なら false
 */
function saveNotes(notes: LocalNote[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (err) {
    // QuotaExceededError: localStorage の容量上限を超えた場合
    console.warn(
      "localStorage への保存に失敗しました。容量上限に達した可能性があります:",
      err
    );
    return false;
  }
}

/**
 * メモを標準の並び順でソートする
 * 並び順: ピン留め DESC → order ASC
 *
 * ピン留めメモとそうでないメモはそれぞれ独立した order 順で並ぶ。
 * ドラッグ&ドロップで並べ替えた順序が反映される。
 *
 * @param notes - ソート対象のメモ配列
 * @returns ソートされた新しい配列
 */
function sortNotes(notes: LocalNote[]): LocalNote[] {
  return [...notes].sort((a, b) => {
    // ピン留めメモを先頭に
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    // 同じピン状態なら更新日時の降順（新しいものが先頭）
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

// ============================================================
// 公開 API
// ============================================================

/**
 * メモ一覧を取得する
 * ピン留め DESC、更新日時 DESC でソートして返す。
 * @returns ソート済みのメモ配列
 */
export function getNotes(): LocalNote[] {
  return sortNotes(loadNotes());
}

/**
 * 指定 ID のメモを1件取得する
 * @param id - 取得するメモの ID
 * @returns 見つかったメモ、または undefined
 */
export function getNote(id: string): LocalNote | undefined {
  const notes = loadNotes();
  return notes.find((n) => n.id === id);
}

/**
 * 新規メモを作成して localStorage に保存する
 * @param input - メモの初期データ（省略されたフィールドはデフォルト値）
 * @returns 作成されたメモ
 */
export function createNote(input: CreateNoteInput = {}): LocalNote {
  const now = new Date().toISOString();
  const notes = loadNotes();

  // 新規メモの order: 既存の最小 order - 1（先頭に追加）
  // メモがない場合は 0 から開始
  const minOrder = notes.length > 0
    ? Math.min(...notes.map((n) => n.order ?? 0))
    : 1;
  const newOrder = minOrder - 1;

  const note: LocalNote = {
    id: createId(),
    title: input.title ?? "",
    body: input.body ?? "",
    color: input.color ?? "default",
    pinned: input.pinned ?? false,
    images: input.images ?? [],
    tags: input.tags ?? [],
    order: newOrder,
    createdAt: now,
    updatedAt: now,
  };

  notes.push(note);
  const saved = saveNotes(notes);

  // 保存失敗時はカスタムイベントで UI に通知
  if (!saved && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("clipped:save-error", {
        detail: { message: "メモの作成に失敗しました。ストレージの空き容量が不足しています。" },
      })
    );
  }

  return note;
}

/**
 * 指定 ID のメモを更新する
 * 存在しない ID の場合は null を返す。
 *
 * localStorage の容量超過で保存に失敗した場合は、
 * カスタムイベント "clipped:save-error" を発火してUIに通知する。
 * メモのデータ自体はメモリ上で更新されるが、永続化はされない。
 *
 * @param id - 更新するメモの ID
 * @param input - 更新するフィールド（部分更新対応）
 * @returns 更新されたメモ、または null（メモが見つからない場合）
 */
export function updateNote(id: string, input: UpdateNoteInput): LocalNote | null {
  const notes = loadNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;

  // 既存のメモに更新データをマージし、updatedAt を自動更新
  const updated: LocalNote = {
    ...notes[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  notes[index] = updated;
  const saved = saveNotes(notes);

  // 保存失敗時はカスタムイベントで UI に通知
  if (!saved && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("clipped:save-error", {
        detail: { message: "メモの保存に失敗しました。ストレージの空き容量が不足しています。" },
      })
    );
  }

  return updated;
}

/**
 * 指定 ID のメモを削除する
 * localStorage では物理削除（サーバー側とは異なり論理削除は行わない）
 * @param id - 削除するメモの ID
 * @returns 削除できた場合 true、メモが見つからない場合 false
 */
export function deleteNote(id: string): boolean {
  const notes = loadNotes();
  const filtered = notes.filter((n) => n.id !== id);

  // フィルタ結果の長さが変わっていなければ、該当IDが存在しなかった
  if (filtered.length === notes.length) return false;

  saveNotes(filtered);
  return true;
}

/**
 * メモを検索する
 * title と body の部分一致（大文字小文字無視）で AND 検索。
 * スペース区切りで複数キーワードを指定可能。
 * @param query - 検索クエリ（スペース区切りで AND 検索）
 * @returns 検索条件に一致するメモ配列（ソート済み）
 */
export function searchNotes(query: string): LocalNote[] {
  if (!query.trim()) return getNotes();

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 0);

  const notes = loadNotes();
  const matched = notes.filter((note) => {
    // タイトルと本文を結合して検索対象にする
    const searchTarget = `${note.title} ${note.body}`.toLowerCase();
    // すべてのキーワードが含まれている場合にマッチ（AND 検索）
    return keywords.every((kw) => searchTarget.includes(kw));
  });

  return sortNotes(matched);
}

/**
 * 全メモデータを削除する
 * ログイン後のデータ引き継ぎ完了時に呼び出される。
 */
export function clearNotes(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * メモの並び順を更新する
 *
 * ドラッグ&ドロップの結果を受けて、指定された ID 順に order を振り直す。
 * 配列の先頭から 0, 1, 2, ... と連番を割り当てる。
 *
 * @param orderedIds - 新しい並び順の ID 配列
 */
export function reorderNotes(orderedIds: string[]): void {
  const notes = loadNotes();
  orderedIds.forEach((id, index) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      note.order = index;
    }
  });
  saveNotes(notes);
}

/**
 * メモの総数を取得する
 * ログイン誘導（5件超）の判定に使用。
 * @returns メモの件数
 */
export function getNoteCount(): number {
  return loadNotes().length;
}
