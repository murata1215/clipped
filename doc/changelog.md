# Changelog

## 2026-03-14: 画像ストレージ ディレクトリ構造改善

### 概要
画像ファイルの保存先をフラット構造からユーザーID/日付ベースのディレクトリ構造に変更。大量の画像ファイルが1ディレクトリに溜まる問題を解消。

### 変更後の構造
```
data/photos/{userId}/{YYYYMMDD}/{imageId}.{ext}
```

### 更新ファイル
- `lib/imageStorage.ts` — `saveImageFile(file, userId)` に userId 引数を追加、日付サブディレクトリ自動作成
- `app/api/notes/[noteId]/images/route.ts` — `saveImageFile` 呼び出しに `session.user.id` を渡すよう変更

### 互換性
- DB の `filename` カラムに相対パスを保存するため、既存の `{id}.{ext}` 形式のファイルもそのまま動作

## 2026-03-14: Phase 8-10 — PostgreSQL + Prisma 移行

### 概要
データ保存を localStorage / JSON ファイルから PostgreSQL + Prisma に移行。ログインユーザーはサーバーサイド DB にメモ・画像を保存、未ログインユーザーは従来通り localStorage を使用するデュアルストレージ構成。

### 新規ファイル
- `prisma/schema.prisma` — DB スキーマ（User, Account, Session, Note, Image, Tag テーブル）
- `lib/prisma.ts` — Prisma クライアントシングルトン
- `lib/noteService.ts` — サーバーサイド CRUD サービス（Prisma 経由）
- `lib/noteApiClient.ts` — フロントエンド API クライアント（fetch ラッパー）
- `lib/imageStorage.ts` — 画像ファイル保存/削除/パス取得
- `app/api/notes/route.ts` — メモ一覧 GET / 新規作成 POST
- `app/api/notes/[noteId]/route.ts` — メモ詳細 GET / 更新 PUT / 削除 DELETE
- `app/api/notes/[noteId]/images/route.ts` — 画像アップロード POST
- `app/api/notes/[noteId]/images/[imageId]/route.ts` — 画像取得 GET / 削除 DELETE

### 更新ファイル
- `app/page.tsx` — ログイン時は API 経由で DB 操作、未ログイン時は localStorage
- `components/NoteModal.tsx` — API 経由の自動保存・画像アップロードに対応
- `components/PasteHandler.tsx` — API 経由のメモ作成に対応
- `lib/auth.ts` — Prisma Adapter 統合、JWT に userId を含める
- `package.json` — @prisma/client, prisma, @auth/prisma-adapter 追加

### 環境変数（.env.local に追加）
- `DATABASE_URL` — PostgreSQL 接続文字列

## 2026-03-09: Phase 7 — Google OAuth 認証

### 概要
NextAuth.js v5 + Google OAuth を導入。JWT セッション（DB なし）でログイン/ログアウト/セッション管理を実装。

### 新規ファイル
- `lib/auth.ts` — NextAuth v5 設定（Google プロバイダ、JWT コールバック）
- `app/api/auth/[...nextauth]/route.ts` — NextAuth API ハンドラー
- `components/AuthProvider.tsx` — SessionProvider ラッパー（Client Component）
- `app/login/page.tsx` — カスタムログインページ（Google ログインボタン）

### 更新ファイル
- `app/layout.tsx` — AuthProvider で children をラップ
- `components/Header.tsx` — useSession でログイン状態表示（アバター/ユーザー名/ログアウト）
- `components/LoginNudge.tsx` — ログイン済みならバナー非表示
- `package.json` — next-auth@5.0.0-beta.30 追加

### 環境変数（.env.local に追加）
- `AUTH_SECRET` — セッション暗号化キー
- `AUTH_URL` — NextAuth ベース URL
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth 認証情報（既存）

## 2026-03-08: DevRelay Agreement v4 適用

### 概要
DevRelay ルールを CLAUDE.md から `rules/devrelay.md` に分離し、ドキュメント構造を整理。

### 変更内容
- `rules/devrelay.md` を新規作成（v4 全文）
- `rules/project.md` を新規作成（プロジェクト固有ルールの空テンプレート）
- `doc/changelog.md` を新規作成（本ファイル）
- `CLAUDE.md` から旧 v3 ブロック（36行）を削除し、参照マーカー（3行）に置き換え
- `README.md` にドキュメント構成セクションを追加
