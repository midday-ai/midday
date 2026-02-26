-- ============================================================================
-- DEPRECATED: Use `supabase db reset` which runs supabase/seed.sql.
-- This file is kept for reference only. All seed data is now consolidated
-- in supabase/seed.sql for deterministic, single-command seeding.
-- ============================================================================
-- Original description:
-- Abacus Portal & Config Seed Data
-- Seeds: late_fee_settings, ach_providers, merchant portal tables,
--        vault documents, inbox items, and backfills mca_deals columns
-- Requires: all prior seeds (seed-local.mjs, seed-mca-features.sql,
--           seed-brokers-syndicators-v2.sql, seed-diverse-scenarios.sql)
-- ============================================================================

-- Fixed constants (must match seed-mca-features.sql)
\set team_id 'a0000000-0000-0000-0000-000000000001'
\set user_id '00000000-0000-0000-0000-000000000001'

BEGIN;

-- ============================================================================
-- 0a. ADDITIONAL BANK ACCOUNTS (2 new accounts — total 4)
-- ============================================================================
INSERT INTO bank_accounts (id, team_id, created_by, name, currency, balance, type, manual, enabled, account_id) VALUES
  ('ba000000-0000-0000-0000-000000000003'::uuid, :'team_id'::uuid, :'user_id'::uuid,
   'Chase Business Checking', 'USD', 423150.00, 'depository', true, true, 'manual_chase_001'),
  ('ba000000-0000-0000-0000-000000000004'::uuid, :'team_id'::uuid, :'user_id'::uuid,
   'Wells Fargo Collections', 'USD', 185600.00, 'depository', true, true, 'manual_wells_001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 0b. REDISTRIBUTE TRANSACTIONS ACROSS ALL 4 BANK ACCOUNTS
-- Moves a portion of existing transactions from the single operating account
-- to the new accounts based on merchant assignment:
--   Operating (ba..01): Sunrise Diner, Martinez Auto, Green Thumb, Fitness First
--   Reserve (ba..02):   (remains for reserve purposes — no merchant txns)
--   Chase (ba..03):     Bella Salon, Tony's Pizzeria, Lucky Dragon
--   Wells Fargo (ba..04): Smith Plumbing, Westside Construction
-- ============================================================================
UPDATE transactions SET bank_account_id = 'ba000000-0000-0000-0000-000000000003'::uuid
WHERE team_id = :'team_id'::uuid
  AND bank_account_id = 'ba000000-0000-0000-0000-000000000001'::uuid
  AND (
    name ILIKE '%Bella%' OR name ILIKE '%Tony%' OR name ILIKE '%Lucky Dragon%'
    OR deal_code IN ('MCA-2025-003', 'MCA-2025-004', 'MCA-2024-002')
  );

UPDATE transactions SET bank_account_id = 'ba000000-0000-0000-0000-000000000004'::uuid
WHERE team_id = :'team_id'::uuid
  AND bank_account_id = 'ba000000-0000-0000-0000-000000000001'::uuid
  AND (
    name ILIKE '%Smith%' OR name ILIKE '%Westside%'
    OR deal_code IN ('MCA-2024-003', 'MCA-2025-006')
  );

-- ============================================================================
-- 0c. ADD NEW TRANSACTIONS FOR THE NEW BANK ACCOUNTS
-- Each new account gets operating expense transactions so they look alive
-- ============================================================================
INSERT INTO transactions (
  team_id, bank_account_id, date, name, description, amount, currency,
  category_slug, status, method, internal_id
) VALUES
-- Chase Business Checking — operating expenses
(:'team_id'::uuid, 'ba000000-0000-0000-0000-000000000003'::uuid,
 (now() - interval '5 days')::date, 'WeWork - Office Space Feb',
 'Monthly coworking membership', -1850.00, 'USD',
 'operating-expenses', 'posted', 'ach', 'opex_chase_001'),

(:'team_id'::uuid, 'ba000000-0000-0000-0000-000000000003'::uuid,
 (now() - interval '12 days')::date, 'AWS Cloud Services',
 'Monthly cloud infrastructure', -2340.00, 'USD',
 'operating-expenses', 'posted', 'ach', 'opex_chase_002'),

(:'team_id'::uuid, 'ba000000-0000-0000-0000-000000000003'::uuid,
 (now() - interval '18 days')::date, 'Salesforce CRM License',
 'Monthly CRM subscription', -450.00, 'USD',
 'operating-expenses', 'posted', 'ach', 'opex_chase_003'),

(:'team_id'::uuid, 'ba000000-0000-0000-0000-000000000003'::uuid,
 (now() - interval '25 days')::date, 'Iron Mountain - Document Storage',
 'Monthly secure document storage', -275.00, 'USD',
 'operating-expenses', 'posted', 'ach', 'opex_chase_004'),

-- Wells Fargo Collections — operating expenses
(:'team_id'::uuid, 'ba000000-0000-0000-0000-000000000004'::uuid,
 (now() - interval '3 days')::date, 'TransUnion - Credit Bureau',
 'Monthly credit report subscription', -595.00, 'USD',
 'operating-expenses', 'posted', 'ach', 'opex_wells_001'),

(:'team_id'::uuid, 'ba000000-0000-0000-0000-000000000004'::uuid,
 (now() - interval '10 days')::date, 'LexisNexis - Skip Tracing',
 'Monthly skip tracing service', -890.00, 'USD',
 'operating-expenses', 'posted', 'ach', 'opex_wells_002'),

(:'team_id'::uuid, 'ba000000-0000-0000-0000-000000000004'::uuid,
 (now() - interval '15 days')::date, 'Thompson Law - Collections Retainer',
 'Monthly legal collections retainer', -3500.00, 'USD',
 'operating-expenses', 'posted', 'ach', 'opex_wells_003'),

(:'team_id'::uuid, 'ba000000-0000-0000-0000-000000000004'::uuid,
 (now() - interval '22 days')::date, 'Nacha - ACH Processing Fees',
 'Monthly ACH batch processing fees', -425.00, 'USD',
 'operating-expenses', 'posted', 'ach', 'opex_wells_004')
ON CONFLICT (internal_id) DO NOTHING;

-- ============================================================================
-- 1. LATE FEE SETTINGS (team-level configuration)
-- ============================================================================
INSERT INTO late_fee_settings (
  team_id, fee_per_nsf, daily_late_fee, grace_period_days,
  compound_fees, max_late_fee
) VALUES (
  :'team_id'::uuid,
  35.00,    -- $35 per NSF (industry standard)
  15.00,    -- $15/day after grace period
  3,        -- 3 business day grace period
  false,    -- no compounding
  500.00    -- cap at $500 cumulative
) ON CONFLICT (team_id) DO UPDATE SET
  fee_per_nsf = EXCLUDED.fee_per_nsf,
  daily_late_fee = EXCLUDED.daily_late_fee,
  grace_period_days = EXCLUDED.grace_period_days,
  compound_fees = EXCLUDED.compound_fees,
  max_late_fee = EXCLUDED.max_late_fee,
  updated_at = now();

-- ============================================================================
-- 2. ACH PROVIDERS (origination bank accounts)
-- ============================================================================
INSERT INTO ach_providers (
  team_id, provider_name, provider_type,
  originator_name, routing_number, account_number_masked,
  api_key_ref, status, is_primary, note
) VALUES
-- Primary provider (matches existing ach_batches originator data)
(:'team_id'::uuid,
 'Abacus Capital - Chase ACH', 'bank',
 'Abacus Capital LLC', '021000021', '****4521',
 'ACH_CHASE_API_KEY', 'active', true,
 'Primary ACH origination account via Chase'),
-- Sandbox provider for testing
(:'team_id'::uuid,
 'Dwolla Sandbox', 'third_party',
 'Abacus Capital LLC', '021000021', '****0000',
 'ACH_DWOLLA_SANDBOX_KEY', 'sandbox', false,
 'Dwolla integration for ACH — sandbox environment')
ON CONFLICT (team_id, provider_name) DO NOTHING;

-- ============================================================================
-- 3. MCA DEALS COLUMN BACKFILL (columns added in 20260219 migration)
-- ============================================================================
UPDATE mca_deals SET
  start_date = funded_at::date,
  first_payment_date = (funded_at + interval '1 day')::date,
  maturity_date = CASE
    WHEN payment_frequency = 'daily' AND daily_payment > 0
      THEN (funded_at + (CEIL(payback_amount / daily_payment)::integer || ' days')::interval)::date
    WHEN payment_frequency = 'weekly' AND daily_payment > 0
      THEN (funded_at + ((CEIL(payback_amount / daily_payment) * 7)::integer || ' days')::interval)::date
    ELSE (funded_at + interval '180 days')::date
  END,
  holdback_percentage = CASE
    WHEN payment_frequency = 'daily'  THEN 12.00
    WHEN payment_frequency = 'weekly' THEN 18.00
    ELSE 12.00
  END,
  ucc_filing_status = CASE
    WHEN status = 'paid_off' THEN 'terminated'
    ELSE 'filed'
  END,
  personal_guarantee = CASE
    WHEN funding_amount >= 75000 THEN true
    ELSE false
  END,
  default_terms = 'After 5 consecutive NSFs or 30 days of non-payment, deal is in default. Cure period applies.',
  cure_period_days = 10
WHERE team_id = :'team_id'::uuid
  AND start_date IS NULL;

-- ============================================================================
-- 4. BROKER & SYNDICATOR PORTAL ID BACKFILL
-- ============================================================================
UPDATE brokers SET portal_id = 'pinnacle-funding-group'
WHERE team_id = :'team_id'::uuid
  AND id = 'b0000000-0000-0000-0000-000000000001'::uuid
  AND portal_id IS NULL;

UPDATE brokers SET portal_id = 'capital-brokers-llc'
WHERE team_id = :'team_id'::uuid
  AND id = 'b0000000-0000-0000-0000-000000000002'::uuid
  AND portal_id IS NULL;

UPDATE syndicators SET portal_id = 'apex-capital-partners'
WHERE team_id = :'team_id'::uuid
  AND id = 'c0000000-0000-0000-0000-000000000001'::uuid
  AND portal_id IS NULL;

UPDATE syndicators SET portal_id = 'harbor-funding-group'
WHERE team_id = :'team_id'::uuid
  AND id = 'c0000000-0000-0000-0000-000000000002'::uuid
  AND portal_id IS NULL;

-- ============================================================================
-- 5. MERCHANT PORTAL INVITES (5 rows)
-- ============================================================================
INSERT INTO merchant_portal_invites (
  id, email, merchant_id, team_id, code, invited_by,
  status, accepted_at, expires_at
)
SELECT
  inv.static_id::uuid,
  inv.email,
  m.id,
  :'team_id'::uuid,
  inv.code,
  :'user_id'::uuid,
  inv.status,
  inv.accepted_at,
  inv.expires_at
FROM (VALUES
  -- Sunrise Diner — accepted
  ('d1000000-0000-0000-0000-000000000001',
   'owner@sunrisediner.com', 'Sunrise Diner',
   'inv_sunrise_portal_001', 'accepted',
   now() - interval '7 months', now() + interval '1 year'),
  -- Bella Salon — accepted
  ('d1000000-0000-0000-0000-000000000002',
   'bella@bellasalon.com', 'Bella Salon & Spa',
   'inv_bella_portal_001', 'accepted',
   now() - interval '4 months', now() + interval '1 year'),
  -- Fitness First — accepted (recently, requested payoff)
  ('d1000000-0000-0000-0000-000000000003',
   'alex@fitnessfirstgym.com', 'Fitness First Gym',
   'inv_fitness_portal_001', 'accepted',
   now() - interval '6 days', now() + interval '1 year'),
  -- Green Thumb — pending (new client, not yet activated)
  ('d1000000-0000-0000-0000-000000000004',
   'owner@greenthumb.com', 'Green Thumb Landscaping',
   'inv_greenthumb_portal_001', 'pending',
   NULL::timestamptz, now() + interval '7 days'),
  -- Westside — expired (never accepted despite NSF issues)
  ('d1000000-0000-0000-0000-000000000005',
   'jim@westsideconstruction.com', 'Westside Construction LLC',
   'inv_westside_portal_001', 'expired',
   NULL::timestamptz, now() - interval '5 months')
) AS inv(static_id, email, merchant_name, code, status, accepted_at, expires_at)
JOIN merchants m ON m.name = inv.merchant_name AND m.team_id = :'team_id'::uuid
ON CONFLICT ON CONSTRAINT merchant_invites_email_merchant_unique DO NOTHING;

-- ============================================================================
-- 6. MERCHANT PORTAL SESSIONS (4 rows)
-- ============================================================================
INSERT INTO merchant_portal_sessions (
  id, merchant_id, portal_id,
  email, verification_token,
  verified_at, expires_at,
  last_active_at, ip_address, user_agent, session_type
)
SELECT
  sess.static_id::uuid,
  m.id,
  lower(regexp_replace(m.name, '[^a-zA-Z0-9]+', '-', 'g')),  -- merchant slug as portal_id
  sess.email,
  sess.token,
  sess.verified_at,
  sess.expires_at,
  sess.last_active,
  sess.ip,
  sess.ua,
  'magic_link'
FROM (VALUES
  -- Sunrise Diner — active, accessed 2 days ago from mobile
  ('e1000000-0000-0000-0000-000000000001',
   'owner@sunrisediner.com', 'Sunrise Diner',
   'vtok_sunrise_portal_001',
   now() - interval '7 months',
   now() + interval '23 days',
   now() - interval '2 days',
   '76.185.42.11', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605 Chrome/120'),
  -- Bella Salon — active, accessed 5 hours ago from Mac
  ('e1000000-0000-0000-0000-000000000002',
   'bella@bellasalon.com', 'Bella Salon & Spa',
   'vtok_bella_portal_001',
   now() - interval '4 months',
   now() + interval '26 days',
   now() - interval '5 hours',
   '98.244.113.5', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0'),
  -- Fitness First — active, accessed 30 min ago from Android
  ('e1000000-0000-0000-0000-000000000003',
   'alex@fitnessfirstgym.com', 'Fitness First Gym',
   'vtok_fitness_portal_001',
   now() - interval '6 days',
   now() + interval '24 days',
   now() - interval '30 minutes',
   '104.28.52.87', 'Mozilla/5.0 (Linux; Android 14) Chrome/121'),
  -- Lucky Dragon — stale (paid off deal, session expired)
  ('e1000000-0000-0000-0000-000000000004',
   'lucky@luckydragon.com', 'Lucky Dragon Restaurant',
   'vtok_luckydragon_portal_001',
   now() - interval '12 months',
   now() - interval '11 months',
   now() - interval '11 months',
   '67.112.38.22', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/115.0')
) AS sess(static_id, email, merchant_name, token, verified_at, expires_at, last_active, ip, ua)
JOIN merchants m ON m.name = sess.merchant_name AND m.team_id = :'team_id'::uuid
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. MERCHANT PORTAL ACCESS (3 rows — active merchants only)
-- Note: In production, each merchant gets their own auth.users row when
-- they accept a portal invite. For demo, we use the seed user as stand-in.
-- ============================================================================
INSERT INTO merchant_portal_access (
  merchant_id, team_id, user_id, status
)
SELECT m.id, m.team_id, :'user_id'::uuid, 'active'
FROM merchants m
WHERE m.team_id = :'team_id'::uuid
  AND m.name IN ('Sunrise Diner', 'Bella Salon & Spa', 'Fitness First Gym')
ON CONFLICT (user_id, merchant_id) DO NOTHING;

-- ============================================================================
-- 8. VAULT DOCUMENTS (6 rows)
-- Note: fts column is GENERATED ALWAYS — do NOT insert it directly
-- ============================================================================
INSERT INTO documents (
  id, team_id, name, title, body, tag, date,
  path_tokens, processing_status, language
) VALUES
-- MCA Agreement Template
('f1000000-0000-0000-0000-000000000001'::uuid,
 :'team_id'::uuid,
 'MCA-Agreement-Template-2026.pdf',
 'MCA Agreement Template 2026',
 'Standard merchant cash advance agreement template. Factor rate, payback amount, payment frequency, default terms, personal guarantee provisions, UCC filing rights.',
 'contract',
 '2026-01-01',
 ARRAY['contracts', 'MCA-Agreement-Template-2026.pdf'],
 'completed'::document_processing_status,
 'en'),

-- New York Disclosure Template
('f1000000-0000-0000-0000-000000000002'::uuid,
 :'team_id'::uuid,
 'NY-Disclosure-Template-v2.1.pdf',
 'New York MCA Disclosure Template v2.1',
 'New York state required disclosure form for merchant cash advance transactions. Includes APR equivalent, finance charge, and factor rate disclosure.',
 'disclosure',
 '2026-01-15',
 ARRAY['disclosures', 'NY-Disclosure-Template-v2.1.pdf'],
 'completed'::document_processing_status,
 'en'),

-- California CFL Disclosure Template
('f1000000-0000-0000-0000-000000000003'::uuid,
 :'team_id'::uuid,
 'CA-CFL-Disclosure-v1.3.pdf',
 'California CFL Disclosure Template v1.3',
 'California Commercial Financing Law disclosure form for MCA transactions. Required for deals over $5,000.',
 'disclosure',
 '2026-01-20',
 ARRAY['disclosures', 'CA-CFL-Disclosure-v1.3.pdf'],
 'completed'::document_processing_status,
 'en'),

-- Underwriting Checklist
('f1000000-0000-0000-0000-000000000004'::uuid,
 :'team_id'::uuid,
 'Underwriting-Checklist-Q1-2026.pdf',
 'Underwriting Checklist Q1 2026',
 'Internal underwriting checklist for merchant cash advance applications. Bank statement review, credit pull, business verification, stacking check.',
 'underwriting',
 '2026-01-02',
 ARRAY['internal', 'underwriting', 'Underwriting-Checklist-Q1-2026.pdf'],
 'completed'::document_processing_status,
 'en'),

-- Broker Commission Schedule
('f1000000-0000-0000-0000-000000000005'::uuid,
 :'team_id'::uuid,
 'Commission-Schedule-2026.pdf',
 'Broker Commission Schedule 2026',
 'ISO and broker commission rate schedule for 2026. Pinnacle Funding Group 10%, Capital Brokers LLC 11%, Southwest Funding Partners 11%.',
 'finance',
 '2026-01-03',
 ARRAY['brokers', 'Commission-Schedule-2026.pdf'],
 'completed'::document_processing_status,
 'en'),

-- Default & Collections Policy
('f1000000-0000-0000-0000-000000000006'::uuid,
 :'team_id'::uuid,
 'Default-Collection-Policy-2026.pdf',
 'Default and Collection Policy 2026',
 'Internal collections policy. NSF handling procedure, cure period notice, payment modification guidelines, legal escalation triggers.',
 'policy',
 '2026-01-05',
 ARRAY['internal', 'policy', 'Default-Collection-Policy-2026.pdf'],
 'completed'::document_processing_status,
 'en')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. VAULT DOCUMENT TAGS + ASSIGNMENTS
-- ============================================================================
INSERT INTO document_tags (team_id, name, slug) VALUES
  (:'team_id'::uuid, 'Contract',   'contract'),
  (:'team_id'::uuid, 'Disclosure', 'disclosure'),
  (:'team_id'::uuid, 'Internal',   'internal'),
  (:'team_id'::uuid, 'Broker',     'broker'),
  (:'team_id'::uuid, 'Policy',     'policy')
ON CONFLICT ON CONSTRAINT unique_slug_per_team DO NOTHING;

-- Tag assignments: link each document to its appropriate tag
INSERT INTO document_tag_assignments (document_id, tag_id, team_id)
SELECT d.id, dt.id, d.team_id
FROM documents d
JOIN document_tags dt ON dt.team_id = d.team_id
WHERE d.team_id = :'team_id'::uuid
  AND (
    (d.name = 'MCA-Agreement-Template-2026.pdf'     AND dt.slug = 'contract')   OR
    (d.name = 'NY-Disclosure-Template-v2.1.pdf'      AND dt.slug = 'disclosure') OR
    (d.name = 'CA-CFL-Disclosure-v1.3.pdf'           AND dt.slug = 'disclosure') OR
    (d.name = 'Underwriting-Checklist-Q1-2026.pdf'   AND dt.slug = 'internal')   OR
    (d.name = 'Commission-Schedule-2026.pdf'         AND dt.slug = 'broker')     OR
    (d.name = 'Default-Collection-Policy-2026.pdf'   AND dt.slug = 'policy')
  )
ON CONFLICT (document_id, tag_id) DO NOTHING;

-- ============================================================================
-- 10. INBOX ITEMS (5 rows)
-- Note: fts column is GENERATED ALWAYS via generate_inbox_fts() — do NOT insert
-- ============================================================================
INSERT INTO inbox (
  id, team_id, display_name, file_name, file_path,
  amount, currency, date, status, type,
  sender_email, description, content_type, size
) VALUES
-- Chase ACH Statement (done — already processed)
('a1100000-0000-0000-0000-000000000001'::uuid,
 :'team_id'::uuid,
 'Chase Bank - ACH Statement Feb 2026',
 'chase-ach-statement-2026-02.pdf',
 ARRAY['inbox', 'chase-ach-statement-2026-02.pdf'],
 NULL, 'USD', '2026-02-01',
 'done'::inbox_status, 'expense'::inbox_type,
 'statements@chase.com',
 'Monthly ACH origination statement showing all debit entries',
 'application/pdf', 524288),

-- Gusto Payroll (done — matched to transaction)
('a1100000-0000-0000-0000-000000000002'::uuid,
 :'team_id'::uuid,
 'Gusto Payroll - February Invoice',
 'gusto-payroll-2026-02.pdf',
 ARRAY['inbox', 'gusto-payroll-2026-02.pdf'],
 12000.00, 'USD', '2026-02-15',
 'done'::inbox_status, 'expense'::inbox_type,
 'billing@gusto.com',
 'Payroll processing fee and employer taxes for February 2026',
 'application/pdf', 245760),

-- State Farm Insurance (suggested match — needs review)
('a1100000-0000-0000-0000-000000000003'::uuid,
 :'team_id'::uuid,
 'State Farm - Business Insurance',
 'state-farm-invoice-feb-2026.pdf',
 ARRAY['inbox', 'state-farm-invoice-feb-2026.pdf'],
 600.00, 'USD', '2026-02-08',
 'suggested_match'::inbox_status, 'expense'::inbox_type,
 'billing@statefarm.com',
 'Monthly business insurance premium',
 'application/pdf', 98304),

-- Thompson Legal (done — archived)
('a1100000-0000-0000-0000-000000000004'::uuid,
 :'team_id'::uuid,
 'Thompson & Associates - Legal Retainer',
 'thompson-legal-invoice-jan-2026.pdf',
 ARRAY['inbox', 'thompson-legal-invoice-jan-2026.pdf'],
 1200.00, 'USD', '2026-01-10',
 'done'::inbox_status, 'expense'::inbox_type,
 'billing@thompsonlaw.com',
 'Monthly legal retainer for compliance and collections review',
 'application/pdf', 176128),

-- Unknown ACH Debit (pending — unprocessed, needs investigation)
('a1100000-0000-0000-0000-000000000005'::uuid,
 :'team_id'::uuid,
 'Unknown Sender - ACH Debit Notice',
 'unknown-ach-notice.pdf',
 ARRAY['inbox', 'unknown-ach-notice.pdf'],
 4750.00, 'USD', '2026-02-22',
 'pending'::inbox_status, 'expense'::inbox_type,
 'noreply@unknownsender.com',
 'Unexpected ACH debit — possible Westside Construction third-party lender',
 'application/pdf', 65536)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. MERCHANT NOTIFICATION PREFERENCES
-- ============================================================================
UPDATE merchants SET
  notification_email = true,
  notification_sms = false,
  notification_phone = NULL
WHERE team_id = :'team_id'::uuid
  AND notification_email IS NULL
  AND name IN (
    'Sunrise Diner', 'Bella Salon & Spa', 'Green Thumb Landscaping',
    'Lucky Dragon Restaurant', 'Smith Plumbing Services'
  );

-- Fitness First opted into SMS too
UPDATE merchants SET
  notification_email = true,
  notification_sms = true,
  notification_phone = '(305) 555-0199'
WHERE team_id = :'team_id'::uuid
  AND notification_email IS NULL
  AND name = 'Fitness First Gym';

-- ============================================================================
-- 12. RENEWAL OFFER NOTIFICATIONS (for paid-off merchants)
-- ============================================================================
INSERT INTO merchant_notifications (
  merchant_id, team_id, notification_type, title, message,
  email_sent, email_sent_at, read_in_portal, deal_id
)
SELECT
  m.id,
  :'team_id'::uuid,
  'general'::merchant_notification_type,
  'You have a renewal offer available',
  'Congratulations on successfully completing your MCA. Based on your excellent payment history, you qualify for a renewal offer with improved terms. Contact us today to learn more.',
  true,
  now() - interval '7 days',
  false,
  d.id
FROM merchants m
JOIN mca_deals d ON d.merchant_id = m.id AND d.team_id = :'team_id'::uuid
WHERE m.team_id = :'team_id'::uuid
  AND d.status = 'paid_off'
  AND NOT EXISTS (
    SELECT 1 FROM merchant_notifications mn
    WHERE mn.merchant_id = m.id
      AND mn.title = 'You have a renewal offer available'
  );

COMMIT;

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Portal & Config Seed Summary ===';
  FOR r IN
    SELECT 'late_fee_settings' AS tbl, count(*) AS cnt FROM late_fee_settings WHERE team_id = 'a0000000-0000-0000-0000-000000000001'
    UNION ALL SELECT 'ach_providers', count(*) FROM ach_providers WHERE team_id = 'a0000000-0000-0000-0000-000000000001'
    UNION ALL SELECT 'merchant_portal_invites', count(*) FROM merchant_portal_invites WHERE team_id = 'a0000000-0000-0000-0000-000000000001'
    UNION ALL SELECT 'merchant_portal_sessions', count(*) FROM merchant_portal_sessions WHERE merchant_id IN (SELECT id FROM merchants WHERE team_id = 'a0000000-0000-0000-0000-000000000001')
    UNION ALL SELECT 'merchant_portal_access', count(*) FROM merchant_portal_access WHERE team_id = 'a0000000-0000-0000-0000-000000000001'
    UNION ALL SELECT 'documents (vault)', count(*) FROM documents WHERE team_id = 'a0000000-0000-0000-0000-000000000001'
    UNION ALL SELECT 'document_tag_assignments', count(*) FROM document_tag_assignments WHERE team_id = 'a0000000-0000-0000-0000-000000000001'
    UNION ALL SELECT 'inbox', count(*) FROM inbox WHERE team_id = 'a0000000-0000-0000-0000-000000000001'
    UNION ALL SELECT 'mca_deals (start_date)', count(*) FROM mca_deals WHERE team_id = 'a0000000-0000-0000-0000-000000000001' AND start_date IS NOT NULL
    UNION ALL SELECT 'bank_accounts', count(*) FROM bank_accounts WHERE team_id = 'a0000000-0000-0000-0000-000000000001'
    ORDER BY 1
  LOOP
    RAISE NOTICE '  % : % rows', r.tbl, r.cnt;
  END LOOP;
  RAISE NOTICE '====================================';
END $$;
