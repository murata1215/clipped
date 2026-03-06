# Clipped - 仕様書
> Claude Code 向け実装ドキュメント v3.0

| 項目 | 内容 |
|---|---|
| 作成日 | 2026年3月 |
| 対象環境 | VPS (ribbon-re.jp) / Ubuntu / Caddy / pm2 |
| 技術スタック | Next.js 14 (App Router) + PostgreSQL + Prisma + NextAuth.js v5 |
| 公開方針 | 未ログインでも使える → 体験して気に入ったらログイン誘導 |

---

## 1. プロジェクト概要

ClippedはブラウザベースのGoogle Keep風メモアプリです。**ページを開いてすぐCtrl+Vで貼れる**体験を最優先にします。ログインは強制せず、使ってみて「これいい」と思ったユーザーをGoogleログインに誘導します。

### 1.1 ユーザーステート

| 状態 | データ保存先 | 説明 |
|---|---|---|
| 未ログイン | ブラウザ localStorage | ペースト・作成・編集・削除が全部できる。ログイン不要 |
| ログイン済み | PostgreSQL（userId紐づき） | 複数端末同期・データ永続保証 |
| 移行時 | localStorage → PostgreSQL | ログイン時にローカルデータをサーバーに引き継ぎ |

### 1.2 想定フロー（未ログイン）

```
サイトを開く（登録不要）
  → Ctrl+V でスクショ貼り付け
  → テキスト追記
  → 自動保存（localStorage）
  → 「こりゃいい」→ Googleログインボタンを押す
  → ローカルデータをサーバーに引き継ぎ
  → 以降はどの端末からでも使える
```

### 1.3 ログイン誘導タイミング

押しつけず、自然なタイミングでそっと誘導します。

- メモが **5件を超えたら** ヘッダー下に薄いバナー表示
  - 「ログインするとどの端末からでも使えます」
- **ブラウザを閉じようとしたとき**（beforeunload）
  - 「ログインしないとデータがこのブラウザにしか残りません」
- 初回ペーストから **3日後** にトースト表示
  - 「スマホからも見たくないですか？」

### 1.4 スコープ外（初期リリース）

- チーム・ワークスペース機能
- リアルタイム同時編集
- モバイルアプリ
- 画像アノテーション（マーカーはSnipping Tool側で対応）
- ダークモード

---

## 2. 技術スタック

| レイヤー | 技術 | 備考 |
|---|---|---|
| フロントエンド | Next.js 14（App Router） | |
| バックエンド | Next.js API Routes（Route Handlers） | Node.js runtime 固定 |
| データベース | PostgreSQL | ログインユーザーのデータ永続化 |
| ORM | Prisma | |
| 認証 | NextAuth.js v5 + Google OAuth | 任意ログイン |
| 未ログインデータ | localStorage | キー: `clipped_notes` |
| 画像保存 | サーバーローカル + APIルート経由配信 | 認証チェック付き、public/外に保存 |
| リバースプロキシ | Caddy | HTTPS自動、Apache不使用 |
| プロセス管理 | pm2 | |
| スタイリング | Tailwind CSS | |
| 画像処理 | sharp | リサイズ・WebP変換 |
| multipartパース | busboy | |

### 2.1 ポート・ドメイン

| 項目 | 値 |
|---|---|
| ポート | 3200 |
| ドメイン（予定） | clipped.app |
| Caddy設定 | clipped.app → localhost:3200 |

---

## 3. ディレクトリ構成

```
clipped/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # メモ一覧（メイン画面）
│   ├── login/
│   │   └── page.tsx                     # カスタムログインページ
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # NextAuth
│       ├── notes/
│       │   ├── route.ts                 # GET一覧 / POST作成
│       │   └── [id]/route.ts            # PUT / DELETE
│       ├── uploads/
│       │   ├── route.ts                 # POST アップロード
│       │   └── [filename]/route.ts     # GET 画像配信（認証付き）
│       └── migrate/
│           └── route.ts                 # POST ローカルデータ引き継ぎ
├── components/
│   ├── NoteGrid.tsx                     # メモ一覧グリッド
│   ├── NoteCard.tsx                     # メモカード
│   ├── NoteModal.tsx                    # 編集モーダル
│   ├── NewNoteInput.tsx                 # 一覧上部インライン作成エリア
│   ├── PasteHandler.tsx                # グローバルペースト処理
│   └── LoginNudge.tsx                  # ログイン誘導バナー・トースト
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── localStorage.ts                 # localStorage操作ユーティリティ
├── prisma/
│   └── schema.prisma
├── uploads/                             # 画像保存先（public/外）
├── .env.local
└── ecosystem.config.js
```

---

## 4. データ設計

### 4.1 localStorage スキーマ（未ログイン）

キー：`clipped_notes`

