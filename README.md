# Clipped

Google Keep 風のメモアプリ。「貼り付けファースト」の設計思想で、Ctrl+V でスクリーンショットやテキストを即座にメモ化できます。

## 特徴

- **貼り付けファースト** - ページがアクティブなら Ctrl+V で即座にメモ作成
- **画像切り抜き** - Canvas ベースの矩形選択で画像をトリミング
- **マーカー描画** - 画像上にフリーハンドで半透明マーカーを描画（蛍光ペン風、フィット拡大表示）
- **矢印・丸ツール** - 指示書作成に便利な矢印と丸（楕円）をドラッグで配置（色・太さ・透明度対応）
- **2クリック画像編集** - 画像サムネイルクリックで直接マーカー画面を開き、タブでマーカー⇔切り抜きを切り替え
- **Masonry レイアウト** - Google Keep 風のカード配置 + ドラッグ&ドロップ並べ替え
- **自動保存** - モーダル編集時にデバウンス 1500ms で自動保存
- **タグ・カラー** - メモにタグ付けと背景色（6色）を設定可能
- **キーボードショートカット** - Ctrl+Z（アンドゥ）、Ctrl+C（クリップボードコピー）
- **REST API** - 外部サービス連携用 API（クリップ一覧/詳細/画像DL、Bearer 認証）
- **サーバー同期** - localStorage データをサーバーに手動同期（API 経由で外部アクセス可能に）

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| ドラッグ&ドロップ | @dnd-kit/core |
| ID 生成 | @paralleldrive/cuid2 |
| データ保存 | localStorage（現在） |
| プロセス管理 | pm2 |
| パッケージ管理 | pnpm |

## ディレクトリ構成

```
clipped/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # メインページ（全機能統合）
│   └── globals.css         # グローバル CSS
├── app/
│   ├── api/v1/
│   │   ├── clips/route.ts        # クリップ一覧 API
│   │   ├── clips/[clipId]/route.ts # クリップ詳細 API
│   │   ├── photos/[photoId]/route.ts # 画像ダウンロード API
│   │   └── sync/route.ts         # データ同期 API
├── components/
│   ├── Header.tsx          # ヘッダー（検索バー + ログインボタン）
│   ├── NewNoteInput.tsx    # 新規メモ作成エリア
│   ├── NoteGrid.tsx        # Masonry グリッド + DnD
│   ├── NoteCard.tsx        # 個別メモカード
│   ├── NoteModal.tsx       # メモ編集モーダル（自動保存）
│   ├── PasteHandler.tsx    # グローバルペースト処理
│   ├── SyncButton.tsx      # サーバー同期ボタン
│   ├── ImageCropModal.tsx  # Canvas 矩形選択による画像切り抜き
│   ├── ImageAnnotation.tsx # Canvas マーカー描画
│   ├── ColorPicker.tsx     # 背景色選択（6色）
│   ├── TagInput.tsx        # タグ入力
│   ├── DragOverlayCard.tsx # ドラッグ中のカードクローン
│   ├── ErrorBoundary.tsx   # React エラーバウンダリ
│   ├── LoginNudge.tsx      # ログイン誘導バナー
│   └── Toast.tsx           # トースト通知
├── hooks/
│   └── useMasonry.ts       # Masonry レイアウトエンジン
├── lib/
│   ├── localStorage.ts     # localStorage CRUD
│   ├── apiAuth.ts          # API キー認証
│   ├── serverStorage.ts    # サーバーサイドストレージ
│   ├── imageUtils.ts       # 画像リサイズユーティリティ
│   └── cropUtils.ts        # 画像切り抜きユーティリティ
├── data/                   # 同期データ（.gitignore 対象）
│   ├── clips.json          # クリップメタデータ
│   └── photos/             # 画像ファイル
├── docs/
│   └── Clipped_仕様書.md   # 仕様書
└── ecosystem.config.js     # pm2 設定
```

## セットアップ

### 前提条件

- Node.js 18+
- pnpm

### インストール

```bash
pnpm install
```

### 開発サーバー

```bash
pnpm dev
# http://localhost:3200 でアクセス
```

### 本番ビルド

```bash
pnpm build
pnpm start
```

### pm2 での運用

```bash
pm2 start ecosystem.config.js
pm2 restart clipped
pm2 logs clipped
```

## 環境変数

`.env.local.example` をコピーして `.env.local` を作成してください。

```bash
cp .env.local.example .env.local
```

## デプロイ

Apache reverse proxy 経由で `ribbon-re.jp/clipped` でアクセスされる構成です。

- `basePath: "/clipped"` が next.config.mjs に設定済み
- ポート 3200 で動作
- pm2 で管理

## ロードマップ

- [x] Phase 1-3: プロジェクト初期化、localStorage CRUD、基本 UI
- [x] Phase 4-6: PasteHandler、NoteModal、ColorPicker、TagInput、Toast、LoginNudge
- [x] Masonry DnD、画像切り抜き、マーカー描画
- [x] UI改善: 画像編集 2クリック化（タブ切り替え）、Canvas フィット拡大表示
- [x] 描画ツール拡張: 矢印ツール、丸（楕円）ツール追加
- [x] REST API: PixDraft 連携（クリップ一覧/詳細/画像DL/同期、Bearer 認証）
- [ ] Phase 7: Google OAuth 認証
- [ ] Phase 8: PostgreSQL + Prisma（API ストレージを JSON → DB に移行）
- [ ] Phase 9: API 拡張（署名付き URL、サムネイルリサイズ、Webhook）
- [ ] Phase 10: データ移行（localStorage → DB）
- [ ] Phase 11: 本番デプロイ最終調整

## ライセンス

Private
