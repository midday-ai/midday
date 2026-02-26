-- ============================================================================
-- DEPRECATED: Use `supabase db reset` which runs supabase/seed.sql.
-- This file is kept for reference only. All seed data is now consolidated
-- in supabase/seed.sql for deterministic, single-command seeding.
-- ============================================================================
-- Original description:
-- Abacus MCA Feature Seed Data
-- Seeds all new MCA tables with realistic demo data
-- Requires: existing merchants, deals, brokers, syndicators from prior seeds
-- ============================================================================

-- Fixed constants
\set team_id 'a0000000-0000-4000-a000-000000000001'
\set user_id '00000000-0000-4000-a000-000000000001'
\set operating_account 'ba000000-0000-4000-a000-000000000001'
\set reserve_account 'ba000000-0000-4000-a000-000000000002'

BEGIN;

-- ============================================================================
-- 1. UNDERWRITING BUY BOX (team-level configuration)
-- ============================================================================
INSERT INTO underwriting_buy_box (
  team_id, min_monthly_revenue, min_time_in_business, max_existing_positions,
  min_avg_daily_balance, max_nsf_count, excluded_industries, min_credit_score
) VALUES (
  :'team_id'::uuid,
  15000.00,       -- min $15K monthly revenue
  6,              -- min 6 months in business
  3,              -- max 3 existing MCA positions
  2500.00,        -- min $2,500 avg daily balance
  3,              -- max 3 NSFs in last 90 days
  ARRAY['gambling', 'firearms', 'cannabis', 'adult_entertainment', 'cryptocurrency'],
  550             -- min credit score
) ON CONFLICT (team_id) DO UPDATE SET
  min_monthly_revenue = EXCLUDED.min_monthly_revenue,
  min_time_in_business = EXCLUDED.min_time_in_business,
  max_existing_positions = EXCLUDED.max_existing_positions,
  min_avg_daily_balance = EXCLUDED.min_avg_daily_balance,
  max_nsf_count = EXCLUDED.max_nsf_count,
  excluded_industries = EXCLUDED.excluded_industries,
  min_credit_score = EXCLUDED.min_credit_score,
  updated_at = now();

-- ============================================================================
-- 2. DEAL BANK ACCOUNTS (merchant bank accounts per deal)
-- ============================================================================
INSERT INTO deal_bank_accounts (deal_id, team_id, bank_name, routing_number, account_number, account_type, is_primary)
SELECT d.id, d.team_id, ba.bank_name, ba.routing_number, ba.account_number, ba.account_type, true
FROM mca_deals d
CROSS JOIN LATERAL (
  SELECT
    CASE d.deal_code
      WHEN 'MCA-2025-001' THEN 'Chase Bank'
      WHEN 'MCA-2025-003' THEN 'Bank of America'
      WHEN 'MCA-2025-004' THEN 'Wells Fargo'
      WHEN 'MCA-2025-005' THEN 'TD Bank'
      WHEN 'MCA-2025-006' THEN 'PNC Bank'
      WHEN 'MCA-2026-001' THEN 'Chase Bank'
      WHEN 'MCA-2026-002' THEN 'US Bank'
      WHEN 'MCA-2024-001' THEN 'Citibank'
      WHEN 'MCA-2024-002' THEN 'Capital One'
      WHEN 'MCA-2024-003' THEN 'Regions Bank'
      ELSE 'Unknown Bank'
    END as bank_name,
    CASE d.deal_code
      WHEN 'MCA-2025-001' THEN '021000021'
      WHEN 'MCA-2025-003' THEN '026009593'
      WHEN 'MCA-2025-004' THEN '121000248'
      WHEN 'MCA-2025-005' THEN '031101266'
      WHEN 'MCA-2025-006' THEN '043000096'
      WHEN 'MCA-2026-001' THEN '021000021'
      WHEN 'MCA-2026-002' THEN '091000019'
      WHEN 'MCA-2024-001' THEN '021000089'
      WHEN 'MCA-2024-002' THEN '051405515'
      WHEN 'MCA-2024-003' THEN '062005690'
      ELSE '000000000'
    END as routing_number,
    '****' || (1000 + floor(random() * 9000))::text as account_number,
    'checking' as account_type
) ba
WHERE d.team_id = :'team_id'::uuid
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. DEAL FEES (origination, processing, underwriting, broker per deal)
-- ============================================================================
INSERT INTO deal_fees (deal_id, team_id, fee_type, fee_name, amount, percentage)
SELECT d.id, d.team_id, f.fee_type, f.fee_name,
  ROUND((d.funding_amount * f.pct)::numeric, 2) as amount,
  f.pct as percentage