```typescript
type LocalNote = {
  id: string;          // cuid()でクライアント生成
  title: string;
  body: string;
  color: string;       // "default" | "yellow" | "green" | "blue" | "pink" | "purple"
  pinned: boolean;
  images: LocalImage[];
  tags: string[];
  createdAt: string;   // ISO8601
  updatedAt: string;   // ISO8601
};

type LocalImage = {
  id: string;
  dataUrl: string;     // base64（未ログイン時はbase64でlocalStorageに保存）
  mimeType: string;
  width?: number;
  height?: number;
};
```

> **未ログイン時の画像**はbase64でlocalStorageに保存します。ログイン後の引き継ぎ時にサーバーにアップロードしてURLに変換します。localStorageの容量上限（約5MB）に注意し、画像は保存前に`canvas`でリサイズ（最大800px）します。

### 4.2 Prisma スキーマ（ログインユーザー）

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  notes     Note[]
  tags      Tag[]
  createdAt DateTime @default(now())
}

model Note {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String    @default("")
  body      String    @default("")
  color     String    @default("default")
  pinned    Boolean   @default(false)
  deleted   Boolean   @default(false)  // 論理削除
  version   Int       @default(0)      // 楽観ロック用
  images    Image[]
  noteTags  NoteTag[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId, deleted, updatedAt])
}

model Image {
  id        String   @id @default(cuid())
  noteId    String
  note      Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
  filename  String
  mimeType  String
  size      Int
  width     Int?
  height    Int?
  createdAt DateTime @default(now())
}

model Tag {
  id       String    @id @default(cuid())
  userId   String
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name     String
  noteTags NoteTag[]

  @@unique([userId, name])
}

model NoteTag {
  noteId String
  tagId  String
  note   Note   @relation(fields: [noteId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([noteId, tagId])
}
```

### 4.3 論理削除・カラー定義

- 削除は `deleted = true`（物理削除しない、将来ゴミ箱機能に対応）
- 孤立画像ファイルは週次バッチで物理削除

| カラー値 | 表示色 |
|---|---|
| default | デフォルト |
| yellow | 黄色 |
| green | 緑 |
| blue | 青 |
| pink | ピンク |
| purple | 紫 |

---

## 5. API設計

ログインユーザー用のAPIです。未ログイン時はlocalStorageで完結するため、APIは不要です。

全エンドポイントでセッション検証を行い、未認証は `401` を返します。

### 5.1 エンドポイント一覧

| メソッド | エンドポイント | 説明 |
|---|---|---|
| GET | /api/notes | メモ一覧取得 |
| POST | /api/notes | メモ新規作成 |
| PUT | /api/notes/[id] | メモ更新（楽観ロック） |
| DELETE | /api/notes/[id] | メモ論理削除 |
| POST | /api/uploads | 画像アップロード |
| GET | /api/uploads/[filename] | 画像配信（認証付き） |
| POST | /api/migrate | ローカルデータ引き継ぎ |

### 5.2 GET /api/notes

**クエリパラメータ**

| パラメータ | 型 | 説明 |
|---|---|---|
| q | string | title・body の部分一致（大文字小文字無視、AND検索） |
| color | string | カラーフィルタ |
| tag | string | タグ名フィルタ |
| pinned | boolean | ピン留めのみ |

**並び順**：`pinned DESC, updatedAt DESC`

**除外条件**：`deleted = false` のみ

### 5.3 PUT /api/notes/[id]（楽観ロック）

```typescript
// リクエストボディ
{ title, body, color, pinned, tags, version }

// version が一致しない場合は 409 Conflict
const updated = await prisma.note.updateMany({
  where: { id, userId, version },
  data: { ..., version: { increment: 1 } }
});
if (updated.count === 0) return Response.json({ error: 'conflict' }, { status: 409 });
```

### 5.4 POST /api/uploads

- `export const runtime = 'nodejs'` 必須
- `busboy` で multipart/form-data をパース
- 受け入れMIMEタイプ：`image/png`, `image/jpeg`, `image/gif`, `image/webp` のみ
- MIME sniff：ファイル先頭バイトで実体を検証
- サイズ上限：10MB
- `sharp` で最大2048pxにリサイズ・WebP変換
- ファイル名：`cuid() + .webp`
- 保存先：`process.env.UPLOAD_DIR`
- レスポンス：`{ filename, url: "/api/uploads/<filename>", width, height, size }`
- 1メモあたり最大10枚

### 5.5 GET /api/uploads/[filename]

1. セッション検証（未認証は 401）
2. `Image` レコードから `note.userId` を取得、セッションユーザーと照合（不一致は 403）
3. 検証通過後に `fs.createReadStream` でレスポンス

### 5.6 POST /api/migrate（ローカルデータ引き継ぎ）

ログイン時にlocalStorageのデータをサーバーに移行します。

```typescript
// リクエストボディ
{ notes: LocalNote[] }

// 処理内容
// 1. 各noteをNote レコードとして作成
// 2. images の dataUrl をデコードしてファイル保存 → Image レコード作成
// 3. tags を upsert して NoteTag を作成
// 4. 完了後にフロントはlocalStorageを削除

// レスポンス
{ migrated: number }  // 移行したメモ数
```

---

## 6. 認証設計

### 6.1 NextAuth 設定

```typescript
// lib/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub }
    }),
  },
  pages: {
    signIn: '/login',  // カスタムログインページ
  }
});
```

### 6.2 ユーザー自動登録

初回ログイン時に `User` レコードを自動 upsert します。

### 6.3 ログイン後の引き継ぎフロー

```
Googleログイン成功
  → localStorageにデータがあるか確認
  → あれば POST /api/migrate で引き継ぎ
  → 完了後にlocalStorageを削除
  → 通常のログイン済み状態に移行
