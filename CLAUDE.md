<!-- DevRelay Agreement v4 -->
See `rules/devrelay.md` for DevRelay rules.
<!-- /DevRelay Agreement -->

---

## プロジェクト概要

**Clipped** - Google Keep 風メモアプリ（「貼り付けファースト」設計）

### 技術スタック
- **フレームワーク**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **DnD**: @dnd-kit/core（ドラッグ&ドロップ）
- **ID生成**: @paralleldrive/cuid2
- **認証**: NextAuth.js v5 + Google OAuth（JWT セッション）
- **データ保存**: PostgreSQL + Prisma（ログインユーザー） / localStorage（未ログイン）
- **i18n**: 自前軽量実装（React Context）、7言語対応（en/ja/zh/ko/es/fr/de）、英語デフォルト
- **パッケージ管理**: pnpm（NVM 経由で利用）
- **プロセス管理**: pm2

### 環境情報
- **ポート**: 3006
- **作業ディレクトリ**: `/opt/clipped`
- **pnpm 実行方法**: `export NVM_DIR="/home/fwjg2507/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"` でパス設定後に使用
- **pm2 再起動**: 上記 NVM 初期化後に `pm2 restart clipped`
- **pm2 注意**: `node_modules/.bin/next` はシェルスクリプトのため `node_modules/next/dist/bin/next` を指定

### ファイル構成
```
app/page.tsx             - メインページ（全コンポーネント統合）
app/api/v1/clips/route.ts       - EP1: クリップ一覧 API（Prisma ベース、全ユーザー横断）
app/api/v1/clips/[clipId]/route.ts - EP2: クリップ詳細 API（Prisma ベース）
app/api/v1/photos/[photoId]/route.ts - EP3: 画像ダウンロード API（Prisma ベース）
app/api/v1/sync/route.ts        - データ同期 API（localStorage → サーバー、serverStorage 使用）
app/api/settings/api-key/route.ts - ログインユーザー向け CLIPPED_API_KEY 取得 API
middleware.ts            - Server Action スキャン攻撃ブロック（next-action ヘッダー付きリクエストを404）
scripts/backup.sh        - PostgreSQL + 画像の日次バックアップ（7日保持、cron 想定）
components/NoteGrid.tsx  - @dnd-kit + useMasonry で DnD 対応 Masonry グリッド
components/NoteCard.tsx  - forwardRef、style prop、dragListeners 対応
components/NoteModal.tsx - 自動保存（debounce 1500ms）、画像クリックで直接編集（タブ切り替え対応）
components/PasteHandler.tsx - window レベル paste + dragover/drop イベントリスナー（画像ファイルドロップ対応）
components/LanguageSwitcher.tsx - 言語切り替えドロップダウン（7言語）
components/ImageCropModal.tsx - Canvas 矩形選択（react-easy-crop 廃止済み、タブ切り替え対応）
components/ImageAnnotation.tsx - Canvas マーカー描画（ペン/矢印/丸ツール、半透明、設定永続化、Ctrl+C/Z、フィット拡大表示）
hooks/useMasonry.ts      - JS 計算 Masonry エンジン（absolute positioning）
lib/localStorage.ts      - LocalNote 型、CRUD、reorderNotes()
lib/apiAuth.ts           - API キー認証ヘルパー（Bearer トークン検証）
lib/serverStorage.ts     - サーバーサイドストレージ（JSON + 画像ファイル操作）
lib/auth.ts              - NextAuth v5 設定（Google OAuth、JWT、Prisma Adapter）
lib/prisma.ts            - Prisma クライアントシングルトン
lib/noteService.ts       - サーバーサイド CRUD サービス（Prisma 経由）
lib/noteApiClient.ts     - フロントエンド API クライアント
lib/imageStorage.ts      - 画像ファイル保存/削除/パス取得
app/api/notes/route.ts           - メモ一覧/作成 API
app/api/notes/[noteId]/route.ts  - メモ詳細/更新/削除 API
app/api/notes/[noteId]/images/   - 画像アップロード/取得/削除 API
components/AuthProvider.tsx - SessionProvider ラッパー
app/login/page.tsx       - カスタムログインページ
app/api/auth/[...nextauth]/route.ts - NextAuth ハンドラー
prisma/schema.prisma     - DB スキーマ定義
data/photos/             - 画像ファイル（{userId}/{YYYYMMDD}/、.gitignore 対象）
locales/                 - 翻訳辞書（en/ja/zh/ko/es/fr/de）+ legal/（privacy, terms）
lib/i18n.tsx             - I18nProvider + useI18n フック（React Context）
app/privacy/page.tsx     - プライバシーポリシーページ
app/terms/page.tsx       - 利用規約ページ
```