FROM mca_deals d
CROSS JOIN (
  VALUES
    ('origination', 'Origination Fee', 0.03),
    ('processing', 'Processing Fee', 0.015),
    ('underwriting', 'Underwriting Fee', 0.01)
) f(fee_type, fee_name, pct)
WHERE d.team_id = :'team_id'::uuid
ON CONFLICT DO NOTHING;

-- Add broker fees for deals that have brokers
INSERT INTO deal_fees (deal_id, team_id, fee_type, fee_name, amount, percentage)
SELECT d.id, d.team_id, 'broker', 'Broker Commission',
  ROUND((d.funding_amount * COALESCE(b.commission_percentage, 10) / 100)::numeric, 2),
  COALESCE(b.commission_percentage, 10) / 100
FROM mca_deals d
JOIN brokers b ON d.broker_id = b.id
WHERE d.team_id = :'team_id'::uuid AND d.broker_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. DISCLOSURES (state-mandated disclosure records)
-- ============================================================================
INSERT INTO disclosures (
  deal_id, team_id, state_code, disclosure_type, template_version,
  status, figures, generated_by, generated_at, deal_snapshot,
  acknowledged_at, acknowledged_by
)
SELECT
  d.id, d.team_id,
  disc.state_code, 'mca', disc.template_version,
  disc.status,
  jsonb_build_object(
    'funded_amount', d.funding_amount,
    'payback_amount', d.payback_amount,
    'factor_rate', d.factor_rate,
    'apr_equivalent', ROUND((((d.factor_rate - 1) * 365) / 180)::numeric, 4),
    'total_cost_of_capital', d.payback_amount - d.funding_amount,
    'daily_payment', d.daily_payment,
    'estimated_term_days', CASE WHEN d.daily_payment > 0 THEN ROUND((d.payback_amount / d.daily_payment)::numeric, 0) ELSE 180 END
  ),
  :'user_id'::uuid,
  d.funded_at,
  jsonb_build_object('deal_code', d.deal_code, 'merchant_id', d.merchant_id, 'funding_amount', d.funding_amount),
  CASE WHEN disc.status = 'completed' THEN d.funded_at + interval '1 day' ELSE NULL END,
  CASE WHEN disc.status = 'completed' THEN 'Merchant Signature' ELSE NULL END
FROM mca_deals d
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN d.deal_code LIKE 'MCA-2025%' THEN 'NY'
      WHEN d.deal_code LIKE 'MCA-2026%' THEN 'CA'
      ELSE 'VA'
    END as state_code,
    CASE
      WHEN d.deal_code LIKE 'MCA-2025%' THEN 'ny-mca-v2.1'
      WHEN d.deal_code LIKE 'MCA-2026%' THEN 'ca-cfl-v1.3'
      ELSE 'va-mca-v1.0'
    END as template_version,
    CASE
      WHEN d.status IN ('active', 'paid_off') THEN 'completed'
      ELSE 'pending'
    END as status
) disc
WHERE d.team_id = :'team_id'::uuid
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. TRANSACTION RULES (auto-categorization rules)
-- ============================================================================
INSERT INTO transaction_rules (
  team_id, name, enabled, priority,
  merchant_match, merchant_match_type,
  amount_operator, amount_value, amount_value_max,
  set_category_slug, set_merchant_name
) VALUES
-- Rule: Match daily MCA payments by amount pattern
(:'team_id'::uuid, 'Daily ACH Payments - Small', true, 10,
 'ACH DEBIT', 'contains', 'between', 200.00, 600.00,
 'mca-payments', NULL),

-- Rule: Match NSF returns
(:'team_id'::uuid, 'NSF Returns Detection', true, 20,
 'NSF RETURN', 'contains', NULL, NULL, NULL,
 'nsf-returns', NULL),

-- Rule: Match funding disbursements
(:'team_id'::uuid, 'Funding Disbursements', true, 5,
 'WIRE OUT', 'contains', 'gt', 10000.00, NULL,
 'funding-disbursements', NULL),

