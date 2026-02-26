-- ============================================================================
-- Collections Module: Enums, Tables, Indexes, Foreign Keys, RLS Policies
-- ============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE collection_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE collection_outcome AS ENUM ('paid_in_full', 'settled', 'payment_plan', 'defaulted', 'written_off', 'sent_to_agency');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE collection_contact_method AS ENUM ('phone', 'email', 'text', 'in_person', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE collection_notification_type AS ENUM ('follow_up_due', 'sla_breach', 'escalation', 'assignment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE collection_escalation_trigger AS ENUM ('time_based', 'event_based');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE collection_sla_metric AS ENUM ('time_in_stage', 'response_time', 'resolution_time');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Tables
-- ============================================================================

-- Collection Stages (configurable workflow per team)
CREATE TABLE IF NOT EXISTS collection_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  position integer NOT NULL,
  color text DEFAULT '#6B7280',
  is_default boolean DEFAULT false,
  is_terminal boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, slug)
);

CREATE INDEX IF NOT EXISTS collection_stages_team_id_idx ON collection_stages(team_id);

-- Collection Agencies (external collection agencies)
CREATE TABLE IF NOT EXISTS collection_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collection_agencies_team_id_idx ON collection_agencies(team_id);

-- Collection Cases (links a deal to a collections workflow)
CREATE TABLE IF NOT EXISTS collection_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES mca_deals(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES collection_stages(id),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  priority collection_priority DEFAULT 'medium',
  outcome collection_outcome,
  agency_id uuid REFERENCES collection_agencies(id) ON DELETE SET NULL,
  next_follow_up timestamptz,
  stage_entered_at timestamptz DEFAULT now(),
  entered_collections_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (deal_id)
);

CREATE INDEX IF NOT EXISTS collection_cases_team_id_idx ON collection_cases(team_id);
CREATE INDEX IF NOT EXISTS collection_cases_deal_id_idx ON collection_cases(deal_id);
CREATE INDEX IF NOT EXISTS collection_cases_stage_id_idx ON collection_cases(stage_id);
CREATE INDEX IF NOT EXISTS collection_cases_assigned_to_idx ON collection_cases(assigned_to);

-- Collection Notes (activity log on a case)
CREATE TABLE IF NOT EXISTS collection_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES collection_cases(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  contact_name text,
  contact_method collection_contact_method,
  follow_up_date timestamptz,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collection_notes_case_id_idx ON collection_notes(case_id);

-- Escalation Rules (auto-transition cases between stages)
CREATE TABLE IF NOT EXISTS collection_escalation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  trigger_type collection_escalation_trigger NOT NULL,
  from_stage_id uuid NOT NULL REFERENCES collection_stages(id) ON DELETE CASCADE,
  to_stage_id uuid NOT NULL REFERENCES collection_stages(id) ON DELETE CASCADE,
  condition jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collection_escalation_rules_team_id_idx ON collection_escalation_rules(team_id);

-- SLA Configs (thresholds for time-based alerts)
CREATE TABLE IF NOT EXISTS collection_sla_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES collection_stages(id) ON DELETE CASCADE,
  metric collection_sla_metric NOT NULL,
  threshold_minutes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collection_sla_configs_team_id_idx ON collection_sla_configs(team_id);

-- Collection Notifications (per-user in-app notifications)
CREATE TABLE IF NOT EXISTS collection_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES collection_cases(id) ON DELETE CASCADE,
  type collection_notification_type NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collection_notifications_user_id_idx ON collection_notifications(user_id);
CREATE INDEX IF NOT EXISTS collection_notifications_case_id_idx ON collection_notifications(case_id);

-- ============================================================================
-- Team Member Permission Column
-- ============================================================================

ALTER TABLE users_on_team
  ADD COLUMN IF NOT EXISTS has_collections_permission boolean DEFAULT false;

-- ============================================================================
-- RLS Policies (skip if private schema doesn't exist — local dev)
-- ============================================================================

ALTER TABLE collection_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sla_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Team-based policies
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage collection stages" ON collection_stages FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can manage collection agencies" ON collection_agencies FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can manage collection cases" ON collection_cases FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can manage collection notes" ON collection_notes FOR ALL TO public USING (case_id IN (SELECT cc.id FROM collection_cases cc WHERE cc.team_id IN (SELECT private.get_teams_for_authenticated_user())))';
    EXECUTE 'CREATE POLICY "Team members can manage escalation rules" ON collection_escalation_rules FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can manage SLA configs" ON collection_sla_configs FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Users can view their own notifications" ON collection_notifications FOR ALL TO public USING (user_id = auth.uid())';
  ELSE
    RAISE NOTICE 'Skipping RLS policies for collections — private schema not found (local dev)';
  END IF;
END $$;