```

### 6.4 セッション切れ挙動

- API から `401` が返った場合 → `/login` にリダイレクト
- モーダル編集中にセッション切れ → トースト「セッションが切れました。再ログインしてください」

### 6.5 環境変数

| 変数名 | 説明 |
|---|---|
| AUTH_SECRET | openssl rand -base64 32 |
| AUTH_GOOGLE_ID | Google OAuth クライアントID |
| AUTH_GOOGLE_SECRET | Google OAuth クライアントシークレット |
| DATABASE_URL | PostgreSQL接続文字列 |
| UPLOAD_DIR | 画像保存先絶対パス（例: /var/www/clipped/uploads） |
| NEXT_PUBLIC_BASE_URL | サイトURL（例: https://clipped.app） |

---

## 7. ペースト機能（コア機能）

### 7.1 前提条件

`window` に `paste` イベントをリッスンするため、Clippedのタブが最前面でアクティブであれば、ページ内要素へのフォーカスなしでCtrl+Vが即反応します。タブが非アクティブな場合はブラウザの仕様上ペーストイベントは発火しません。

### 7.2 ペースト対応コンテンツ

| コンテンツ種別 | 検出条件 | 処理 |
|---|---|---|
| 画像（スクリーンショット等） | `clipboardData.items` に `image/*` | 未ログイン:canvas でリサイズ→base64→localStorage / ログイン済み:サーバーアップロード |
| テキスト | `clipboardData.types` に `text/plain` | 新規メモ作成 → モーダル表示 → 本文にセット |
| HTML（ブラウザコピー） | `clipboardData.types` に `text/html` | プレーンテキストに変換して挿入 |

### 7.3 PasteHandler 実装方針

```typescript
useEffect(() => {
  const handlePaste = async (e: ClipboardEvent) => {
    if (isModalOpen) return;

    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find(i => i.type.startsWith('image/'));

    if (imageItem) {
      const blob = imageItem.getAsFile();
      if (isLoggedIn) {
        // ログイン済み：サーバーにアップロード
        const result = await uploadToServer(blob);
        openNewNoteModal({ image: result });
      } else {
        // 未ログイン：canvasでリサイズしてbase64化
        const dataUrl = await resizeToDataUrl(blob, 800);
        openNewNoteModal({ imageDataUrl: dataUrl });
      }
    } else {
      const text = e.clipboardData?.getData('text/plain');
      if (text?.trim()) openNewNoteModal({ body: text });
    }
  };

  window.addEventListener('paste', handlePaste);
  return () => window.removeEventListener('paste', handlePaste);
}, [isModalOpen, isLoggedIn]);
```

---

## 8. UI設計

### 8.1 画面一覧

| 画面名 | ルート | 概要 |
|---|---|---|
| メモ一覧 | / | 未ログインでもそのまま使える。グリッド表示、常時Ctrl+V待機 |
| ログイン | /login | カスタムページ。Googleログインボタンのみ |
| （モーダル） | /（オーバーレイ） | カードクリックまたはペーストで表示 |

### 8.2 ヘッダー

| 状態 | 表示内容 |
|---|---|
| 未ログイン | ロゴ + 検索 + 「Googleでログイン」ボタン |
| ログイン済み | ロゴ + 検索 + アバター（クリックでログアウト） |

### 8.3 ログイン誘導バナー（LoginNudge）

以下の条件でそっと表示、押しつけない：

- メモが5件を超えたら：ヘッダー下に薄いバナー「ログインするとどの端末からでも使えます」
- ブラウザを閉じようとしたとき：`beforeunload` で警告「ログインしないとデータがこのブラウザにしか残りません」
- 初回ペーストから3日後：トースト「スマホからも見たくないですか？」

### 8.4 メモカード（NoteCard）

- カード背景色はcolorフィールドに対応
- タイトル・本文プレビュー（本文は3行で切り捨て）
- 添付画像がある場合は**先頭1枚のみ**サムネイル表示
- ピン留めアイコン（右上、ホバーで表示）
- ホバーで編集・削除ボタン表示
- カードクリックでモーダルが開く（ページ遷移なし）

### 8.5 モーダルエディタ（NoteModal）

- 画面中央にモーダル表示（背景はオーバーレイ）
- タイトル入力欄（1行）
- 本文入力欄（複数行・自動拡張）
- モーダル内でもCtrl+Vで画像追加可能
- カラーピッカー（6色）
- タグ入力（Enter or カンマで確定、×で削除）
- 画像サムネイル一覧（×ボタンで削除）
- **自動保存（debounce 1500ms、保存ボタンなし）**
- Escキーまたはオーバーレイクリックで閉じる
- 409 Conflict 時はトースト「他の場所で更新されました。再読み込みしてください」

### 8.6 一覧上部インライン作成エリア（NewNoteInput）

- Google Keepと同様、一覧画面上部に常設
- クリックで展開してタイトル・本文入力
- 展開状態でCtrl+Vで画像を追加できる
- フォーカスが外れたら自動保存して折り畳む

---

## 9. 将来のチーム機能拡張設計（参考）

```prisma
// 将来追加（初期リリースには含めない）
model Workspace {
  id      String            @id @default(cuid())
  name    String
  members WorkspaceMember[]
}

model WorkspaceMember {
  workspaceId String
  userId      String
  role        String   // owner / editor / viewer
  @@id([workspaceId, userId])
}
```

`Note` に `workspaceId String?`（nullable）を追加するだけで個人メモとチームメモを共存させられます。

---

## 10. デプロイ手順

### 10.1 VPS側準備

```sql
CREATE DATABASE clipped;
```

Google Cloud Console でOAuthクライアント作成：
- 承認済みリダイレクトURI: `https://clipped.app/api/auth/callback/google`

```bash
mkdir -p /var/www/clipped/uploads
chmod 755 /var/www/clipped/uploads
```

### 10.2 初回セットアップ

```bash
git clone <repo> /var/www/clipped
cd /var/www/clipped
pnpm install
cp .env.example .env.local
npx prisma migrate deploy
pnpm build
pm2 start ecosystem.config.js
```

### 10.3 ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'clipped',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/clipped',
    env: { PORT: 3200, NODE_ENV: 'production' }
  }]
};
```

### 10.4 Caddyfile

```
clipped.app {
  reverse_proxy localhost:3200
  encode gzip
}
```

### 10.5 バックアップ方針

- PostgreSQL：`pg_dump` を cron で毎日実行
- `uploads/`：rsync で外部ストレージに定期バックアップ
- 孤立ファイルGC：削除済みメモの画像ファイルを週次バッチで物理削除

---

## 11. 実装フェーズ

「まず未ログインで動くものを作る」順番に組んであります。Phase 3 完了時点で**デモとして十分使えるもの**になります。

| フェーズ | 内容 | 完了の目安 |
|---|---|---|
| Phase 1 | プロジェクト初期化・Tailwind・ディレクトリ構成 | `pnpm dev` で起動する |
| Phase 2 | localStorage操作ユーティリティ（`lib/localStorage.ts`） | CRUD・並び順・検索が動く |
| Phase 3 | **メモ一覧UI + NoteCard + NewNoteInput（未ログインで全部動く）** | ブラウザだけで使えるメモアプリになる |
| Phase 4 | **グローバルペースト処理（PasteHandler）+ canvas リサイズ** | Ctrl+Vでスクショが貼れる |
| Phase 5 | モーダルエディタ（NoteModal・自動保存・カラー・タグ） | 編集体験が完成する |
| Phase 6 | ログイン誘導バナー（LoginNudge） | 未ログイン体験が完成する |
| Phase 7 | Prisma・NextAuth・カスタムログインページ | Googleログインができる |
| Phase 8 | サーバー側API（notes CRUD・楽観ロック・論理削除） | ログイン済みデータがDBに入る |
| Phase 9 | 画像アップロードAPI（busboy・sharp・認証付き配信） | ログイン済みで画像が永続化する |
| Phase 10 | **引き継ぎ処理（POST /api/migrate）** | ローカルデータがサーバーに移行される |
| Phase 11 | VPSデプロイ・Caddy設定・動作確認 | 本番稼働 |

### Claude Codeへの依頼のコツ

- **Phase 3 が最初のマイルストーン**。ここまでで「動くもの」を確認してから先に進む
- Phase 4 の PasteHandler は独立コンポーネントで先に作り単体テスト推奨
- Phase 7 以降は `prisma migrate dev` で動作確認してから次へ
- Phase 9 は `export const runtime = 'nodejs'` を忘れずに
- Phase 10 の引き継ぎ処理は base64 → ファイル保存の変換が肝。画像サイズに注意