-- Rule: Match broker commissions
(:'team_id'::uuid, 'Broker Commission Payments', true, 15,
 'COMMISSION', 'contains', 'between', 1000.00, 15000.00,
 'iso-commissions', NULL),

-- Rule: Match specific merchant name patterns
(:'team_id'::uuid, 'Sunrise Diner Payments', true, 30,
 'SUNRISE DINER', 'contains', NULL, NULL, NULL,
 'mca-payments', 'Sunrise Diner'),

(:'team_id'::uuid, 'Bella Salon Payments', true, 30,
 'BELLA SALON', 'contains', NULL, NULL, NULL,
 'mca-payments', 'Bella Salon & Spa'),

(:'team_id'::uuid, 'Operating Expenses - Rent', true, 50,
 'OFFICE RENT', 'exact', NULL, NULL, NULL,
 'operating-expenses', NULL),

(:'team_id'::uuid, 'Operating Expenses - Insurance', true, 50,
 'BUSINESS INS', 'starts_with', NULL, NULL, NULL,
 'operating-expenses', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. EXPORT TEMPLATES
-- ============================================================================
INSERT INTO export_templates (
  team_id, name, description, format,
  columns, filters, date_range,
  schedule_enabled, schedule_cron, schedule_email
) VALUES
-- Daily collections report
(:'team_id'::uuid, 'Daily Collections Report', 'All MCA payments received today', 'csv',
 '["date", "merchant_name", "deal_code", "amount", "payment_status", "bank_account"]'::jsonb,
 '{"payment_status": "completed", "transaction_type": "credit"}'::jsonb,
 'today',
 true, '0 18 * * 1-5', 'suph.tweel@gmail.com'),

-- Weekly portfolio summary
(:'team_id'::uuid, 'Weekly Portfolio Summary', 'Portfolio performance metrics by deal', 'xlsx',
 '["deal_code", "merchant_name", "funding_amount", "payback_amount", "current_balance", "total_paid", "collection_rate", "nsf_count", "status"]'::jsonb,
 '{}'::jsonb,
 'last_7_days',
 true, '0 9 * * 1', 'suph.tweel@gmail.com'),

-- QuickBooks export
(:'team_id'::uuid, 'QuickBooks IIF Export', 'Transaction export compatible with QuickBooks', 'quickbooks_iif',
 '["date", "account", "name", "amount", "memo", "category"]'::jsonb,
 '{}'::jsonb,
 'last_30_days',
 false, NULL, NULL),

-- NSF report
(:'team_id'::uuid, 'NSF Alert Report', 'All NSF/bounced payments for review', 'pdf',
 '["date", "merchant_name", "deal_code", "amount", "nsf_count", "current_balance"]'::jsonb,
 '{"category": "nsf-returns"}'::jsonb,
 'last_30_days',
 false, NULL, NULL),

-- Broker commission report
(:'team_id'::uuid, 'Broker Commission Report', 'Commission payments by broker', 'xlsx',
 '["broker_name", "deal_code", "merchant_name", "funding_amount", "commission_rate", "commission_amount", "status"]'::jsonb,
 '{}'::jsonb,
 'last_30_days',
 false, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. ACH BATCHES + ITEMS
-- ============================================================================

-- Batch 1: Recent completed batch
INSERT INTO ach_batches (
  id, team_id, created_by, batch_number, effective_date, description,
  total_amount, item_count, originator_bank_account_id,
  originator_name, originator_routing, originator_account,
  status, submitted_at, completed_at
) VALUES (
  'ab000000-0000-4000-a000-000000000001'::uuid,
  :'team_id'::uuid, :'user_id'::uuid,
  'ACH-2026-0218', '2026-02-18', 'Daily collections - Feb 18',
  2145.00, 5, :'operating_account'::uuid,
  'Abacus Capital LLC', '021000021', '****4521',
  'completed', '2026-02-18 08:00:00-05', '2026-02-18 16:30:00-05'
) ON CONFLICT DO NOTHING;

-- Batch 2: Processing batch
INSERT INTO ach_batches (
  id, team_id, created_by, batch_number, effective_date, description,
  total_amount, item_count, originator_bank_account_id,
  originator_name, originator_routing, originator_account,
  status, submitted_at
) VALUES (
  'ab000000-0000-4000-a000-000000000002'::uuid,
  :'team_id'::uuid, :'user_id'::uuid,
  'ACH-2026-0224', '2026-02-24', 'Daily collections - Feb 24',
  1870.00, 4, :'operating_account'::uuid,
  'Abacus Capital LLC', '021000021', '****4521',
  'processing', '2026-02-24 08:00:00-05'
) ON CONFLICT DO NOTHING;

-- Batch 3: Draft batch (today)
INSERT INTO ach_batches (
  id, team_id, created_by, batch_number, effective_date, description,
  total_amount, item_count, originator_bank_account_id,
  originator_name, originator_routing, originator_account,
  status
) VALUES (
  'ab000000-0000-4000-a000-000000000003'::uuid,
  :'team_id'::uuid, :'user_id'::uuid,
  'ACH-2026-0225', '2026-02-25', 'Daily collections - Feb 25',
  2310.00, 5, :'operating_account'::uuid,
  'Abacus Capital LLC', '021000021', '****4521',
  'draft'
) ON CONFLICT DO NOTHING;

-- ACH Batch Items for completed batch (Batch 1)
INSERT INTO ach_batch_items (batch_id, team_id, deal_id, receiver_name, receiver_routing, receiver_account, amount, transaction_code, status)
SELECT
  'ab000000-0000-4000-a000-000000000001'::uuid,
  d.team_id,
  d.id,
  CASE d.deal_code
    WHEN 'MCA-2025-001' THEN 'Sunrise Diner LLC'
    WHEN 'MCA-2025-003' THEN 'Bella Salon & Spa Inc'
    WHEN 'MCA-2025-005' THEN 'Quick Print Solutions LLC'
    WHEN 'MCA-2026-001' THEN 'Green Thumb Landscaping'
    WHEN 'MCA-2026-002' THEN 'Fitness First Gym LLC'
  END,
  '021000021', '****' || (1000 + floor(random() * 9000))::text,
  CASE d.deal_code
    WHEN 'MCA-2025-001' THEN 464.29
    WHEN 'MCA-2025-003' THEN 354.55
    WHEN 'MCA-2025-005' THEN 466.67
    WHEN 'MCA-2026-001' THEN 302.22
    WHEN 'MCA-2026-002' THEN 557.27
  END,
  '27', 'completed'
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid
  AND d.deal_code IN ('MCA-2025-001', 'MCA-2025-003', 'MCA-2025-005', 'MCA-2026-001', 'MCA-2026-002')
ON CONFLICT DO NOTHING;

-- ACH Batch Items for processing batch (Batch 2)
INSERT INTO ach_batch_items (batch_id, team_id, deal_id, receiver_name, receiver_routing, receiver_account, amount, transaction_code, status)
SELECT
  'ab000000-0000-4000-a000-000000000002'::uuid,
  d.team_id,
  d.id,
  CASE d.deal_code
    WHEN 'MCA-2025-001' THEN 'Sunrise Diner LLC'
    WHEN 'MCA-2025-003' THEN 'Bella Salon & Spa Inc'
    WHEN 'MCA-2025-005' THEN 'Quick Print Solutions LLC'
    WHEN 'MCA-2026-002' THEN 'Fitness First Gym LLC'
  END,
  '021000021', '****' || (1000 + floor(random() * 9000))::text,
  CASE d.deal_code
    WHEN 'MCA-2025-001' THEN 464.29
    WHEN 'MCA-2025-003' THEN 354.55
    WHEN 'MCA-2025-005' THEN 466.67
    WHEN 'MCA-2026-002' THEN 557.27
  END,
  '27', 'pending'
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid
  AND d.deal_code IN ('MCA-2025-001', 'MCA-2025-003', 'MCA-2025-005', 'MCA-2026-002')
ON CONFLICT DO NOTHING;

-- ACH Batch Items for draft batch (Batch 3)
INSERT INTO ach_batch_items (batch_id, team_id, deal_id, receiver_name, receiver_routing, receiver_account, amount, transaction_code, status)
SELECT
  'ab000000-0000-4000-a000-000000000003'::uuid,
  d.team_id,
  d.id,
  CASE d.deal_code
    WHEN 'MCA-2025-001' THEN 'Sunrise Diner LLC'
    WHEN 'MCA-2025-003' THEN 'Bella Salon & Spa Inc'
    WHEN 'MCA-2025-004' THEN 'Tony''s Pizzeria Inc'
    WHEN 'MCA-2025-005' THEN 'Quick Print Solutions LLC'
    WHEN 'MCA-2026-002' THEN 'Fitness First Gym LLC'
  END,
  '021000021', '****' || (1000 + floor(random() * 9000))::text,
  CASE d.deal_code
    WHEN 'MCA-2025-001' THEN 464.29
    WHEN 'MCA-2025-003' THEN 354.55
    WHEN 'MCA-2025-004' THEN 472.22
    WHEN 'MCA-2025-005' THEN 466.67
    WHEN 'MCA-2026-002' THEN 557.27
  END,
  '27', 'pending'
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid
  AND d.deal_code IN ('MCA-2025-001', 'MCA-2025-003', 'MCA-2025-004', 'MCA-2025-005', 'MCA-2026-002')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. RECONCILIATION SESSIONS
-- ============================================================================
INSERT INTO reconciliation_sessions (
  id, team_id, user_id, bank_account_id,
  date_from, date_to,
  total_transactions, auto_matched, manually_matched, flagged, unmatched,
  status, completed_at
) VALUES
-- Completed session from last week
('a5000000-0000-4000-a000-000000000001'::uuid,
 :'team_id'::uuid, :'user_id'::uuid, :'operating_account'::uuid,
 '2026-02-10', '2026-02-14',
 87, 72, 8, 3, 4,
 'completed', '2026-02-14 17:30:00-05'),

-- Completed session from early Feb
('a5000000-0000-4000-a000-000000000002'::uuid,
 :'team_id'::uuid, :'user_id'::uuid, :'operating_account'::uuid,
 '2026-02-03', '2026-02-07',
 93, 81, 7, 2, 3,
 'completed', '2026-02-07 16:45:00-05'),

-- In-progress session (current week)
('a5000000-0000-4000-a000-000000000003'::uuid,
 :'team_id'::uuid, :'user_id'::uuid, :'operating_account'::uuid,
 '2026-02-17', '2026-02-21',
 45, 32, 3, 5, 5,
 'in_progress', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. MERCHANT DOCUMENTS (portal documents)
-- ============================================================================
INSERT INTO merchant_documents (
  merchant_id, team_id, deal_id, document_type, title, description,
  file_path, file_name, file_size, mime_type, visible_in_portal, uploaded_by
)
SELECT
  d.merchant_id, d.team_id, d.id,
  doc.doc_type::merchant_document_type, doc.title, doc.description,
  'documents/' || d.deal_code || '/' || doc.file_name,
  doc.file_name, doc.file_size, 'application/pdf',
  doc.visible, :'user_id'::uuid
FROM mca_deals d
CROSS JOIN LATERAL (
  VALUES
    ('contract', 'MCA Agreement', 'Signed merchant cash advance agreement', 'mca-agreement.pdf', 245760, true),
    ('disclosure', 'State Disclosure', 'Required state disclosure document', 'state-disclosure.pdf', 128000, true),
    ('monthly_statement', 'February 2026 Statement', 'Monthly payment statement', 'statement-2026-02.pdf', 89600, true)
) doc(doc_type, title, description, file_name, file_size, visible)
WHERE d.team_id = :'team_id'::uuid AND d.status IN ('active', 'late')
ON CONFLICT DO NOTHING;

-- Add payoff letters for paid-off deals
INSERT INTO merchant_documents (
  merchant_id, team_id, deal_id, document_type, title, description,
  file_path, file_name, file_size, mime_type, visible_in_portal, uploaded_by
)
SELECT
  d.merchant_id, d.team_id, d.id,
  'payoff_letter'::merchant_document_type, 'Payoff Confirmation Letter',
  'Confirmation that the MCA has been fully paid off',
  'documents/' || d.deal_code || '/payoff-letter.pdf',
  'payoff-letter.pdf', 64000, 'application/pdf',
  true, :'user_id'::uuid
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid AND d.status = 'paid_off'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. MERCHANT MESSAGES (portal messaging)
-- ============================================================================
-- Messages from merchants (inbound)
INSERT INTO merchant_messages (
  merchant_id, team_id, direction, subject, message, status, from_email, from_name
)
SELECT
  d.merchant_id, d.team_id,
  'inbound'::merchant_message_direction,
  msg.subject, msg.message,
  msg.status::merchant_message_status,
  msg.email, msg.name
FROM mca_deals d
CROSS JOIN LATERAL (
  SELECT * FROM (VALUES
    ('MCA-2025-001', 'Payment schedule question', 'Hi, I wanted to confirm my daily payment amount and ask if there''s a way to see my remaining balance. Thanks!', 'replied', 'owner@sunrisediner.com', 'Maria Chen'),
    ('MCA-2025-004', 'Requesting payment pause', 'We''re experiencing a slow season and would like to discuss pausing payments for a week. Is this possible?', 'read', 'tony@tonyspizzeria.com', 'Tony Russo'),
    ('MCA-2025-006', 'NSF explanation', 'The bounced payment last week was due to a timing issue with our deposit. It won''t happen again.', 'pending', 'jim@westsideconstruction.com', 'Jim Westfield'),
    ('MCA-2026-002', 'Early payoff inquiry', 'Business has been strong this quarter. What would my payoff amount be if I wanted to close out early?', 'pending', 'alex@fitnessfirstgym.com', 'Alex Morgan')
  ) AS t(deal_code, subject, message, status, email, name)
) msg
WHERE d.deal_code = msg.deal_code AND d.team_id = :'team_id'::uuid
ON CONFLICT DO NOTHING;

-- Messages from team (outbound)
INSERT INTO merchant_messages (
  merchant_id, team_id, direction, subject, message, status, sent_by_user_id, from_name
)
SELECT
  d.merchant_id, d.team_id,
  'outbound'::merchant_message_direction,
  msg.subject, msg.message,
  'read'::merchant_message_status,
  :'user_id'::uuid, 'Suphian Tweel'
FROM mca_deals d
CROSS JOIN LATERAL (
  SELECT * FROM (VALUES
    ('MCA-2025-001', 'RE: Payment schedule question', 'Hi Maria! Your daily payment is $464.29. You can view your remaining balance anytime in the merchant portal. Let me know if you need anything else!'),
    ('MCA-2026-001', 'Welcome to Abacus', 'Welcome aboard! Your MCA has been funded. You can track your payments and balance through the merchant portal. Don''t hesitate to reach out with questions.'),
    ('MCA-2025-005', 'Monthly Statement Available', 'Your February statement is now available in the Documents section of your portal. Please review and let us know if you have any questions.')
  ) AS t(deal_code, subject, message)
) msg
WHERE d.deal_code = msg.deal_code AND d.team_id = :'team_id'::uuid
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. MERCHANT NOTIFICATIONS
-- ============================================================================
-- Payment received notifications (for active deals)
INSERT INTO merchant_notifications (
  merchant_id, team_id, notification_type, title, message,
  email_sent, email_sent_at, read_in_portal, read_at, deal_id
)
SELECT
  d.merchant_id, d.team_id,
  'payment_received'::merchant_notification_type,
  'Payment Received - ' || d.deal_code,
  'Your payment of $' || d.daily_payment || ' was successfully processed on Feb 24, 2026.',
  true, '2026-02-24 09:00:00-05',
  CASE WHEN random() > 0.4 THEN true ELSE false END,
  CASE WHEN random() > 0.4 THEN '2026-02-24 10:30:00-05'::timestamptz ELSE NULL::timestamptz END,
  d.id
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid AND d.status = 'active'
ON CONFLICT DO NOTHING;

-- NSF notifications (for late deals)
INSERT INTO merchant_notifications (
  merchant_id, team_id, notification_type, title, message,
  email_sent, email_sent_at, read_in_portal, deal_id
)
SELECT
  d.merchant_id, d.team_id,
  'payment_nsf'::merchant_notification_type,
  'Payment Failed - ' || d.deal_code,
  'Your payment of $' || d.daily_payment || ' was returned due to insufficient funds. Please ensure adequate funds are available.',
  true, '2026-02-20 09:00:00-05',
  false,
  d.id
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid AND d.status = 'late'
ON CONFLICT DO NOTHING;

-- Deal paid off notifications
INSERT INTO merchant_notifications (
  merchant_id, team_id, notification_type, title, message,
  email_sent, email_sent_at, read_in_portal, read_at, deal_id
)
SELECT
  d.merchant_id, d.team_id,
  'deal_paid_off'::merchant_notification_type,
  'Congratulations! Deal ' || d.deal_code || ' Fully Paid Off',
  'Your merchant cash advance has been fully paid off. A payoff confirmation letter is available in your documents.',
  true, d.funded_at + interval '180 days',
  true, d.funded_at + interval '181 days',
  d.id
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid AND d.status = 'paid_off'
ON CONFLICT DO NOTHING;

-- Balance alert notifications
INSERT INTO merchant_notifications (
  merchant_id, team_id, notification_type, title, message,
  email_sent, email_sent_at, deal_id
)
SELECT
  d.merchant_id, d.team_id,
  'balance_alert'::merchant_notification_type,
  'Balance Update - ' || d.deal_code,
  'Your remaining balance is $' || d.current_balance || '. You''re ' ||
    ROUND(((d.total_paid / d.payback_amount) * 100)::numeric, 1) || '% complete!',
  true, now() - interval '3 days',
  d.id
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid AND d.status = 'active' AND d.payback_amount > 0
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. PAYOFF LETTER REQUESTS (for paid-off deals + one pending)
-- ============================================================================
-- Completed payoff requests for paid-off deals
INSERT INTO payoff_letter_requests (
  deal_id, merchant_id, team_id,
  requested_payoff_date, requested_by_email,
  balance_at_request, payoff_amount,
  status, approved_at, approved_by, sent_at,
  document_path, expires_at
)
SELECT
  d.id, d.merchant_id, d.team_id,
  (d.funded_at + interval '170 days')::date,
  CASE d.deal_code
    WHEN 'MCA-2024-001' THEN 'owner@martinezauto.com'
    WHEN 'MCA-2024-002' THEN 'lucky@luckydragon.com'
    WHEN 'MCA-2024-003' THEN 'john@smithplumbing.com'
  END,
  d.payback_amount * 0.08,  -- 8% remaining at time of request
  d.payback_amount * 0.08,
  'sent',
  d.funded_at + interval '171 days',
  :'user_id'::uuid,
  d.funded_at + interval '172 days',
  'documents/' || d.deal_code || '/payoff-letter.pdf',
  (d.funded_at + interval '187 days')::date
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid AND d.status = 'paid_off'
ON CONFLICT DO NOTHING;

-- One pending payoff request from active deal
INSERT INTO payoff_letter_requests (
  deal_id, merchant_id, team_id,
  requested_payoff_date, requested_by_email,
  balance_at_request, payoff_amount,
  status
)
SELECT
  d.id, d.merchant_id, d.team_id,
  '2026-03-15'::date,
  'alex@fitnessfirstgym.com',
  d.current_balance,
  d.current_balance * 0.95,  -- 5% early payoff discount
  'pending'
FROM mca_deals d
WHERE d.team_id = :'team_id'::uuid AND d.deal_code = 'MCA-2026-002'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. UPDATE TRANSACTIONS WITH MCA COLUMNS
-- ============================================================================
-- Tag existing credit transactions as MCA payments
UPDATE transactions t
SET
  transaction_type = 'credit'::transaction_type,
  payment_status = 'completed'::payment_status,
  match_status = 'auto_matched'::match_status,
  match_confidence = 95.00 + (random() * 5),
  matched_deal_id = d.id,
  deal_code = d.deal_code,
  matched_at = t.date + interval '1 hour',
  matched_by = :'user_id'::uuid,
  match_rule = 'amount_merchant_match'
FROM mca_deals d
JOIN merchants m ON d.merchant_id = m.id
WHERE t.team_id = :'team_id'::uuid
  AND t.amount > 0
  AND t.name ILIKE '%' || LEFT(m.name, 10) || '%'
  AND t.match_status IS NULL;

-- Tag debit transactions as funding disbursements
UPDATE transactions t
SET
  transaction_type = 'debit'::transaction_type,
  payment_status = 'completed'::payment_status,
  match_status = 'auto_matched'::match_status,
  match_confidence = 98.00,
  deal_code = d.deal_code,
  matched_deal_id = d.id,
  matched_at = t.date + interval '30 minutes',
  matched_by = :'user_id'::uuid,
  match_rule = 'funding_disbursement_match'
FROM mca_deals d
JOIN merchants m ON d.merchant_id = m.id
WHERE t.team_id = :'team_id'::uuid
  AND t.amount < 0
  AND ABS(t.amount) > 10000
  AND t.name ILIKE '%' || LEFT(m.name, 8) || '%'
  AND t.match_status IS NULL;

-- Mark some transactions as unmatched (for reconciliation demo)
UPDATE transactions
SET
  match_status = 'unmatched'::match_status,
  transaction_type = CASE
    WHEN amount > 0 THEN 'credit'::transaction_type
    ELSE 'debit'::transaction_type
  END
WHERE team_id = :'team_id'::uuid
  AND match_status IS NULL
  AND date >= '2026-02-01';

-- Mark a few as flagged for review
UPDATE transactions
SET
  match_status = 'flagged'::match_status,
  discrepancy_type = CASE
    WHEN amount > 0 AND amount < 100 THEN 'partial_payment'::discrepancy_type
    WHEN amount < 0 AND ABS(amount) < 50 THEN 'bank_fee'::discrepancy_type
    ELSE 'unrecognized'::discrepancy_type
  END,
  reconciliation_note = 'Flagged for manual review'
WHERE team_id = :'team_id'::uuid
  AND match_status = 'unmatched'
  AND date >= '2026-02-10'
  AND id IN (
    SELECT id FROM transactions
    WHERE team_id = :'team_id'::uuid AND match_status = 'unmatched' AND date >= '2026-02-10'
    ORDER BY random()
    LIMIT 5
  );

-- ============================================================================
-- 14. MATCH AUDIT LOG (reconciliation trail)
-- ============================================================================
-- Log auto-matched transactions
INSERT INTO match_audit_log (
  team_id, transaction_id, action, deal_id, confidence, rule,
  previous_status, new_status, user_id, note
)
SELECT
  t.team_id, t.id, 'auto_match',
  t.matched_deal_id, t.match_confidence,
  t.match_rule,
  'unmatched'::match_status, 'auto_matched'::match_status,
  NULL, 'System auto-matched based on ' || COALESCE(t.match_rule, 'pattern')
FROM transactions t
WHERE t.team_id = :'team_id'::uuid
  AND t.match_status = 'auto_matched'
  AND t.matched_deal_id IS NOT NULL
LIMIT 20
ON CONFLICT DO NOTHING;

-- Log flagged transactions
INSERT INTO match_audit_log (
  team_id, transaction_id, action, confidence, rule,
  previous_status, new_status, user_id, note
)
SELECT
  t.team_id, t.id, 'flag',
  NULL, NULL,
  'unmatched'::match_status, 'flagged'::match_status,
  :'user_id'::uuid, 'Flagged for review: ' || COALESCE(t.discrepancy_type::text, 'unknown discrepancy')
FROM transactions t
WHERE t.team_id = :'team_id'::uuid
  AND t.match_status = 'flagged'
LIMIT 5
ON CONFLICT DO NOTHING;

COMMIT;

-- Report what was seeded
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== Seed Data Summary ===';
  FOR r IN
    SELECT 'underwriting_buy_box' as tbl, count(*) as cnt FROM underwriting_buy_box WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'deal_bank_accounts', count(*) FROM deal_bank_accounts WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'deal_fees', count(*) FROM deal_fees WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'disclosures', count(*) FROM disclosures WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'transaction_rules', count(*) FROM transaction_rules WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'export_templates', count(*) FROM export_templates WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'ach_batches', count(*) FROM ach_batches WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'ach_batch_items', count(*) FROM ach_batch_items WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'reconciliation_sessions', count(*) FROM reconciliation_sessions WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'merchant_documents', count(*) FROM merchant_documents WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'merchant_messages', count(*) FROM merchant_messages WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'merchant_notifications', count(*) FROM merchant_notifications WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'payoff_letter_requests', count(*) FROM payoff_letter_requests WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'match_audit_log', count(*) FROM match_audit_log WHERE team_id = 'a0000000-0000-4000-a000-000000000001'
    UNION ALL SELECT 'transactions (matched)', count(*) FROM transactions WHERE team_id = 'a0000000-0000-4000-a000-000000000001' AND match_status IS NOT NULL
    ORDER BY 1
  LOOP
    RAISE NOTICE '  % : % rows', r.tbl, r.cnt;
  END LOOP;
END $$;
