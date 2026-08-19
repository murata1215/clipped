# Changelog

## 2026-08-19: v1 API の Prisma 移行 + セキュリティ強化 + 運用整備（過去セッション分の記録漏れをまとめて反映）

### 概要
これまで未コミットのまま作業ディレクトリに溜まっていた変更（2026-03〜06 頃に実施済み）をまとめてコミット。
外部連携 API（EP1/EP2/EP3）の Prisma 移行、Server Action スキャン攻撃対策、OGP/Twitter カード自動生成、
API キー参照用の設定 API、日次バックアップ運用、ペーストボタン UI などを含む。

### v1 API を serverStorage → Prisma に移行
- `app/api/v1/clips/route.ts`（EP1 一覧）/ `[clipId]/route.ts`（EP2 詳細）/ `app/api/v1/photos/[photoId]/route.ts`（EP3 画像DL）を
  JSON ファイルベースの `lib/serverStorage.ts` から Prisma 直接クエリに変更
- EP1/EP2 は全ログインユーザーのメモを横断対象として検索・返却（API キーはユーザー非依存のグローバル鍵という設計）
- `app/api/v1/sync/route.ts`（データ同期）は引き続き `lib/serverStorage.ts` を使用（今回は対象外）
- ベース URL 環境変数を `CLIPPED_PUBLIC_URL` → `NEXT_PUBLIC_BASE_URL` に変更

### セキュリティ強化
- `middleware.ts` を新規追加。Server Action を使用しないアプリのため、`next-action` ヘッダー付きリクエストを全て 404 でブロック（スキャン攻撃対策）

### 設定 API 追加
- `app/api/settings/api-key/route.ts` — ログインユーザーが `CLIPPED_API_KEY` を取得できる API（PixDraft 等の外部連携設定 UI 用、NextAuth セッション認証必須）

### OGP / Twitter カード自動生成
- `app/opengraph-image.tsx` — Next.js 規約ベースファイルで 1200x630 の OGP 画像をビルド時自動生成（ロゴ + タイトル + サブタイトル）
- `app/twitter-image.tsx` — `opengraph-image.tsx` を再利用した Twitter Card 画像
- `app/layout.tsx` の `metadata` に `openGraph` / `twitter` / `icons` / `metadataBase` を追加
- `app/favicon.ico`、`public/logo.png`、`public/apple-touch-icon.png` を更新・追加
- `pic/` — ロゴ元画像（`clipped-logo-120.png`, `clipped-logo-16.png`）

### 運用整備: 日次バックアップ
- `scripts/backup.sh` 新規追加 — PostgreSQL ダンプ + 画像ファイルを日次バックアップ、7日以上前のバックアップは自動削除（cron 想定: `0 3 * * *`）
- `.gitignore` に `/backups/` を追加

### UI 改善
- `app/page.tsx` — クリップボードボタンからのペースト機能（`handlePasteButton`）を追加。`navigator.clipboard.read()` で画像/テキストを判定しメモを作成
- `app/page.tsx` — モーダルを閉じる際、変更があった場合（`dirty`）のみ `reloadNotes()` を実行し、無駄な再レイアウトを防止
- `app/api/notes/route.ts` — メモ一覧の並び順を `order asc` → `updatedAt desc` に変更（ピン留め優先は維持）

### 削除・整理
- `.gitignore` に `.devrelay-output-history/` を追加（DevRelay セッションレポートはリポジトリに含めない）

---

## 2026-03-15: 多言語対応 + 法的ページ + セキュリティ改善

### 概要
Google OAuth 本番審査に向け、多言語対応（7言語）、プライバシーポリシー・利用規約ページを追加。SyncButton を廃止し API キーのフロントエンド露出を解消。

### i18n（多言語対応）
- **対応言語**: en（デフォルト）/ ja / zh / ko / es / fr / de
- **実装**: React Context ベースの軽量 i18n（`lib/i18n.tsx`）、外部ライブラリ不使用
- **翻訳辞書**: `locales/` ディレクトリに言語別ファイル（~95翻訳キー）
- **言語切り替え**: `LanguageSwitcher` コンポーネント（Header に統合）
- **永続化**: localStorage `"clipped:lang"` + ブラウザ言語自動検出
- **全コンポーネントの UI 文字列を `t()` 関数に置換**

### 法的ページ
- `/privacy` — プライバシーポリシー（7言語、`locales/legal/privacy.ts`）
- `/terms` — 利用規約（7言語、`locales/legal/terms.ts`）
- ログインページにフッターリンク追加

### セキュリティ改善
- `components/SyncButton.tsx` 削除（フロントエンドから API キー参照を排除）
- `.env.local` から `NEXT_PUBLIC_CLIPPED_API_KEY` 削除
- `CLIPPED_API_KEY` を `openssl rand -base64 32` で再生成

### その他
- Header ロゴを PNG 画像に変更（`public/logo.png`）
- ファビコンを `logo.png` に変更
- `<html lang>` をデフォルト `en` に変更（I18nProvider が動的に更新）

### 新規ファイル
- `lib/i18n.tsx` — I18nProvider + useI18n フック
- `locales/index.ts` — Locale 型、辞書マップ
- `locales/{en,ja,zh,ko,es,fr,de}.ts` — 翻訳辞書
- `locales/legal/privacy.ts` — プライバシーポリシーコンテンツ
- `locales/legal/terms.ts` — 利用規約コンテンツ
- `components/LanguageSwitcher.tsx` — 言語切り替え UI
- `app/privacy/page.tsx` — プライバシーポリシーページ
- `app/terms/page.tsx` — 利用規約ページ
- `public/logo.png` — アプリロゴ

### 削除ファイル
- `components/SyncButton.tsx`

---

## 2026-03-15: 画像 JPEG 変換 + LoginNudge 容量表示改善

### 概要
画像保存形式を PNG から JPEG (quality 0.85) に変更し、localStorage 容量を大幅に節約。LoginNudge バナーの容量表示を改善。

### 変更ファイル
- `lib/imageUtils.ts` — `canvas.toDataURL("image/png")` → `canvas.toDataURL("image/jpeg", 0.85)` に変更。mimeType も `image/jpeg` に
- `components/LoginNudge.tsx` — 容量表示を「X / 5 MB」→「X MB 使用中 ※ブラウザにより保存容量の上限は異なります」に変更

### 効果
- 同じ 1600px リサイズでも画像サイズが PNG の 1/3〜1/5 に削減
- ブラウザごとに異なる localStorage 上限を不正確に固定表示していた問題を解消

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
