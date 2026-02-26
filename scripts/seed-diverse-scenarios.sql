-- ============================================================================
-- DEPRECATED: Use `supabase db reset` which runs supabase/seed.sql.
-- This file is kept for reference only. All seed data is now consolidated
-- in supabase/seed.sql for deterministic, single-command seeding.
-- ============================================================================
-- Original description:
-- Diverse MCA Scenarios Seed Data
-- Real-world edge cases and situations an MCA operator would encounter
-- ============================================================================

BEGIN;

-- ============================================================================
-- SCENARIO 1: "NSF STORM" - Merchant with consecutive bounced payments
-- Tony's Pizzeria (MCA-2025-004, status: late) has been struggling
-- ============================================================================

-- Add a sequence of NSF payments showing deteriorating collection
INSERT INTO mca_payments (deal_id, team_id, amount, payment_date, payment_type, status, description, nsf_at, nsf_fee, balance_before, balance_after)
SELECT d.id, d.team_id, p.amount, p.pay_date::date, 'ach', p.status, p.description,
  CASE WHEN p.status = 'returned' THEN p.pay_date::timestamptz + interval '2 days' ELSE NULL END,
  CASE WHEN p.status = 'returned' THEN 35.00 ELSE NULL END,
  p.bal_before, p.bal_after
FROM mca_deals d
CROSS JOIN (VALUES
  -- Normal payments, then NSFs start
  (472.22, '2026-02-10', 'completed', 'Daily ACH payment', NULL, 62000.00, 61527.78),
  (472.22, '2026-02-11', 'completed', 'Daily ACH payment', NULL, 61527.78, 61055.56),
  (472.22, '2026-02-12', 'returned', 'RETURNED - NSF', NULL, 61055.56, 61055.56),
  (472.22, '2026-02-13', 'returned', 'RETURNED - NSF', NULL, 61055.56, 61055.56),
  (472.22, '2026-02-14', 'returned', 'RETURNED - NSF', NULL, 61055.56, 61055.56),
  -- Partial recovery
  (472.22, '2026-02-18', 'completed', 'Daily ACH payment - recovered', NULL, 61055.56, 60583.34),
  (472.22, '2026-02-19', 'completed', 'Daily ACH payment', NULL, 60583.34, 60111.12),
  (472.22, '2026-02-20', 'returned', 'RETURNED - NSF (again)', NULL, 60111.12, 60111.12),
  (472.22, '2026-02-21', 'returned', 'RETURNED - NSF', NULL, 60111.12, 60111.12),
  (472.22, '2026-02-24', 'pending', 'Daily ACH payment - retry', NULL, 60111.12, NULL)
) p(amount, pay_date, status, description, nsf_at_unused, bal_before, bal_after)
WHERE d.deal_code = 'MCA-2025-004' AND d.team_id = 'a0000000-0000-4000-a000-000000000001'
ON CONFLICT DO NOTHING;

-- Notification about NSF storm
INSERT INTO merchant_notifications (
  merchant_id, team_id, notification_type, title, message, email_sent, deal_id
)
SELECT d.merchant_id, d.team_id,
  'payment_nsf'::merchant_notification_type,
  'URGENT: Multiple Payment Failures - ' || d.deal_code,
  'You have had 5 returned payments in the last 2 weeks. Please contact us immediately to discuss your account. Continued non-payment may result in default proceedings.',
  true, d.id
FROM mca_deals d
WHERE d.deal_code = 'MCA-2025-004' AND d.team_id = 'a0000000-0000-4000-a000-000000000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCENARIO 2: "EARLY PAYOFF REQUEST" - Successful merchant wants out early
-- Fitness First Gym (MCA-2026-002) is doing well and wants early payoff
-- ============================================================================

-- Strong payment history
INSERT INTO mca_payments (deal_id, team_id, amount, payment_date, payment_type, status, description, balance_before, balance_after)
SELECT d.id, d.team_id, 557.27, gs::date, 'ach', 'completed',
  'Daily ACH payment',
  d.payback_amount - (557.27 * (gs::date - '2026-01-15'::date)::int),
  d.payback_amount - (557.27 * ((gs::date - '2026-01-15'::date)::int + 1))
FROM mca_deals d,
  generate_series('2026-01-15'::date, '2026-02-24'::date, '1 day'::interval) gs
WHERE d.deal_code = 'MCA-2026-002' AND d.team_id = 'a0000000-0000-4000-a000-000000000001'
  AND extract(dow from gs) NOT IN (0, 6)  -- Weekdays only
