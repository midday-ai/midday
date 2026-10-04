-- Drop the get_team_limits_metrics function that reads from the matview
DROP FUNCTION IF EXISTS get_team_limits_metrics(uuid);

-- Drop the team_limits_metrics materialized view
DROP MATERIALIZED VIEW IF EXISTS team_limits_metrics;
