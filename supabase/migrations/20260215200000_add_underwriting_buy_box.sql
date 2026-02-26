-- Underwriting Buy Box: per-team criteria for evaluating MCA deals
CREATE TABLE IF NOT EXISTS underwriting_buy_box (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  min_monthly_revenue numeric(12, 2),
  min_time_in_business integer, -- months
  max_existing_positions integer,
  min_avg_daily_balance numeric(12, 2),
  max_nsf_count integer,
  excluded_industries text[],
  min_credit_score integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT underwriting_buy_box_team_id_unique UNIQUE (team_id)
);

CREATE INDEX idx_underwriting_buy_box_team_id ON underwriting_buy_box (team_id);

ALTER TABLE underwriting_buy_box ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage underwriting buy box"
      ON underwriting_buy_box FOR ALL TO public
      USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policy — private schema not found (local dev)';
  END IF;
END $$;
