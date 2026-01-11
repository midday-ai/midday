-- Create insight period type enum
CREATE TYPE insight_period_type AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Create insight status enum
CREATE TYPE insight_status AS ENUM ('pending', 'generating', 'completed', 'failed');

-- Create insights table
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Flexible period definition
    period_type insight_period_type NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    period_label VARCHAR(50),
    period_year SMALLINT NOT NULL,
    period_number SMALLINT NOT NULL,
    
    status insight_status NOT NULL DEFAULT 'pending',
    
    -- Selected 4 key metrics (dynamically chosen)
    selected_metrics JSONB,
    
    -- Full metrics snapshot (for drill-down)
    all_metrics JSONB,
    
    -- Detected anomalies and patterns
    anomalies JSONB,
    
    -- Streaks and milestones
    milestones JSONB,
    
    -- Activity context
    activity JSONB,
    
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- AI-generated content (relief-first structure)
    content JSONB,
    
    -- Future: voice
    audio_url TEXT,
    
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX insights_team_period_unique ON insights(team_id, period_type, period_year, period_number);
CREATE INDEX insights_team_id_idx ON insights(team_id);
CREATE INDEX insights_team_period_type_idx ON insights(team_id, period_type, generated_at DESC);

-- Enable RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Team members can view their insights" ON insights
    FOR SELECT
    TO public
    USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "System can insert insights" ON insights
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "System can update insights" ON insights
    FOR UPDATE
    TO service_role
    USING (true);
