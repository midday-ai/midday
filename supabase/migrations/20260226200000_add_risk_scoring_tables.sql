-- Risk Configuration (per-team settings)
create table if not exists risk_config (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  preset text not null default 'balanced',
  weights jsonb not null default '{"consistency":0.25,"nsf":0.25,"velocity":0.15,"recovery":0.15,"progress":0.10,"amounts":0.10}',
  decay_half_life_days integer not null default 30,
  baseline_score integer not null default 50,
  event_impacts jsonb,
  band_thresholds jsonb not null default '{"low_max":33,"high_min":67}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint risk_config_team_id_unique unique (team_id)
);

create index if not exists idx_risk_config_team_id on risk_config(team_id);

-- Risk Scores (one per deal, upserted on each recalculation)
create table if not exists risk_scores (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  deal_id uuid not null references mca_deals(id) on delete cascade,
  overall_score numeric(5,2) not null default 50,
  previous_score numeric(5,2),
  band text not null default 'medium',
  sub_scores jsonb not null default '{}',
  calculated_at timestamptz not null default now(),
  triggering_payment_id uuid references mca_payments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint risk_scores_deal_id_unique unique (deal_id)
);

create index if not exists idx_risk_scores_team_id on risk_scores(team_id);
create index if not exists idx_risk_scores_deal_id on risk_scores(deal_id);
create index if not exists idx_risk_scores_band on risk_scores(band);

-- Risk Events (immutable log of events that influence the score)
create table if not exists risk_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  deal_id uuid not null references mca_deals(id) on delete cascade,
  payment_id uuid references mca_payments(id) on delete set null,
  event_type text not null,
  event_date timestamptz not null default now(),
  raw_impact numeric(5,2) not null default 0,
  decayed_impact numeric(5,2),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_risk_events_deal_id on risk_events(deal_id);
create index if not exists idx_risk_events_team_id on risk_events(team_id);
create index if not exists idx_risk_events_event_date on risk_events(event_date);

-- RLS Policies
alter table risk_config enable row level security;
alter table risk_scores enable row level security;
alter table risk_events enable row level security;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    EXECUTE 'CREATE POLICY "Team members can manage risk config" ON risk_config FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can manage risk scores" ON risk_scores FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
    EXECUTE 'CREATE POLICY "Team members can manage risk events" ON risk_events FOR ALL TO public USING (team_id IN (SELECT private.get_teams_for_authenticated_user()))';
  ELSE
    RAISE NOTICE 'Skipping RLS policies for risk tables — private schema not found (local dev)';
  END IF;
END $$;

-- Updated-at triggers (moddatetime extension may not be available in all environments)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
  CREATE TRIGGER set_risk_config_updated_at
    BEFORE UPDATE ON risk_config
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
  CREATE TRIGGER set_risk_scores_updated_at
    BEFORE UPDATE ON risk_scores
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping moddatetime triggers — extension not available: %', SQLERRM;
END $$;
