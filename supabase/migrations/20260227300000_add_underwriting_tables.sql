-- Underwriting System Tables
-- Adds application tracking, document management, and AI scoring
-- for the MCA underwriting workflow.

-- ============================================
-- 1. New Enums
-- ============================================

CREATE TYPE underwriting_application_status AS ENUM (
  'pending_documents',
  'in_review',
  'scoring',
  'approved',
  'declined',
  'review_needed'
);

CREATE TYPE underwriting_decision AS ENUM (
  'approved',
  'declined',
  'review_needed'
);

CREATE TYPE underwriting_doc_processing_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE underwriting_recommendation AS ENUM (
  'approve',
  'decline',
  'review_needed'
);

CREATE TYPE underwriting_confidence AS ENUM (
  'high',
  'medium',
  'low'
);

-- ============================================
-- 2. Underwriting Document Requirements
-- ============================================

CREATE TABLE underwriting_document_requirements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  required boolean DEFAULT true,
  applies_to_states text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_uw_doc_requirements_team_id ON underwriting_document_requirements(team_id);

ALTER TABLE underwriting_document_requirements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can view underwriting_document_requirements" ON underwriting_document_requirements FOR SELECT TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can insert underwriting_document_requirements" ON underwriting_document_requirements FOR INSERT TO public WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can update underwriting_document_requirements" ON underwriting_document_requirements FOR UPDATE TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team owners can delete underwriting_document_requirements" ON underwriting_document_requirements FOR DELETE TO public USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid() AND role = ''owner''))';
  ELSE
    RAISE NOTICE 'Skipping RLS policies for underwriting_document_requirements — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================
-- 3. Underwriting Applications
-- ============================================

CREATE TABLE underwriting_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status underwriting_application_status DEFAULT 'pending_documents',

  -- Requested funding details
  requested_amount_min numeric(12,2),
  requested_amount_max numeric(12,2),
  use_of_funds text,
  fico_range text,
  time_in_business_months integer,

  -- Broker / context
  broker_notes text,
  prior_mca_history text,

  -- Decision
  decision underwriting_decision,
  decision_date timestamptz,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_notes text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_uw_applications_merchant_id ON underwriting_applications(merchant_id);
CREATE INDEX idx_uw_applications_team_id ON underwriting_applications(team_id);
CREATE INDEX idx_uw_applications_status ON underwriting_applications(status);

ALTER TABLE underwriting_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can view underwriting_applications" ON underwriting_applications FOR SELECT TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can insert underwriting_applications" ON underwriting_applications FOR INSERT TO public WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can update underwriting_applications" ON underwriting_applications FOR UPDATE TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team owners can delete underwriting_applications" ON underwriting_applications FOR DELETE TO public USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid() AND role = ''owner''))';
  ELSE
    RAISE NOTICE 'Skipping RLS policies for underwriting_applications — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================
-- 4. Underwriting Documents
-- ============================================

CREATE TABLE underwriting_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES underwriting_applications(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES underwriting_document_requirements(id) ON DELETE SET NULL,

  -- File info
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  document_type text,

  -- Processing
  processing_status underwriting_doc_processing_status DEFAULT 'pending',
  extraction_results jsonb,

  -- Waiver
  waived boolean DEFAULT false,
  waive_reason text,

  -- Timestamps
  uploaded_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_uw_documents_application_id ON underwriting_documents(application_id);
CREATE INDEX idx_uw_documents_team_id ON underwriting_documents(team_id);
CREATE INDEX idx_uw_documents_requirement_id ON underwriting_documents(requirement_id);

ALTER TABLE underwriting_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can view underwriting_documents" ON underwriting_documents FOR SELECT TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can insert underwriting_documents" ON underwriting_documents FOR INSERT TO public WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can update underwriting_documents" ON underwriting_documents FOR UPDATE TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team owners can delete underwriting_documents" ON underwriting_documents FOR DELETE TO public USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid() AND role = ''owner''))';
  ELSE
    RAISE NOTICE 'Skipping RLS policies for underwriting_documents — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================
-- 5. Underwriting Scores
-- ============================================

CREATE TABLE underwriting_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES underwriting_applications(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- AI recommendation
  recommendation underwriting_recommendation,
  confidence underwriting_confidence,

  -- Detailed results
  buy_box_results jsonb,
  bank_analysis jsonb,
  extracted_metrics jsonb,
  risk_flags jsonb,
  prior_mca_flags jsonb,
  ai_narrative text,

  -- Timestamps
  scored_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_uw_scores_application_id ON underwriting_scores(application_id);
CREATE INDEX idx_uw_scores_team_id ON underwriting_scores(team_id);

ALTER TABLE underwriting_scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can view underwriting_scores" ON underwriting_scores FOR SELECT TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can insert underwriting_scores" ON underwriting_scores FOR INSERT TO public WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can update underwriting_scores" ON underwriting_scores FOR UPDATE TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policies for underwriting_scores — private schema not found (local dev)';
  END IF;
END $$;

-- ============================================
-- 6. ALTER existing tables
-- ============================================

-- Add underwriting_enabled flag to teams
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS underwriting_enabled boolean NOT NULL DEFAULT false;

-- Add underwriting_application_id FK to mca_deals
ALTER TABLE mca_deals
  ADD COLUMN IF NOT EXISTS underwriting_application_id uuid REFERENCES underwriting_applications(id) ON DELETE SET NULL;

CREATE INDEX idx_mca_deals_uw_application_id ON mca_deals(underwriting_application_id);
