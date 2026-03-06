<!-- DevRelay Agreement v3 -->
【重要】ユーザーに渡すファイルを作成する場合は、必ず `.devrelay-output/` ディレクトリに保存してください。このディレクトリに置かれたファイルは自動的にユーザーに送信されます。

【プランモード】
現在はプランモードです。コードの書き換えや新規ファイルの作成は行わず、以下のみを行ってください：
- 調査・分析
- 実装プランの立案
- 質問や確認

プランが完成したら、最後に必ず以下のように伝えてください：
「このプランでよければ `e` または `exec` を送信してください。実装を開始します。」

ユーザーが `exec` を送信するまで、コードの変更は行わないでください。

【プランの説明】
プランを立案したら、必ずテキストで概要を説明してください。
ファイルに書き込むだけでなく、ユーザーが Discord/Telegram で内容を確認できるようにしてください。

【ユーザーへの質問】
AskUserQuestion ツールは使用しないでください（DevRelay 経由では応答を返せないため）。
ユーザーに質問や確認が必要な場合は、テキストで質問を書いてください。
ユーザーは Discord/Telegram 経由でテキストで回答します。

【コーディングスタイル】
ソースコードを書く際は、詳細な日本語コメントを必ず残してください。
以下のルールに従ってください：

1. **関数・メソッド**: 必ず JSDoc 形式で目的・引数・戻り値を説明
2. **クラス**: クラスの責務と使用方法を説明
3. **複雑なロジック**: 処理の流れを段階的に説明
4. **条件分岐**: なぜその条件が必要かを説明
5. **重要な変数**: 変数の用途を説明
6. **TODO・FIXME**: 将来の改善点を明記

コメントがないコードは不完全です。他の開発者が読んで理解できるレベルのコメントを心がけてください。
<!-- /DevRelay Agreement -->

---

## プロジェクト概要

**Clipped** - Google Keep 風メモアプリ（「貼り付けファースト」設計）

### 技術スタック
- **フレームワーク**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **DnD**: @dnd-kit/core（ドラッグ&ドロップ）
- **ID生成**: @paralleldrive/cuid2
- **データ保存**: localStorage（Phase 8 以降で PostgreSQL + Prisma に移行予定）
- **パッケージ管理**: pnpm（NVM 経由で利用）
- **プロセス管理**: pm2

### 環境情報
- **ポート**: 3200
- **公開 URL**: `ribbon-re.jp/clipped`（Apache reverse proxy 経由）
- **basePath**: `/clipped`（next.config.mjs に設定済み）
- **pnpm 実行方法**: `export NVM_DIR="/home/fwjg2507/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"` でパス設定後に使用
- **pm2 再起動**: 上記 NVM 初期化後に `pm2 restart clipped`
- **pm2 注意**: `node_modules/.bin/next` はシェルスクリプトのため `node_modules/next/dist/bin/next` を指定

### ファイル構成
```
app/page.tsx             - メインページ（全コンポーネント統合）
components/NoteGrid.tsx  - @dnd-kit + useMasonry で DnD 対応 Masonry グリッド
components/NoteCard.tsx  - forwardRef、style prop、dragListeners 対応
components/NoteModal.tsx - 自動保存（debounce 1500ms）、画像編集連携
components/PasteHandler.tsx - window レベル paste イベントリスナー
components/ImageCropModal.tsx - Canvas 矩形選択（react-easy-crop 廃止済み）
components/ImageAnnotation.tsx - Canvas マーカー描画（半透明、設定永続化、Ctrl+C/Z）
hooks/useMasonry.ts      - JS 計算 Masonry エンジン（absolute positioning）
lib/localStorage.ts      - LocalNote 型、CRUD、reorderNotes()
```

### 技術的な注意点
- **SSR 無効化**: NoteGrid, NoteModal は `next/dynamic` + `ssr: false` で読み込み（Canvas / @dnd-kit がブラウザ専用）
- **localStorage**: `saveNotes()` に try-catch 必須（QuotaExceededError 対策）
- **Canvas**: コンテナの clientWidth/Height が 0 の場合のガード必須
- **React ref + setState 競合**: `setStrokes((prev) => [...prev, ref.current!])` は ref.current をローカル変数に退避してから null 化すること
- **useMasonry デッドロック防止**: `measureRef` 内で `setLayoutTrigger` を呼ばない（無限ループ React error #185 の原因）。代わりに `itemIds.length` 変化を useEffect で検知
- **未測定カード**: NoteGrid で `positions` に含まれないカードを測定用不可視カードとして常にレンダリング

### 実装ロードマップ
- [x] Phase 1-3: プロジェクト初期化、localStorage CRUD、基本 UI
- [x] Phase 4-6: PasteHandler、NoteModal、ColorPicker、TagInput、Toast、LoginNudge
- [x] 追加: Masonry DnD、画像切り抜き、マーカー描画、Ctrl+C/Z、設定記憶
- [ ] Phase 7: Google OAuth 認証
- [ ] Phase 8: PostgreSQL + Prisma
- [ ] Phase 9: API 実装
- [ ] Phase 10: データ移行（localStorage → DB）
- [ ] Phase 11: 本番デプロイ最終調整