ON CONFLICT DO NOTHING;

-- Message from merchant about early payoff
INSERT INTO merchant_messages (
  merchant_id, team_id, direction, subject, message, status, from_email, from_name
)
SELECT d.merchant_id, d.team_id,
  'inbound'::merchant_message_direction,
  'Early Payoff Inquiry',
  'Hi team, our gym has been doing really well this quarter with the new year fitness rush. We are interested in paying off the remaining balance early. What would the payoff amount be? Is there any discount for early settlement? We could potentially wire the full amount this week. Thanks, Alex',
  'pending'::merchant_message_status,
  'alex@fitnessfirstgym.com', 'Alex Morgan'
FROM mca_deals d
WHERE d.deal_code = 'MCA-2026-002' AND d.team_id = 'a0000000-0000-4000-a000-000000000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCENARIO 3: "SEASONAL SLOWDOWN" - Construction company affected by winter
-- Westside Construction LLC (MCA-2025-006, status: late)
-- ============================================================================

-- Mix of successful and failed payments showing seasonal pattern
INSERT INTO mca_payments (deal_id, team_id, amount, payment_date, payment_type, status, description, nsf_at, nsf_fee)
SELECT d.id, d.team_id, p.amount, p.pay_date::date, 'ach', p.status, p.description,
  CASE WHEN p.status = 'returned' THEN p.pay_date::timestamptz + interval '2 days' ELSE NULL END,
  CASE WHEN p.status = 'returned' THEN 35.00 ELSE NULL END
FROM mca_deals d
CROSS JOIN (VALUES
  -- Weekly payments (construction gets weekly schedule)
  (2187.50, '2026-01-06', 'completed', 'Weekly ACH payment'),
  (2187.50, '2026-01-13', 'completed', 'Weekly ACH payment'),
  (2187.50, '2026-01-20', 'returned', 'RETURNED - NSF (winter slowdown)'),
  (2187.50, '2026-01-27', 'returned', 'RETURNED - NSF'),
  (2187.50, '2026-02-03', 'completed', 'Weekly ACH payment - partial recovery'),
  (2187.50, '2026-02-10', 'returned', 'RETURNED - NSF'),
  (2187.50, '2026-02-17', 'completed', 'Weekly ACH payment'),
  (2187.50, '2026-02-24', 'pending', 'Weekly ACH payment - pending')
) p(amount, pay_date, status, description)
WHERE d.deal_code = 'MCA-2025-006' AND d.team_id = 'a0000000-0000-4000-a000-000000000001'
ON CONFLICT DO NOTHING;

-- Message from merchant explaining
INSERT INTO merchant_messages (
  merchant_id, team_id, direction, subject, message, status, from_email, from_name
)
SELECT d.merchant_id, d.team_id,
  'inbound'::merchant_message_direction,
  'Winter Slowdown - Payment Issues',
  'Hi, I wanted to explain the bounced payments. Construction is very slow in winter and we have minimal projects right now. I expect things to pick back up in March when the weather improves. Can we work out a reduced payment schedule for the next 4-6 weeks? I want to keep current but the cash flow just is not there right now.',
  'read'::merchant_message_status,
  'jim@westsideconstruction.com', 'Jim Westfield'
FROM mca_deals d
WHERE d.deal_code = 'MCA-2025-006' AND d.team_id = 'a0000000-0000-4000-a000-000000000001'
ON CONFLICT DO NOTHING;

-- Response from team
INSERT INTO merchant_messages (
  merchant_id, team_id, direction, subject, message, status, sent_by_user_id, from_name
)
SELECT d.merchant_id, d.team_id,
  'outbound'::merchant_message_direction,
  'RE: Winter Slowdown - Payment Issues',
  'Hi Jim, we understand seasonal fluctuations. We can temporarily reduce to half-payments ($1,093.75/week) for the next 6 weeks, with the shortfall added to the remaining balance. The adjusted schedule will start next Monday. Please ensure the half-payment goes through consistently.',
  'read'::merchant_message_status,
  '00000000-0000-4000-a000-000000000001'::uuid, 'Suphian Tweel'
FROM mca_deals d
WHERE d.deal_code = 'MCA-2025-006' AND d.team_id = 'a0000000-0000-4000-a000-000000000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCENARIO 4: "SUCCESSFUL PAYOFF" - Deal that completed normally
-- Martinez Auto Repair (MCA-2024-001, status: paid_off)
-- ============================================================================

