# プロジェクト固有ルール

## データストレージ戦略

### デュアルストレージ構成
- **ログインユーザー**: PostgreSQL + Prisma（サーバーサイド DB）
- **未ログインユーザー**: localStorage（従来通り）
- フロントエンドは `session` の有無で API / localStorage を自動切り替え

### 画像ファイル保存
- 保存先: `data/photos/{userId}/{YYYYMMDD}/{imageId}.{ext}`
- DB の `Image.filename` カラムに相対パスを保存（`path.join(PHOTOS_DIR, filename)` で解決）
- 既存のフラット構造ファイル（`{id}.{ext}`）との後方互換性あり

### 画像フォーマット
- localStorage 向け画像は JPEG (quality 0.85) で保存（PNG より大幅に軽量）
- リサイズ上限: 1600px（長辺）

### API 設計方針
- 認証済みユーザー向け内部 API: `/api/notes/...`（NextAuth セッション認証）
- 外部連携 API: `/api/v1/...`（Bearer トークン認証）
- 内部 API と外部 API は独立して運用
- `/api/v1/clips`, `/api/v1/clips/{id}`, `/api/v1/photos/{id}`（EP1/EP2/EP3）は Prisma 直接クエリ。API キーはユーザー非依存のグローバル鍵のため、**全ログインユーザーのメモを横断対象**とする設計（マルチユーザー分離はしない）
- `/api/v1/sync`（EP4）のみ `lib/serverStorage.ts`（JSON ファイル）を使用。EP1〜3 とストレージ層が異なる点に注意
- ログインユーザーが `CLIPPED_API_KEY` を UI から確認できるよう `/api/settings/api-key`（セッション認証必須）を用意

### セキュリティ
- `middleware.ts` で `next-action` ヘッダー付きリクエストを一律 404 にしてブロック（Server Action 未使用のため、スキャン攻撃対策）

### 運用
- `scripts/backup.sh` で PostgreSQL + 画像を日次バックアップ、7日保持。`backups/` はリポジトリに含めない
