-- Enums
CREATE TYPE computer_agent_source AS ENUM ('catalog', 'generated');
CREATE TYPE computer_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'waiting_approval');
CREATE TYPE computer_run_step_type AS ENUM ('tool_call', 'ai_generation', 'memory_read', 'memory_write', 'notification', 'proposal', 'connector_call', 'context');

-- computer_agents
CREATE TABLE computer_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  team_id uuid NOT NULL,
  name varchar(255) NOT NULL,
  slug varchar(255) NOT NULL,
  description text,
  source computer_agent_source NOT NULL,
  code text NOT NULL,
  template_id varchar(255),
  schedule_cron varchar(255),
  config jsonb,
  enabled boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT computer_agents_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT computer_agents_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT computer_agents_team_slug
    UNIQUE (team_id, slug)
);

CREATE INDEX computer_agents_team_id_idx ON computer_agents (team_id);
CREATE INDEX computer_agents_enabled_idx ON computer_agents (team_id, enabled);

ALTER TABLE computer_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage their computer agents"
  ON computer_agents
  AS PERMISSIVE
  FOR ALL
  TO public;

-- computer_runs
CREATE TABLE computer_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  agent_id uuid NOT NULL,
  team_id uuid NOT NULL,
  status computer_run_status NOT NULL DEFAULT 'pending',
  proposed_actions jsonb,
  summary text,
  error text,
  tool_call_count integer NOT NULL DEFAULT 0,
  llm_call_count integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT computer_runs_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES computer_agents(id) ON DELETE CASCADE,
  CONSTRAINT computer_runs_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX computer_runs_agent_id_idx ON computer_runs (agent_id);
CREATE INDEX computer_runs_team_id_idx ON computer_runs (team_id);
CREATE INDEX computer_runs_status_idx ON computer_runs (agent_id, status);

ALTER TABLE computer_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their computer runs"
  ON computer_runs
  AS PERMISSIVE
  FOR SELECT
  TO public;

-- computer_run_steps
CREATE TABLE computer_run_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  run_id uuid NOT NULL,
  type computer_run_step_type NOT NULL,
  name varchar(255) NOT NULL,
  input jsonb,
  output jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT computer_run_steps_run_id_fkey
    FOREIGN KEY (run_id) REFERENCES computer_runs(id) ON DELETE CASCADE
);

CREATE INDEX computer_run_steps_run_id_idx ON computer_run_steps (run_id);

ALTER TABLE computer_run_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their computer run steps"
  ON computer_run_steps
  AS PERMISSIVE
  FOR SELECT
  TO public;

-- computer_agent_memory
CREATE TABLE computer_agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  agent_id uuid NOT NULL,
  team_id uuid NOT NULL,
  key varchar(255) NOT NULL,
  content text NOT NULL,
  type varchar(100),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT computer_agent_memory_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES computer_agents(id) ON DELETE CASCADE,
  CONSTRAINT computer_agent_memory_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT computer_agent_memory_agent_key
    UNIQUE (agent_id, key)
);

CREATE INDEX computer_agent_memory_agent_id_idx ON computer_agent_memory (agent_id);
CREATE INDEX computer_agent_memory_team_id_idx ON computer_agent_memory (team_id);

ALTER TABLE computer_agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage their computer agent memory"
  ON computer_agent_memory
  AS PERMISSIVE
  FOR ALL
  TO public;