-- Final payments leading to payoff
INSERT INTO mca_payments (deal_id, team_id, amount, payment_date, payment_type, status, description, balance_before, balance_after)
SELECT d.id, d.team_id, p.amount, p.pay_date::date, p.pay_type, 'completed', p.description, p.bal_before, p.bal_after
FROM mca_deals d
CROSS JOIN (VALUES
  (357.14, '2024-11-25', 'ach', 'Daily ACH payment', 2142.84, 1785.70),
  (357.14, '2024-11-26', 'ach', 'Daily ACH payment', 1785.70, 1428.56),
  (357.14, '2024-11-27', 'ach', 'Daily ACH payment', 1428.56, 1071.42),
  (357.14, '2024-12-02', 'ach', 'Daily ACH payment', 1071.42, 714.28),
  (357.14, '2024-12-03', 'ach', 'Daily ACH payment', 714.28, 357.14),
  (357.14, '2024-12-04', 'ach', 'Final daily payment - PAID OFF', 357.14, 0.00)
) p(amount, pay_date, pay_type, description, bal_before, bal_after)
WHERE d.deal_code = 'MCA-2024-001' AND d.team_id = 'a0000000-0000-4000-a000-000000000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCENARIO 5: "STACKING DETECTION" - Merchant suspected of having multiple MCAs
-- Sunrise Diner (MCA-2025-001) - unusual bank activity suggests stacking
-- ============================================================================

-- Add reconciliation note about suspicious activity
UPDATE transactions
SET
  reconciliation_note = 'ATTENTION: Possible stacking detected. Multiple large ACH debits from unknown MCA providers (Rapid Advance LLC, QuickFund Capital). Review merchant bank statements.',
  discrepancy_type = 'unrecognized'::discrepancy_type,
  match_status = 'flagged'::match_status
WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
  AND name LIKE '%Sunrise Diner%'
  AND match_status = 'auto_matched'
  AND id IN (
    SELECT id FROM transactions
    WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
      AND name LIKE '%Sunrise Diner%'
      AND match_status = 'auto_matched'
    ORDER BY date DESC
    LIMIT 3
  );

-- ============================================================================
-- SCENARIO 6: "BROKER COMMISSION DISPUTE"
-- Southwest Funding Partners disputes commission on a deal
-- ============================================================================

-- Add a cancelled commission (was disputed and resolved)
UPDATE broker_commissions
SET status = 'pending', paid_at = NULL,
    note = 'DISPUTED: Broker claims 12% was agreed upon verbally, contract shows 11%. Under review by legal.'
WHERE broker_id = 'b0000000-0000-4000-a000-000000000003'::uuid
  AND deal_id = (SELECT id FROM mca_deals WHERE deal_code = 'MCA-2025-004' AND team_id = 'a0000000-0000-4000-a000-000000000001')
  AND team_id = 'a0000000-0000-4000-a000-000000000001';

-- ============================================================================
-- SCENARIO 7: "RECONCILIATION DISCREPANCY" - Bank shows different amounts
-- Some transactions have amount mismatches
-- ============================================================================

-- Flag some auto-matched transactions as having discrepancies
UPDATE transactions
SET
  match_status = 'flagged'::match_status,
  discrepancy_type = 'partial_payment'::discrepancy_type,
  reconciliation_note = 'Bank amount ($' || ROUND(ABS(amount)::numeric, 2) || ') does not match expected daily payment. Possible bank fee deduction or split payment.'
WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
  AND match_status = 'auto_matched'
  AND amount > 0 AND amount < 400
  AND id IN (
    SELECT id FROM transactions
    WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
      AND match_status = 'auto_matched' AND amount > 0 AND amount < 400
    ORDER BY random()
    LIMIT 4
  );

-- ============================================================================
-- SCENARIO 8: "NEW DEAL IN PIPELINE" - Deal being underwritten
-- Add a disclosure in generating status (new deal not yet funded)
-- ============================================================================

-- Note: We use an existing deal but add a second disclosure for a renewal
INSERT INTO disclosures (
  deal_id, team_id, state_code, disclosure_type, template_version,
  status, figures, generated_by, deal_snapshot
)
SELECT d.id, d.team_id,
  'NY', 'mca', 'ny-mca-v2.2',
  'generating',
  jsonb_build_object(
    'funded_amount', 85000.00,
    'payback_amount', 119000.00,
    'factor_rate', 1.40,
    'apr_equivalent', 0.8111,
    'total_cost_of_capital', 34000.00,
    'daily_payment', 660.56,
    'estimated_term_days', 180,
    'renewal_of', d.deal_code
  ),
  '00000000-0000-4000-a000-000000000001'::uuid,
  jsonb_build_object('deal_code', d.deal_code, 'type', 'renewal', 'original_funding', d.funding_amount)
