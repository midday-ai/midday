-- One-time migration: Seed default collection stages for all existing teams
-- that don't already have any stages configured.
--
-- Usage: Run via Supabase SQL editor or psql
--
-- This is idempotent — safe to run multiple times.
-- Matches DEFAULT_STAGES from packages/db/src/queries/collection-config.ts

INSERT INTO collection_stages (team_id, name, slug, color, position, is_default, is_terminal)
SELECT
  t.id AS team_id,
  s.name,
  s.slug,
  s.color,
  s.position,
  s.is_default,
  s.is_terminal
FROM teams t
CROSS JOIN (
  VALUES
    ('Early Contact',   'early-contact',   '#3B82F6', 1, true,  false),
    ('Promise to Pay',  'promise-to-pay',  '#8B5CF6', 2, false, false),
    ('Payment Plan',    'payment-plan',    '#6366F1', 3, false, false),
    ('Escalated',       'escalated',       '#F59E0B', 4, false, false),
    ('Legal Review',    'legal-review',    '#EF4444', 5, false, false),
    ('Agency Referral', 'agency-referral', '#DC2626', 6, false, false),
    ('Resolved',        'resolved',        '#16A34A', 7, false, true)
) AS s(name, slug, color, position, is_default, is_terminal)
WHERE NOT EXISTS (
  SELECT 1
  FROM collection_stages cs
  WHERE cs.team_id = t.id
);
