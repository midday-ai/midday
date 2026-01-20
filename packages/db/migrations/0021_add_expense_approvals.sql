-- 経費精算ワークフロー用のテーブルとenum追加
-- Phase 13: 経費精算ワークフロー（承認フロー機能）

-- 1. チームロールに承認者と閲覧者を追加
ALTER TYPE "teamRoles" ADD VALUE IF NOT EXISTS 'approver';
ALTER TYPE "teamRoles" ADD VALUE IF NOT EXISTS 'viewer';

-- 2. 経費承認ステータスenum作成
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_approval_status') THEN
    CREATE TYPE expense_approval_status AS ENUM (
      'draft',
      'pending',
      'approved',
      'rejected',
      'paid'
    );
  END IF;
END$$;

-- 3. アクティビティタイプに経費承認関連を追加
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'expense_submitted';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'expense_approved';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'expense_rejected';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'expense_paid';

-- 4. 経費承認テーブル作成
CREATE TABLE IF NOT EXISTS "expense_approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_id" uuid REFERENCES "transactions"("id") ON DELETE CASCADE,
  "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "requester_id" uuid NOT NULL REFERENCES "users"("id"),
  "approver_id" uuid REFERENCES "users"("id"),
  "status" expense_approval_status NOT NULL DEFAULT 'draft',
  "submitted_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "rejected_at" timestamp with time zone,
  "paid_at" timestamp with time zone,
  "rejection_reason" text,
  "amount" numeric(10, 2),
  "currency" text,
  "note" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. インデックス作成
CREATE INDEX IF NOT EXISTS "expense_approvals_team_id_idx" ON "expense_approvals" ("team_id");
CREATE INDEX IF NOT EXISTS "expense_approvals_requester_id_idx" ON "expense_approvals" ("requester_id");
CREATE INDEX IF NOT EXISTS "expense_approvals_approver_id_idx" ON "expense_approvals" ("approver_id");
CREATE INDEX IF NOT EXISTS "expense_approvals_status_idx" ON "expense_approvals" ("team_id", "status");
CREATE INDEX IF NOT EXISTS "expense_approvals_transaction_id_idx" ON "expense_approvals" ("transaction_id");

-- 6. RLSを有効化
ALTER TABLE "expense_approvals" ENABLE ROW LEVEL SECURITY;

-- 7. RLSポリシー作成
CREATE POLICY "Team members can view expense approvals" ON "expense_approvals"
  FOR SELECT TO public
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can insert expense approvals" ON "expense_approvals"
  FOR INSERT TO public
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Team members can update expense approvals" ON "expense_approvals"
  FOR UPDATE TO public
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

-- 8. 更新日時トリガー
CREATE OR REPLACE FUNCTION update_expense_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expense_approvals_updated_at_trigger
  BEFORE UPDATE ON "expense_approvals"
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_approvals_updated_at();