FROM mca_deals d
WHERE d.deal_code = 'MCA-2025-001' AND d.team_id = 'a0000000-0000-4000-a000-000000000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCENARIO 9: "ACH RETURN CODES" - Different return reasons
-- Add detailed return info to match audit log
-- ============================================================================

INSERT INTO match_audit_log (
  team_id, transaction_id, action, confidence, rule,
  previous_status, new_status, user_id, note, metadata
)
SELECT
  t.team_id, t.id, 'flag',
  NULL, NULL,
  'auto_matched'::match_status, 'flagged'::match_status,
  '00000000-0000-4000-a000-000000000001'::uuid,
  CASE (row_number() OVER ())::int % 4
    WHEN 0 THEN 'ACH Return Code R01: Insufficient Funds'
    WHEN 1 THEN 'ACH Return Code R02: Account Closed'
    WHEN 2 THEN 'ACH Return Code R03: No Account/Unable to Locate'
    WHEN 3 THEN 'ACH Return Code R08: Payment Stopped'
  END,
  jsonb_build_object(
    'return_code', CASE (row_number() OVER ())::int % 4
      WHEN 0 THEN 'R01'
      WHEN 1 THEN 'R02'
      WHEN 2 THEN 'R03'
      WHEN 3 THEN 'R08'
    END,
    'return_date', now()::date,
    'original_amount', ABS(t.amount)
  )
FROM transactions t
WHERE t.team_id = 'a0000000-0000-4000-a000-000000000001'
  AND t.match_status = 'flagged'
  AND t.discrepancy_type IS NOT NULL
LIMIT 8
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCENARIO 10: "SYNDICATION PERFORMANCE" - Update syndicator distributions
-- Show that some syndication positions are performing well, one is struggling
-- ============================================================================

-- Add note to a struggling syndication participant
UPDATE syndication_participants
SET note = 'ATTENTION: Deal MCA-2025-006 experiencing payment issues. 3 NSFs in Feb. Syndicator notified of potential default risk. Current collection rate: 62%'
WHERE syndicator_id = 'c0000000-0000-4000-a000-000000000001'::uuid
  AND deal_id = (SELECT id FROM mca_deals WHERE deal_code = 'MCA-2025-006' AND team_id = 'a0000000-0000-4000-a000-000000000001');

UPDATE syndication_participants
SET note = 'ATTENTION: Deal MCA-2025-006 experiencing payment issues. Syndicator requesting buyout option.'
WHERE syndicator_id = 'c0000000-0000-4000-a000-000000000002'::uuid
  AND deal_id = (SELECT id FROM mca_deals WHERE deal_code = 'MCA-2025-006' AND team_id = 'a0000000-0000-4000-a000-000000000001');

COMMIT;

-- Summary of scenarios
DO $$
BEGIN
  RAISE NOTICE '=== Diverse Scenario Summary ===';
  RAISE NOTICE 'Scenario 1: NSF Storm (Tony Pizzeria) - 10 payments incl 5 NSFs';
  RAISE NOTICE 'Scenario 2: Early Payoff (Fitness First) - 30 successful payments + inquiry';
  RAISE NOTICE 'Scenario 3: Seasonal Slowdown (Westside Construction) - mixed payments + renegotiation';
  RAISE NOTICE 'Scenario 4: Successful Payoff (Martinez Auto) - final 6 payments to zero';
  RAISE NOTICE 'Scenario 5: Stacking Detection (Sunrise Diner) - suspicious activity flags';
  RAISE NOTICE 'Scenario 6: Broker Commission Dispute (Southwest Funding) - disputed commission';
  RAISE NOTICE 'Scenario 7: Reconciliation Discrepancy - amount mismatches flagged';
  RAISE NOTICE 'Scenario 8: Deal Renewal Pipeline - new disclosure generating';
  RAISE NOTICE 'Scenario 9: ACH Return Codes - R01/R02/R03/R08 documented';
  RAISE NOTICE 'Scenario 10: Syndication Risk - struggling deal notifications';
END $$;
