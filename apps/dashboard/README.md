# Dashboard App

## 環境設定

### 1. Supabaseローカル環境の起動

```bash
# Supabase CLIがインストールされていることを確認
supabase --version

# Supabaseローカル環境を起動
supabase start
```

### 2. 環境変数の設定

`.env-example`をコピーして`.env`ファイルを作成し、以下の設定を追加：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
NEXT_PUBLIC_SUPABASE_ID=midday-local
NEXT_PUBLIC_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3003
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### 3. APIアプリの環境変数設定

`apps/api/.env-template`をコピーして`apps/api/.env`ファイルを作成し、以下の設定を追加：

```bash
# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# Engine
ENGINE_API_URL=http://localhost:3002
ENGINE_API_KEY=secret

# その他の設定
INVOICE_JWT_SECRET=secret
MIDDAY_ENCRYPTION_KEY=your-32-character-encryption-key-here
RESEND_API_KEY=dummy-key
```

### 4. 開発サーバーの起動

```bash
# プロジェクトルートで実行
bun run dev

# または個別に起動
cd apps/dashboard && bun run dev
```

### 5. アクセスURL

- **Dashboard App**: http://localhost:3001
- **Supabase Studio**: http://127.0.0.1:54323
- **API App**: http://localhost:3003
- **Engine**: http://localhost:3002

### 6. Supabase Studioログイン情報

- **Email**: `supabase_admin@admin.com`
- **Password**: `this_password_is_insecure_and_should_be_updated`

## 開発

```bash
# 依存関係のインストール
bun install

# 開発サーバーの起動
bun run dev

# ビルド
bun run build

# リント
bun run lint
```
