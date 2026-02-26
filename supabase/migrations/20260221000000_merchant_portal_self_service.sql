-- Merchant Portal Self-Service: messages, documents, notifications
-- Also extends portal sessions to support 30-day sessions

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE merchant_message_status AS ENUM ('pending', 'read', 'replied', 'archived');
CREATE TYPE merchant_message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE merchant_document_type AS ENUM ('contract', 'disclosure', 'payoff_letter', 'monthly_statement', 'tax_doc', 'other');
CREATE TYPE merchant_notification_type AS ENUM ('payment_received', 'payment_nsf', 'payoff_approved', 'message_received', 'document_uploaded', 'balance_alert', 'deal_paid_off', 'general');

-- ============================================================================
-- Merchant Messages
-- ============================================================================

CREATE TABLE merchant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  direction merchant_message_direction NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,

  status merchant_message_status NOT NULL DEFAULT 'pending',
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,

  from_email TEXT,
  from_name TEXT,
  sent_by_user_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES merchant_portal_sessions(id)
);

CREATE INDEX merchant_messages_merchant_idx ON merchant_messages(merchant_id);
CREATE INDEX merchant_messages_team_idx ON merchant_messages(team_id);
CREATE INDEX merchant_messages_status_idx ON merchant_messages(status);
CREATE INDEX merchant_messages_created_at_idx ON merchant_messages(created_at DESC);

ALTER TABLE merchant_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage merchant messages" ON merchant_messages FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy for merchant_messages — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================================================
-- Merchant Documents
-- ============================================================================

CREATE TABLE merchant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES mca_deals(id) ON DELETE CASCADE,

  document_type merchant_document_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',

  visible_in_portal BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id)
);

CREATE INDEX merchant_documents_merchant_idx ON merchant_documents(merchant_id);
CREATE INDEX merchant_documents_team_idx ON merchant_documents(team_id);
CREATE INDEX merchant_documents_type_idx ON merchant_documents(document_type);
CREATE INDEX merchant_documents_deal_idx ON merchant_documents(deal_id);

ALTER TABLE merchant_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage merchant documents" ON merchant_documents FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy for merchant_documents — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================================================
-- Merchant Notifications
-- ============================================================================

CREATE TABLE merchant_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  notification_type merchant_notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,

  read_in_portal BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  deal_id UUID REFERENCES mca_deals(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES mca_payments(id) ON DELETE SET NULL
);

CREATE INDEX merchant_notifications_merchant_idx ON merchant_notifications(merchant_id);
CREATE INDEX merchant_notifications_team_idx ON merchant_notifications(team_id);
CREATE INDEX merchant_notifications_unread_idx ON merchant_notifications(merchant_id, read_in_portal) WHERE read_in_portal = false;
CREATE INDEX merchant_notifications_created_at_idx ON merchant_notifications(created_at DESC);

ALTER TABLE merchant_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage merchant notifications" ON merchant_notifications FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy for merchant_notifications — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================================================
-- Schema Additions to Existing Tables
-- ============================================================================

-- Extend merchant_portal_sessions for 30-day sessions and biometric support
ALTER TABLE merchant_portal_sessions
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'magic_link',
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Add notification preferences to merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_sms BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_phone TEXT;
