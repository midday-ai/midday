-- ============================================================================
-- INSIGHTS FEATURE - Complete Migration
-- ============================================================================
-- AI-powered business insights with per-user read/dismiss tracking
-- ============================================================================

-- Create insight period type enum
CREATE TYPE insight_period_type AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Create insight status enum
CREATE TYPE insight_status AS ENUM ('pending', 'generating', 'completed', 'failed');

-- Add insight_ready to activity_type enum (for notifications)
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'insight_ready';

-- ============================================================================
-- INSIGHTS TABLE
-- ============================================================================

CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Flexible period definition
    period_type insight_period_type NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    period_year SMALLINT NOT NULL,
    period_number SMALLINT NOT NULL, -- Week 1-53, Month 1-12, Quarter 1-4
    
    status insight_status NOT NULL DEFAULT 'pending',
    
    -- Selected key metrics (dynamically chosen, typically 4)
    selected_metrics JSONB,
    
    -- Full metrics snapshot (for drill-down)
    all_metrics JSONB,
    
    -- Detected anomalies and patterns
    anomalies JSONB,
    
    -- Expense category anomalies (spikes, new categories, decreases)
    expense_anomalies JSONB,
    
    -- Streaks and milestones
    milestones JSONB,
    
    -- Activity context (invoices, time tracking, etc.)
    activity JSONB,
    
    currency VARCHAR(3) NOT NULL,
    
    -- AI-generated content (sentiment, opener, story, actions, celebration)
    content JSONB,
    
    -- Audio narration storage path: {teamId}/insights/{insightId}.mp3
    -- URLs generated on demand via presigned URLs
    audio_path TEXT,
    
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for insights table
CREATE UNIQUE INDEX insights_team_period_unique 
    ON insights(team_id, period_type, period_year, period_number);
CREATE INDEX insights_team_id_idx ON insights(team_id);
CREATE INDEX insights_team_period_type_idx 
    ON insights(team_id, period_type, generated_at DESC);
CREATE INDEX insights_status_idx ON insights(status);

-- Enable RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for insights
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

-- ============================================================================
-- INSIGHT USER STATUS TABLE (per-user read/dismiss tracking)
-- ============================================================================

CREATE TABLE insight_user_status (
    insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (insight_id, user_id)
);

-- Indexes for insight_user_status
CREATE INDEX insight_user_status_user_idx ON insight_user_status(user_id);
CREATE INDEX insight_user_status_insight_idx ON insight_user_status(insight_id);
CREATE INDEX insight_user_status_user_dismissed_idx 
    ON insight_user_status(user_id, dismissed_at) 
    WHERE dismissed_at IS NOT NULL;
CREATE INDEX insight_user_status_unread_idx 
    ON insight_user_status(user_id, insight_id) 
    WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE insight_user_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for insight_user_status
CREATE POLICY "Users can view their own insight status" ON insight_user_status
    FOR SELECT
    TO public
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own insight status" ON insight_user_status
    FOR INSERT
    TO public
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own insight status" ON insight_user_status
    FOR UPDATE
    TO public
    USING (user_id = auth.uid());

-- ============================================================================
-- ACTIVITY DATA INDEXES (optimize insights generation queries)
-- ============================================================================

-- Invoices: optimize sent/paid date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_team_sent_at_idx 
    ON invoices(team_id, sent_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_team_status_paid_at_idx 
    ON invoices(team_id, status, paid_at);

-- Tracker entries: optimize date range queries for time tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS tracker_entries_team_date_idx 
    ON tracker_entries(team_id, date);

-- Customers: composite for created_at range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS customers_team_created_at_idx 
    ON customers(team_id, created_at);

-- Inbox: optimize status + date range queries for receipt matching stats
CREATE INDEX CONCURRENTLY IF NOT EXISTS inbox_team_status_created_at_idx 
    ON inbox(team_id, status, created_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE insights IS 'AI-generated periodic business insights for teams';
COMMENT ON COLUMN insights.audio_path IS 'Storage path: {teamId}/insights/{insightId}.mp3 - URLs generated via presigned URLs';
COMMENT ON TABLE insight_user_status IS 'Per-user read and dismiss tracking for insights';