### REST API 仕様
- **認証**: `Authorization: Bearer {CLIPPED_API_KEY}` （.env.local で設定）
- **EP1 クリップ一覧**: `GET /api/v1/clips?page=1&per_page=20&search=xxx` → JSON（ページネーション付き）
- **EP2 クリップ詳細**: `GET /api/v1/clips/{id}` → JSON（画像 URL 付き）
- **EP3 画像ダウンロード**: `GET /api/v1/photos/{id}` → 画像バイナリ
- **データ同期**: `POST /api/v1/sync` → localStorage データをサーバーに保存
- **ストレージ**: PostgreSQL + 画像ファイル（`data/photos/{userId}/{YYYYMMDD}/`）
- **注意**: `NEXT_PUBLIC_CLIPPED_API_KEY` は廃止済み（SyncButton 削除）。外部 API 認証は `CLIPPED_API_KEY` のみ（サーバーサイド専用）
- **v1 クリップ API**: EP1/EP2/EP3 は Prisma 直接クエリに移行済み（`lib/serverStorage.ts` は EP4 同期 API のみで使用）。EP1/EP2 は全ログインユーザーのメモを横断対象（API キーはユーザー非依存のグローバル鍵）

### 技術的な注意点
- **SSR 無効化**: NoteGrid, NoteModal は `next/dynamic` + `ssr: false` で読み込み（Canvas / @dnd-kit がブラウザ専用）
- **localStorage**: `saveNotes()` に try-catch 必須（QuotaExceededError 対策）
- **Canvas**: コンテナの clientWidth/Height が 0 の場合のガード必須
- **React ref + setState 競合**: `setStrokes((prev) => [...prev, ref.current!])` は ref.current をローカル変数に退避してから null 化すること
- **useMasonry デッドロック防止**: `measureRef` 内で `setLayoutTrigger` を呼ばない（無限ループ React error #185 の原因）。代わりに `itemIds.length` 変化を useEffect で検知
- **未測定カード**: NoteGrid で `positions` に含まれないカードを測定用不可視カードとして常にレンダリング
- **画像編集 2クリック化**: 画像サムネイルクリック → 直接マーカー画面（タブでマーカー⇔切り抜き切り替え）。`menuImageId` state は廃止済み
- **Canvas フィット拡大**: ImageAnnotation のスケール計算で `Math.min(scaleX, scaleY)` を使用（上限 1 を撤廃）。小さい画像も画面いっぱいに表示。Canvas 内部解像度は元画像のまま
- **ツール切り替え**: ImageAnnotation は ToolType（"pen" | "arrow" | "circle"）で描画モードを分岐。Stroke 型に `toolType?` フィールド追加（undefined は後方互換で "pen"）。矢印は drawArrow（直線+三角矢じり fill）、丸は drawEllipse（ctx.ellipse() stroke のみ）。ツール選択も localStorage に保存
- **ファイルドロップ**: PasteHandler が window レベルの dragover/drop イベントもリッスン。画像ファイルのみ対応（1ファイル = 1メモ）。@dnd-kit は PointerEvent ベースのため HTML5 DnD イベントとは競合しない。モーダルが開いている時はドロップ無効

### 実装ロードマップ
- [x] Phase 1-3: プロジェクト初期化、localStorage CRUD、基本 UI
- [x] Phase 4-6: PasteHandler、NoteModal、ColorPicker、TagInput、Toast、LoginNudge
- [x] 追加: Masonry DnD、画像切り抜き、マーカー描画、Ctrl+C/Z、設定記憶
- [x] UI改善: 画像編集 2クリック化（タブ切り替え）、Canvas フィット拡大表示
- [x] 描画ツール拡張: 矢印ツール、丸（楕円）ツール追加（指示書作成対応）
- [x] REST API: PixDraft 連携（クリップ一覧/詳細/画像DL/同期、Bearer 認証）
- [x] ファイルドロップ: 画像ファイルをブラウザにドラッグ&ドロップでメモ作成
- [x] Phase 7: Google OAuth 認証（NextAuth v5 + JWT セッション）
- [x] Phase 8-10: PostgreSQL + Prisma 移行、画像API、フロントAPI切り替え、画像ディレクトリ構造改善
- [x] 多言語対応: i18n（7言語）、LanguageSwitcher、Privacy Policy、Terms of Service
- [x] セキュリティ: SyncButton 廃止、NEXT_PUBLIC_CLIPPED_API_KEY 削除、API キー再生成、Server Action スキャン攻撃ブロック
- [x] v1 API を serverStorage → Prisma に移行（EP1/EP2/EP3）、OGP/Twitter カード自動生成、日次バックアップ運用整備
- [ ] Phase 11: 本番デプロイ最終調整
