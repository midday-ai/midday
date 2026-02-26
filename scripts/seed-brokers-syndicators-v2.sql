-- ============================================================================
-- DEPRECATED: Use `supabase db reset` which runs supabase/seed.sql.
-- This file is kept for reference only. All seed data is now consolidated
-- in supabase/seed.sql for deterministic, single-command seeding.
-- ============================================================================
-- Original description:
-- Seed brokers, syndicators, broker commissions, syndication participants
-- Fixes gap: these entities were missing from local DB

BEGIN;

-- ============================================================================
-- BROKERS (3 brokers with hardcoded UUIDs)
-- ============================================================================
INSERT INTO brokers (
  id, team_id, name, email, phone, company_name, website,
  address_line_1, city, state, zip, country,
  commission_percentage, portal_enabled, status
) VALUES
('b0000000-0000-0000-0000-000000000001'::uuid,
 'a0000000-0000-0000-0000-000000000001'::uuid,
 'David Chen', 'david.chen@pinnaclefunding.com', '(212) 555-0101',
 'Pinnacle Funding Group', 'https://pinnaclefunding.com',
 '350 Fifth Avenue', 'New York', 'NY', '10118', 'US',
 10.00, true, 'active'),

('b0000000-0000-0000-0000-000000000002'::uuid,
 'a0000000-0000-0000-0000-000000000001'::uuid,
 'Marcus Williams', 'marcus@capitalbrokers.com', '(305) 555-0202',
 'Capital Brokers LLC', 'https://capitalbrokers.com',
 '100 SE 2nd Street', 'Miami', 'FL', '33131', 'US',
 11.00, true, 'active'),

