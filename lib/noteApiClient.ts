/**
 * Notes API クライアント
 *
 * /api/notes エンドポイントへの fetch ラッパー。
 * useNoteService() hook から呼び出される。
 * セッション Cookie が自動送信されるため、認証ヘッダーの手動設定は不要。
 */

// ============================================================
// 型定義
// ============================================================

/**
 * API レスポンスの画像データ型
 */
export type ApiImage = {
  id: string;
  filename: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  url: string;
};

/**
 * API レスポンスのメモデータ型
 */
export type ApiNote = {
  id: string;
  title: string;
  body: string;
  color: string;
  pinned: boolean;
  order: number;
  tags: string[];
  images: ApiImage[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * メモ一覧 API レスポンス型
 */
type NotesListResponse = {
  notes: ApiNote[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

/**
 * メモ作成・更新リクエスト型
 */
export type NoteInput = {
  title?: string;
  body?: string;
  color?: string;
  pinned?: boolean;
  order?: number;
  tags?: string[];
  version?: number;
};

// ============================================================
// API クライアント関数
// ============================================================

/**
 * メモ一覧を取得する
 *
 * @param search - 検索クエリ（省略時は全件取得）
 * @returns メモの配列
 */
export async function fetchNotes(search?: string): Promise<ApiNote[]> {
  const params = new URLSearchParams({ per_page: "200" });
  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const res = await fetch(`/api/notes?${params}`);
  if (!res.ok) {
    throw new Error(`メモ一覧の取得に失敗しました: ${res.status}`);
  }

  const data: NotesListResponse = await res.json();
  return data.notes;
}

/**
 * メモを新規作成する
 *
 * @param input - メモの初期データ
 * @returns 作成されたメモ
 */
export async function createNoteApi(input: NoteInput): Promise<ApiNote> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`メモの作成に失敗しました: ${res.status}`);
  }

  return res.json();
}

/**
 * メモを更新する（楽観ロック付き）
 *
 * @param id - 更新するメモの ID
 * @param input - 更新するフィールド（version を含む）
 * @returns 更新されたメモ
 */
export async function updateNoteApi(
  id: string,
  input: NoteInput
): Promise<ApiNote> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (res.status === 409) {
    throw new Error("競合が発生しました。ページをリロードしてください。");
  }

  if (!res.ok) {
    throw new Error(`メモの更新に失敗しました: ${res.status}`);
  }

  return res.json();
}

/**
 * メモを論理削除する
 *
 * @param id - 削除するメモの ID
 */
export async function deleteNoteApi(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`メモの削除に失敗しました: ${res.status}`);
  }
}

/**
 * 画像をアップロードする
 *
 * @param noteId - 画像を追加するメモの ID
 * @param file - アップロードする画像ファイル
 * @returns アップロードされた画像情報の配列
 */
export async function uploadImageApi(
  noteId: string,
  file: File | Blob
): Promise<ApiImage[]> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/notes/${noteId}/images`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`画像のアップロードに失敗しました: ${res.status}`);
  }

  const data = await res.json();
  return data.images;
}

/**
 * 画像を削除する
 *
 * @param noteId - メモの ID
 * @param imageId - 削除する画像の ID
 */
export async function deleteImageApi(
  noteId: string,
  imageId: string
): Promise<void> {
  const res = await fetch(`/api/notes/${noteId}/images/${imageId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`画像の削除に失敗しました: ${res.status}`);
  }
}

/**
 * 複数メモの order を一括更新する（並べ替え用）
 *
 * バッチ API がないため、個別に PUT を送信する。
 * Promise.all で並列実行して高速化。
 *
 * @param orderedIds - 新しい並び順の ID 配列
 * @param versionMap - 各メモの version マップ
 */
export async function reorderNotesApi(
  orderedIds: string[],
  versionMap: Map<string, number>
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: index,
          version: versionMap.get(id),
        }),
      })
    )
  );
}
