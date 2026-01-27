-- Enable realtime on insights table
-- This allows the dashboard to receive live updates when new insights are generated

ALTER PUBLICATION supabase_realtime ADD TABLE insights;

-- RLS SELECT policy for insights (same pattern as inbox)
-- Uses the shared team membership function
CREATE POLICY "Insights can be selected by a member of the team" ON insights
    FOR SELECT
    TO public
    USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