('b0000000-0000-0000-0000-000000000003'::uuid,
 'a0000000-0000-0000-0000-000000000001'::uuid,
 'Sarah Rodriguez', 'sarah@southwestfunding.com', '(602) 555-0303',
 'Southwest Funding Partners', 'https://southwestfunding.com',
 '2 N Central Ave', 'Phoenix', 'AZ', '85004', 'US',
 11.00, false, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SYNDICATORS (3 syndicators with hardcoded UUIDs)
-- ============================================================================
INSERT INTO syndicators (
  id, team_id, name, email, phone, company_name, website,
  address_line_1, city, state, zip, country,
  portal_enabled, status
) VALUES
('c0000000-0000-0000-0000-000000000001'::uuid,
 'a0000000-0000-0000-0000-000000000001'::uuid,
 'Richard Park', 'rpark@apexcapital.com', '(312) 555-0401',
 'Apex Capital Partners', 'https://apexcapitalpartners.com',
 '233 S Wacker Dr', 'Chicago', 'IL', '60606', 'US',
 true, 'active'),

('c0000000-0000-0000-0000-000000000002'::uuid,
 'a0000000-0000-0000-0000-000000000001'::uuid,
 'Jennifer Walsh', 'jwalsh@harborfunding.com', '(617) 555-0502',
 'Harbor Funding Group', 'https://harborfundinggroup.com',
 '1 Federal Street', 'Boston', 'MA', '02110', 'US',
 true, 'active'),

('c0000000-0000-0000-0000-000000000003'::uuid,
 'a0000000-0000-0000-0000-000000000001'::uuid,
 'Michael Torres', 'mtorres@meridianinvestors.com', '(415) 555-0603',
 'Meridian Investors', 'https://meridianinvestors.com',
 '101 California St', 'San Francisco', 'CA', '94111', 'US',
 false, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ASSIGN BROKERS TO DEALS
-- ============================================================================
-- Pinnacle Funding Group (David Chen) - 4 deals
UPDATE mca_deals SET broker_id = 'b0000000-0000-0000-0000-000000000001'::uuid
WHERE deal_code IN ('MCA-2025-001', 'MCA-2025-003', 'MCA-2024-002', 'MCA-2026-002')
  AND team_id = 'a0000000-0000-0000-0000-000000000001';

-- Capital Brokers LLC (Marcus Williams) - 3 deals
UPDATE mca_deals SET broker_id = 'b0000000-0000-0000-0000-000000000002'::uuid
WHERE deal_code IN ('MCA-2025-005', 'MCA-2025-006', 'MCA-2024-001')
  AND team_id = 'a0000000-0000-0000-0000-000000000001';

-- Southwest Funding Partners (Sarah Rodriguez) - 3 deals
UPDATE mca_deals SET broker_id = 'b0000000-0000-0000-0000-000000000003'::uuid
WHERE deal_code IN ('MCA-2025-004', 'MCA-2026-001', 'MCA-2024-003')
  AND team_id = 'a0000000-0000-0000-0000-000000000001';

-- ============================================================================
-- BROKER COMMISSIONS (one per deal-broker pair)
-- ============================================================================
INSERT INTO broker_commissions (
  deal_id, broker_id, team_id,
  commission_percentage, commission_amount,
  status, paid_at, note
)
SELECT
  d.id, d.broker_id, d.team_id,
  b.commission_percentage,
  ROUND((d.funding_amount * b.commission_percentage / 100)::numeric, 2),
  CASE
    WHEN d.status IN ('paid_off', 'active') THEN 'paid'
    ELSE 'pending'
  END,
  CASE
    WHEN d.status IN ('paid_off', 'active') THEN d.funded_at + interval '7 days'
    ELSE NULL
  END,
  CASE
    WHEN d.status IN ('paid_off', 'active') THEN 'Commission paid at funding'
    ELSE 'Pending until deal funding complete'
  END
FROM mca_deals d
JOIN brokers b ON d.broker_id = b.id
WHERE d.team_id = 'a0000000-0000-0000-0000-000000000001'
  AND d.broker_id IS NOT NULL
ON CONFLICT (deal_id, broker_id) DO NOTHING;

-- ============================================================================
-- SYNDICATION PARTICIPANTS
-- ============================================================================
-- Apex Capital Partners participates in 4 deals (large investor)
INSERT INTO syndication_participants (
  deal_id, syndicator_id, team_id,
  funding_share, ownership_percentage, status, note
)
SELECT d.id, 'c0000000-0000-0000-0000-000000000001'::uuid, d.team_id,
  sp.share, sp.pct, sp.status, sp.note
FROM mca_deals d
JOIN (VALUES
  ('MCA-2026-002', 24000.00, 0.3000, 'active', 'Lead syndicate position'),
  ('MCA-2025-006', 22500.00, 0.3000, 'active', 'Co-lead with Harbor'),
  ('MCA-2024-002', 22500.00, 0.3000, 'bought_out', 'Bought out at deal payoff'),
  ('MCA-2025-005', 14000.00, 0.2000, 'active', 'Secondary position')
) sp(deal_code, share, pct, status, note) ON d.deal_code = sp.deal_code
WHERE d.team_id = 'a0000000-0000-0000-0000-000000000001'
ON CONFLICT (deal_id, syndicator_id) DO NOTHING;

-- Harbor Funding Group participates in 3 deals
INSERT INTO syndication_participants (
  deal_id, syndicator_id, team_id,
  funding_share, ownership_percentage, status, note
)
SELECT d.id, 'c0000000-0000-0000-0000-000000000002'::uuid, d.team_id,
  sp.share, sp.pct, sp.status, sp.note
FROM mca_deals d
JOIN (VALUES
  ('MCA-2026-002', 16000.00, 0.2000, 'active', 'Minority position'),
  ('MCA-2025-006', 18750.00, 0.2500, 'active', 'Co-lead with Apex'),
  ('MCA-2025-001', 16250.00, 0.2500, 'active', 'Early stage investment')
) sp(deal_code, share, pct, status, note) ON d.deal_code = sp.deal_code
WHERE d.team_id = 'a0000000-0000-0000-0000-000000000001'
ON CONFLICT (deal_id, syndicator_id) DO NOTHING;

-- Meridian Investors participates in 2 deals (smaller, newer investor)
INSERT INTO syndication_participants (
  deal_id, syndicator_id, team_id,
  funding_share, ownership_percentage, status, note
)
SELECT d.id, 'c0000000-0000-0000-0000-000000000003'::uuid, d.team_id,
  sp.share, sp.pct, sp.status, sp.note
FROM mca_deals d
JOIN (VALUES
  ('MCA-2026-002', 8000.00, 0.1000, 'active', 'First syndication deal'),
  ('MCA-2026-001', 8000.00, 0.2000, 'active', 'Growing position with new deals')
) sp(deal_code, share, pct, status, note) ON d.deal_code = sp.deal_code
WHERE d.team_id = 'a0000000-0000-0000-0000-000000000001'
ON CONFLICT (deal_id, syndicator_id) DO NOTHING;

-- ============================================================================
-- ADD BROKER FEES TO DEAL_FEES (now that brokers are assigned)
-- ============================================================================
INSERT INTO deal_fees (deal_id, team_id, fee_type, fee_name, amount, percentage)
SELECT d.id, d.team_id, 'broker', 'Broker Commission',
  ROUND((d.funding_amount * b.commission_percentage / 100)::numeric, 2),
  b.commission_percentage / 100
FROM mca_deals d
JOIN brokers b ON d.broker_id = b.id
WHERE d.team_id = 'a0000000-0000-0000-0000-000000000001'
  AND d.broker_id IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;
