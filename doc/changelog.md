# Changelog

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
