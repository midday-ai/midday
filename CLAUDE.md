# Midday-JP プロジェクト AI ルール

> このプロジェクトでは、~/CLAUDE.md のグローバルルールが適用されます

## グローバルルール参照
詳細は ~/CLAUDE.md を参照してください

## プロジェクト概要
- **プロダクト名**: Midday-JP（日本向け経営管理ダッシュボード）
- **コンセプト**: Linear for Accounting
- **対象**: フリーランス・小規模事業者
- **ライセンス**: AGPL-3.0

## 技術スタック
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI (@midday/ui)
- **State**: TanStack Query, Zustand
- **Backend**: tRPC, Supabase (PostgreSQL)
- **i18n**: next-international
- **Package Manager**: Bun
- **Monorepo**: Turborepo

## ディレクトリ構造
```
apps/
  dashboard/     # メインダッシュボード (Next.js)
  api/           # tRPC API
  website/       # マーケティングサイト

packages/
  db/            # Drizzle ORM + スキーマ
  ui/            # 共有UIコンポーネント
  invoice/       # 請求書生成ロジック
  import/        # CSVインポート
  jobs/          # バックグラウンドジョブ
```

## i18n規約
- 翻訳ファイル: `apps/dashboard/src/locales/ja.ts`, `en.ts`
- フック: `useI18n()` from `@/locales/client`
- キー命名: `component.label` 形式（例: `tracker.name`, `forms.buttons.create`）

## 日本特有の機能
- 消費税計算（標準税率10%、軽減税率8%）
- 源泉徴収税計算
- インボイス制度対応（T番号）
- 日本の銀行フォーマットCSVインポート

---

## 品質保証ツール

### UI Skills
UIコード生成時は `/ui-skills` の制約に従う:
- Tailwind CSSデフォルト値を使用（カスタム値がない限り）
- アクセシブルなコンポーネント（Radix等）を使用
- アニメーションは必要な場合のみ、200ms以内
- グラデーション・グロー効果は避ける
- Flexbox/Grid優先、絶対位置指定は最小限に

### /rams
コード変更後は `/rams` でレビュー:
- アクセシビリティ（WCAG 2.1）
- ビジュアル一貫性（スペーシング、タイポグラフィ、色彩対比）
- UI品質（レイアウトエラー、フォーカス状態、ダークモード対応）

### 適用タイミング
1. **新規UIコンポーネント作成時**: `/ui-skills` を適用
2. **既存コンポーネント修正後**: `/rams` でレビュー
3. **Phase完了時**: 変更ファイルを `/rams` で一括レビュー

---

## 開発コマンド
```bash
# 開発サーバー起動
bun dev

# 型チェック
bun typecheck

# ビルド
bun build

# DBマイグレーション
bun db:migrate

# DBスキーマ生成
bun db:generate
```

## テスト・検証ルール

### サーバー起動ルール（必須）
**ブラウザでの動作確認・テスト実行前に、必ず以下のサーバーを起動/再起動すること：**

```bash
# 全サーバーを停止
lsof -ti:3001,3003 | xargs kill -9 2>/dev/null

# API サーバー起動 (port 3003)
source ~/.zshrc && cd ~/document/midday-jp && bun dev --filter=@midday/api

# Dashboard サーバー起動 (port 3001)
source ~/.zshrc && cd ~/document/midday-jp && bun dev --filter=@midday/dashboard
```

### 起動確認
- API: `http://localhost:3003` でサーバーが起動していること
- Dashboard: `http://localhost:3001` でサーバーが起動していること

### テスト前チェックリスト
1. [ ] API サーバーが起動中 (port 3003)
2. [ ] Dashboard サーバーが起動中 (port 3001)
3. [ ] 環境変数の変更後は必ずサーバー再起動
4. [ ] エラー発生時はまずサーバーログを確認

---

## 注意事項
- `.env` は絶対にGitにコミットしない
- 翻訳キーを追加したら `ja.ts` と `en.ts` 両方に追加
- 日本固有のビジネスロジックは `packages/invoice/src/utils/` に配置
