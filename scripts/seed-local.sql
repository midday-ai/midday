-- ============================================================================
-- Seed: Comprehensive Demo Data for Abacus Dashboard (local dev)
-- Run directly: docker exec supabase_db_abacus psql -h 127.0.0.1 -U postgres -d postgres -f /tmp/seed-local.sql
-- ============================================================================

DO $$
DECLARE
  v_team_id  uuid := 'a0000000-0000-0000-0000-000000000001';
  v_bank_op  uuid := 'ba000000-0000-0000-0000-000000000001';
  v_bank_res uuid := 'ba000000-0000-0000-0000-000000000002';
  v_bc_id    uuid := 'bc000000-0000-0000-0000-000000000001';
  v_user_id  uuid;

  -- Customer IDs
  v_c_sunrise     uuid;
  v_c_martinez    uuid;
  v_c_bella       uuid;
  v_c_tonys       uuid;
  v_c_quickprint  uuid;
  v_c_westside    uuid;
  v_c_greenthumb  uuid;
  v_c_fitness     uuid;
  v_c_luckydragon uuid;
  v_c_smith       uuid;

  -- Deal IDs
  v_d_sunrise     uuid := gen_random_uuid();
  v_d_martinez    uuid := gen_random_uuid();
  v_d_bella       uuid := gen_random_uuid();
  v_d_tonys       uuid := gen_random_uuid();
  v_d_quickprint  uuid := gen_random_uuid();
  v_d_westside    uuid := gen_random_uuid();
  v_d_greenthumb  uuid := gen_random_uuid();
  v_d_fitness     uuid := gen_random_uuid();
  v_d_luckydragon uuid := gen_random_uuid();
  v_d_smith       uuid := gen_random_uuid();

  v_template_id uuid := gen_random_uuid();

  -- Tag IDs
  v_tag_vip        uuid;
  v_tag_highrisk   uuid;
  v_tag_renewal    uuid;
  v_tag_newclient  uuid;
  v_tag_seasonal   uuid;

BEGIN

  -- Get user
  SELECT id INTO v_user_id FROM public.users WHERE email = 'suph.tweel@gmail.com';
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User suph.tweel@gmail.com not found. Cannot seed.';
    RETURN;
  END IF;
  RAISE NOTICE 'Found user: %', v_user_id;

  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM public.mca_deals WHERE deal_code = 'MCA-2025-001' AND team_id = v_team_id) THEN
    RAISE NOTICE 'Demo data already exists. Skipping.';
    RETURN;
  END IF;

  -- ========================================================================
  -- 1. BANK CONNECTION & BANK ACCOUNTS
  -- ========================================================================

  INSERT INTO public.bank_connections (id, team_id, institution_id, name, provider, status)
  VALUES (v_bc_id, v_team_id, 'manual_local', 'Manual Accounts', 'plaid', 'connected')
  ON CONFLICT (institution_id, team_id) DO NOTHING;

  INSERT INTO public.bank_accounts (id, team_id, created_by, name, currency, balance, type, manual, enabled, account_id, bank_connection_id)
  VALUES
    (v_bank_op, v_team_id, v_user_id, 'Abacus Capital Operating', 'USD', 847500.00, 'depository', false, true, 'acct_operating_001', v_bc_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.bank_accounts (id, team_id, created_by, name, currency, balance, type, manual, enabled, account_id, bank_connection_id)
  VALUES
    (v_bank_res, v_team_id, v_user_id, 'Abacus Capital Reserve', 'USD', 250000.00, 'depository', false, true, 'acct_reserve_001', v_bc_id)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Bank connection + 2 accounts created';

  -- ========================================================================
  -- 2. LOOK UP CUSTOMER IDs
  -- ========================================================================

  SELECT id INTO v_c_sunrise     FROM public.customers WHERE name = 'Sunrise Diner'             AND team_id = v_team_id;
  SELECT id INTO v_c_martinez    FROM public.customers WHERE name = 'Martinez Auto Repair'       AND team_id = v_team_id;
  SELECT id INTO v_c_bella       FROM public.customers WHERE name = 'Bella Salon & Spa'          AND team_id = v_team_id;
  SELECT id INTO v_c_tonys       FROM public.customers WHERE name = 'Tony''s Pizzeria'           AND team_id = v_team_id;
  SELECT id INTO v_c_quickprint  FROM public.customers WHERE name = 'Quick Print Solutions'       AND team_id = v_team_id;
  SELECT id INTO v_c_westside    FROM public.customers WHERE name = 'Westside Construction LLC'   AND team_id = v_team_id;
  SELECT id INTO v_c_greenthumb  FROM public.customers WHERE name = 'Green Thumb Landscaping'     AND team_id = v_team_id;
  SELECT id INTO v_c_fitness     FROM public.customers WHERE name = 'Fitness First Gym'           AND team_id = v_team_id;
  SELECT id INTO v_c_luckydragon FROM public.customers WHERE name = 'Lucky Dragon Restaurant'     AND team_id = v_team_id;
  SELECT id INTO v_c_smith       FROM public.customers WHERE name = 'Smith Plumbing Services'     AND team_id = v_team_id;

  IF v_c_sunrise IS NULL THEN
    RAISE NOTICE 'Customers not found. Cannot seed.';
    RETURN;
  END IF;
  RAISE NOTICE 'Found all 10 customers';

  -- ========================================================================
  -- 3. TAGS
  -- ========================================================================

  INSERT INTO public.tags (id, team_id, name) VALUES
    (gen_random_uuid(), v_team_id, 'VIP'),
    (gen_random_uuid(), v_team_id, 'High Risk'),
    (gen_random_uuid(), v_team_id, 'Renewal Ready'),
    (gen_random_uuid(), v_team_id, 'New Client'),
    (gen_random_uuid(), v_team_id, 'Seasonal')
  ON CONFLICT (team_id, name) DO NOTHING;

  SELECT id INTO v_tag_vip       FROM public.tags WHERE name = 'VIP'            AND team_id = v_team_id;
  SELECT id INTO v_tag_highrisk  FROM public.tags WHERE name = 'High Risk'      AND team_id = v_team_id;
  SELECT id INTO v_tag_renewal   FROM public.tags WHERE name = 'Renewal Ready'  AND team_id = v_team_id;
  SELECT id INTO v_tag_newclient FROM public.tags WHERE name = 'New Client'     AND team_id = v_team_id;
  SELECT id INTO v_tag_seasonal  FROM public.tags WHERE name = 'Seasonal'       AND team_id = v_team_id;

  INSERT INTO public.customer_tags (id, customer_id, team_id, tag_id) VALUES
    (gen_random_uuid(), v_c_luckydragon, v_team_id, v_tag_vip),
    (gen_random_uuid(), v_c_luckydragon, v_team_id, v_tag_renewal),
    (gen_random_uuid(), v_c_martinez,    v_team_id, v_tag_vip),
    (gen_random_uuid(), v_c_martinez,    v_team_id, v_tag_renewal),
    (gen_random_uuid(), v_c_smith,       v_team_id, v_tag_renewal),
    (gen_random_uuid(), v_c_westside,    v_team_id, v_tag_highrisk),
    (gen_random_uuid(), v_c_tonys,       v_team_id, v_tag_highrisk),
    (gen_random_uuid(), v_c_tonys,       v_team_id, v_tag_seasonal),
    (gen_random_uuid(), v_c_greenthumb,  v_team_id, v_tag_newclient),
    (gen_random_uuid(), v_c_fitness,     v_team_id, v_tag_newclient)
  ON CONFLICT (customer_id, tag_id) DO NOTHING;

  RAISE NOTICE 'Tags created + applied to customers';

  -- ========================================================================
  -- 4. MCA DEALS
  -- ========================================================================

  INSERT INTO public.mca_deals (
    id, team_id, customer_id, deal_code,
    funding_amount, factor_rate, payback_amount, daily_payment, payment_frequency,
    status, funded_at, expected_payoff_date,
    current_balance, total_paid, nsf_count
  ) VALUES
    (v_d_sunrise, v_team_id, v_c_sunrise, 'MCA-2025-001',
     65000.00, 1.3500, 87750.00, 485.00, 'daily',
     'active', NOW() - INTERVAL '8 months', (NOW() + INTERVAL '2 months')::date,
     5300.00, 82450.00, 0),
    (v_d_bella, v_team_id, v_c_bella, 'MCA-2025-003',
     45000.00, 1.3800, 62100.00, 275.00, 'daily',
     'active', NOW() - INTERVAL '5 months', (NOW() + INTERVAL '5 months')::date,
     31850.00, 30250.00, 0),
    (v_d_tonys, v_team_id, v_c_tonys, 'MCA-2025-004',
     60000.00, 1.4200, 85200.00, 380.00, 'daily',
     'late', NOW() - INTERVAL '6 months', (NOW() + INTERVAL '4 months')::date,
     37800.00, 47400.00, 2),
    (v_d_quickprint, v_team_id, v_c_quickprint, 'MCA-2025-005',
     70000.00, 1.4000, 98000.00, 425.00, 'daily',
     'active', NOW() - INTERVAL '4 months', (NOW() + INTERVAL '7 months')::date,
     61875.00, 36125.00, 1),
    (v_d_westside, v_team_id, v_c_westside, 'MCA-2025-006',
     75000.00, 1.4500, 108750.00, 1890.00, 'weekly',
     'late', NOW() - INTERVAL '7 months', (NOW() + INTERVAL '5 months')::date,
     55050.00, 53700.00, 4),
    (v_d_greenthumb, v_team_id, v_c_greenthumb, 'MCA-2026-001',
     40000.00, 1.3600, 54400.00, 295.00, 'daily',
     'active', NOW() - INTERVAL '14 days', (NOW() + INTERVAL '9 months')::date,
     51450.00, 2950.00, 0),
    (v_d_fitness, v_team_id, v_c_fitness, 'MCA-2026-002',
     80000.00, 1.3400, 107200.00, 510.00, 'daily',
     'active', NOW() - INTERVAL '7 days', (NOW() + INTERVAL '10 months')::date,
     104650.00, 2550.00, 0),
    (v_d_martinez, v_team_id, v_c_martinez, 'MCA-2024-001',
     50000.00, 1.3200, 66000.00, 320.00, 'daily',
     'paid_off', NOW() - INTERVAL '14 months', (NOW() - INTERVAL '4 months')::date,
     0.00, 66000.00, 0),
    (v_d_luckydragon, v_team_id, v_c_luckydragon, 'MCA-2024-002',
     75000.00, 1.3500, 101250.00, 450.00, 'daily',
     'paid_off', NOW() - INTERVAL '18 months', (NOW() - INTERVAL '7 months')::date,
     0.00, 101250.00, 0),
    (v_d_smith, v_team_id, v_c_smith, 'MCA-2024-003',
     50000.00, 1.3300, 66500.00, 350.00, 'daily',
     'paid_off', NOW() - INTERVAL '12 months', (NOW() - INTERVAL '3 months')::date,
     0.00, 66500.00, 0)
  ON CONFLICT (team_id, deal_code) DO NOTHING;

  RAISE NOTICE '10 MCA deals created';

  -- ========================================================================
  -- 5. MCA PAYMENT INCOME TRANSACTIONS (daily ACH)
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  )
  SELECT
    gen_random_uuid(), v_team_id, v_bank_op, d::date,
    mp.customer_name || ' - ACH Payment',
    'Daily MCA payment - ' || mp.customer_name,
    mp.daily_amount, 'USD', 'mca-payments', 'posted', 'ach',
    'demo_mca_' || mp.code || '_' || to_char(d::date, 'YYYYMMDD')
  FROM (
    VALUES
      ('Sunrise Diner',         485.00, (NOW() - INTERVAL '8 months')::date,  CURRENT_DATE,                          'sunrise'),
      ('Martinez Auto Repair',  320.00, (NOW() - INTERVAL '14 months')::date, (NOW() - INTERVAL '4 months')::date,   'martinez'),
      ('Bella Salon & Spa',     275.00, (NOW() - INTERVAL '5 months')::date,  CURRENT_DATE,                          'bella'),
      ('Tony''s Pizzeria',      380.00, (NOW() - INTERVAL '6 months')::date,  CURRENT_DATE,                          'tonys'),
      ('Quick Print Solutions',  425.00, (NOW() - INTERVAL '4 months')::date, CURRENT_DATE,                          'quickprint'),
      ('Lucky Dragon Restaurant',450.00, (NOW() - INTERVAL '18 months')::date,(NOW() - INTERVAL '7 months')::date,   'luckydragon'),
      ('Smith Plumbing Services',350.00, (NOW() - INTERVAL '12 months')::date,(NOW() - INTERVAL '3 months')::date,   'smith'),
      ('Green Thumb Landscaping',295.00, (NOW() - INTERVAL '14 days')::date,  CURRENT_DATE,                          'greenthumb'),
      ('Fitness First Gym',     510.00, (NOW() - INTERVAL '7 days')::date,    CURRENT_DATE,                          'fitness')
  ) AS mp(customer_name, daily_amount, start_date, end_date, code)
  CROSS JOIN LATERAL generate_series(mp.start_date, mp.end_date, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
  ON CONFLICT (internal_id) DO NOTHING;

  -- Weekly ACH for Westside Construction
  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  )
  SELECT
    gen_random_uuid(), v_team_id, v_bank_op, d::date,
    'Westside Construction LLC - Weekly ACH',
    'Weekly MCA payment - Westside Construction LLC',
    1890.00, 'USD', 'mca-payments', 'posted', 'ach',
    'demo_mca_westside_' || to_char(d::date, 'YYYYMMDD')
  FROM generate_series(
    (NOW() - INTERVAL '7 months')::date, CURRENT_DATE, '7 days'::interval
  ) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
  ON CONFLICT (internal_id) DO NOTHING;

  RAISE NOTICE 'MCA payment transactions created';

  -- ========================================================================
  -- 6. NSF RETURN TRANSACTIONS
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  ) VALUES
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '25 days')::date,
     'Tony''s Pizzeria - NSF Return', 'Returned ACH - insufficient funds',
     -380.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_tonys_1'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '12 days')::date,
     'Tony''s Pizzeria - NSF Return', 'Returned ACH - insufficient funds',
     -380.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_tonys_2'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '8 days')::date,
     'Quick Print Solutions - NSF Return', 'Returned ACH - insufficient funds',
     -425.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_quickprint_1'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '40 days')::date,
     'Westside Construction - NSF Return', 'Returned ACH - insufficient funds',
     -1890.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_westside_1'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '33 days')::date,
     'Westside Construction - NSF Return', 'Returned ACH - insufficient funds',
     -1890.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_westside_2'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '19 days')::date,
     'Westside Construction - NSF Return', 'Returned ACH - insufficient funds',
     -1890.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_westside_3'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '5 days')::date,
     'Westside Construction - NSF Return', 'Returned ACH - insufficient funds',
     -1890.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_westside_4')
  ON CONFLICT (internal_id) DO NOTHING;

  RAISE NOTICE 'NSF returns created';

  -- ========================================================================
  -- 7. FUNDING DISBURSEMENT TRANSACTIONS
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  ) VALUES
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '18 months')::date,
     'Funding - Lucky Dragon Restaurant', 'MCA funding disbursement MCA-2024-002',
     -75000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_luckydragon'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '14 months')::date,
     'Funding - Martinez Auto Repair', 'MCA funding disbursement MCA-2024-001',
     -50000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_martinez'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '12 months')::date,
     'Funding - Smith Plumbing Services', 'MCA funding disbursement MCA-2024-003',
     -50000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_smith'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '8 months')::date,
     'Funding - Sunrise Diner', 'MCA funding disbursement MCA-2025-001',
     -65000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_sunrise'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '7 months')::date,
     'Funding - Westside Construction', 'MCA funding disbursement MCA-2025-006',
     -75000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_westside'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '6 months')::date,
     'Funding - Tony''s Pizzeria', 'MCA funding disbursement MCA-2025-004',
     -60000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_tonys'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '5 months')::date,
     'Funding - Bella Salon & Spa', 'MCA funding disbursement MCA-2025-003',
     -45000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_bella'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '4 months')::date,
     'Funding - Quick Print Solutions', 'MCA funding disbursement MCA-2025-005',
     -70000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_quickprint'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '14 days')::date,
     'Funding - Green Thumb Landscaping', 'MCA funding disbursement MCA-2026-001',
     -40000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_greenthumb'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '7 days')::date,
     'Funding - Fitness First Gym', 'MCA funding disbursement MCA-2026-002',
     -80000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_fitness')
  ON CONFLICT (internal_id) DO NOTHING;

  RAISE NOTICE 'Funding disbursements created';

  -- ========================================================================
  -- 8. ISO COMMISSION PAYMENTS
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  ) VALUES
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '18 months')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Lucky Dragon deal (10%)',
     -7500.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_luckydragon'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '14 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on Martinez Auto deal (10%)',
     -5000.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_martinez'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '12 months')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on Smith Plumbing deal (11%)',
     -5500.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_smith'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '8 months')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Sunrise Diner deal (10%)',
     -6500.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_sunrise'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '7 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on Westside Construction deal (11%)',
     -8250.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_westside'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '6 months')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on Tony''s Pizzeria deal (11%)',
     -6600.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_tonys'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '5 months')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Bella Salon deal (11%)',
     -4950.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_bella'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '4 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on Quick Print deal (11%)',
     -7700.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_quickprint'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '14 days')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on Green Thumb deal (11%)',
     -4400.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_greenthumb'),
    (gen_random_uuid(), v_team_id, v_bank_op, (NOW() - INTERVAL '7 days')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Fitness First deal (11%)',
     -8800.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_fitness')
  ON CONFLICT (internal_id) DO NOTHING;

  RAISE NOTICE 'ISO commissions created';

  -- ========================================================================
  -- 9. MONTHLY OPERATING EXPENSES
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  )
  SELECT
    gen_random_uuid(), v_team_id, v_bank_op,
    LEAST((date_trunc('month', d) + (exp.day_offset || ' days')::interval)::date, CURRENT_DATE),
    exp.txn_name, exp.description, exp.amount, 'USD', 'operating-expenses', 'posted',
    exp.method::"transactionMethods",
    'demo_opex_' || exp.code || '_' || to_char(d::date, 'YYYYMM')
  FROM generate_series((NOW() - INTERVAL '12 months')::date, CURRENT_DATE, '1 month'::interval) d
  CROSS JOIN (
    VALUES
      ('Office Lease - 500 Commerce St',      'Monthly office rent',                        -3500.00, 'payment',       'rent',      1),
      ('Gusto Payroll',                        'Semi-monthly payroll processing',            -12000.00, 'ach',          'payroll',   15),
      ('Mercury - Software Stack',             'SaaS subscriptions (CRM, analytics, etc.)',  -850.00,  'card_purchase', 'software',  5),
      ('Thompson & Associates',                'Legal retainer - compliance & collections',  -1200.00, 'ach',          'legal',     10),
      ('State Farm Insurance',                 'Business insurance premium',                 -600.00,  'ach',          'insurance', 8),
      ('AT&T Business',                        'Phone & internet',                           -350.00,  'ach',          'telecom',   12),
      ('Office Depot',                         'Office supplies',                            -175.00,  'card_purchase', 'supplies',  20)
  ) AS exp(txn_name, description, amount, method, code, day_offset)
  WHERE (date_trunc('month', d) + (exp.day_offset || ' days')::interval)::date <= CURRENT_DATE
  ON CONFLICT (internal_id) DO NOTHING;

  RAISE NOTICE 'Operating expenses created';

  -- ========================================================================
  -- 10. MCA PAYMENT RECORDS (mca_payments table)
  -- ========================================================================

  INSERT INTO public.mca_payments (
    id, deal_id, team_id, amount, payment_date, payment_type, status, description
  )
  SELECT
    gen_random_uuid(), mp.deal_id, v_team_id, mp.daily_amount, d::date,
    'ach', 'completed', 'Daily ACH payment'
  FROM (
    VALUES
      (v_d_sunrise,     485.00, (NOW() - INTERVAL '8 months')::date,  CURRENT_DATE),
      (v_d_martinez,    320.00, (NOW() - INTERVAL '14 months')::date, (NOW() - INTERVAL '4 months')::date),
      (v_d_bella,       275.00, (NOW() - INTERVAL '5 months')::date,  CURRENT_DATE),
      (v_d_tonys,       380.00, (NOW() - INTERVAL '6 months')::date,  CURRENT_DATE),
      (v_d_quickprint,  425.00, (NOW() - INTERVAL '4 months')::date,  CURRENT_DATE),
      (v_d_luckydragon, 450.00, (NOW() - INTERVAL '18 months')::date, (NOW() - INTERVAL '7 months')::date),
      (v_d_smith,       350.00, (NOW() - INTERVAL '12 months')::date, (NOW() - INTERVAL '3 months')::date),
      (v_d_greenthumb,  295.00, (NOW() - INTERVAL '14 days')::date,   CURRENT_DATE),
      (v_d_fitness,     510.00, (NOW() - INTERVAL '7 days')::date,    CURRENT_DATE)
  ) AS mp(deal_id, daily_amount, start_date, end_date)
  CROSS JOIN LATERAL generate_series(mp.start_date, mp.end_date, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);

  -- Weekly Westside payments
  INSERT INTO public.mca_payments (
    id, deal_id, team_id, amount, payment_date, payment_type, status, description
  )
  SELECT
    gen_random_uuid(), v_d_westside, v_team_id, 1890.00, d::date,
    'ach', 'completed', 'Weekly ACH payment'
  FROM generate_series((NOW() - INTERVAL '7 months')::date, CURRENT_DATE, '7 days'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);

  -- NSF payment records
  INSERT INTO public.mca_payments (
    id, deal_id, team_id, amount, payment_date,
    payment_type, status, description, nsf_at, nsf_fee
  ) VALUES
    (gen_random_uuid(), v_d_tonys,     v_team_id, 380.00,  (NOW() - INTERVAL '25 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '25 days', 35.00),
    (gen_random_uuid(), v_d_tonys,     v_team_id, 380.00,  (NOW() - INTERVAL '12 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '12 days', 35.00),
    (gen_random_uuid(), v_d_quickprint,v_team_id, 425.00,  (NOW() - INTERVAL '8 days')::date,  'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '8 days',  35.00),
    (gen_random_uuid(), v_d_westside,  v_team_id, 1890.00, (NOW() - INTERVAL '40 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '40 days', 35.00),
    (gen_random_uuid(), v_d_westside,  v_team_id, 1890.00, (NOW() - INTERVAL '33 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '33 days', 35.00),
    (gen_random_uuid(), v_d_westside,  v_team_id, 1890.00, (NOW() - INTERVAL '19 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '19 days', 35.00),
    (gen_random_uuid(), v_d_westside,  v_team_id, 1890.00, (NOW() - INTERVAL '5 days')::date,  'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '5 days',  35.00);

  RAISE NOTICE 'MCA payment records created';

  -- ========================================================================
  -- 11. INVOICE TEMPLATE
  -- ========================================================================

  INSERT INTO public.invoice_templates (id, team_id, name, is_default, currency, size)
  VALUES (v_template_id, v_team_id, 'Default', true, 'USD', 'letter')
  ON CONFLICT DO NOTHING;

  -- ========================================================================
  -- 12. INVOICES
  -- ========================================================================

  INSERT INTO public.invoices (
    id, team_id, customer_id, user_id, template_id,
    invoice_number, status, issue_date, due_date,
    amount, subtotal, currency, customer_name, line_items, token
  ) VALUES
    -- PAID: Historical fundings
    (gen_random_uuid(), v_team_id, v_c_luckydragon, v_user_id, v_template_id,
     'INV-2024-001', 'paid', NOW() - INTERVAL '18 months', NOW() - INTERVAL '17 months',
     75000.00, 75000.00, 'USD', 'Lucky Dragon Restaurant',
     '[{"name": "MCA Funding - MCA-2024-002", "quantity": 1, "price": 75000}]'::jsonb, 'tok_inv_001'),
    (gen_random_uuid(), v_team_id, v_c_martinez, v_user_id, v_template_id,
     'INV-2024-002', 'paid', NOW() - INTERVAL '14 months', NOW() - INTERVAL '13 months',
     50000.00, 50000.00, 'USD', 'Martinez Auto Repair',
     '[{"name": "MCA Funding - MCA-2024-001", "quantity": 1, "price": 50000}]'::jsonb, 'tok_inv_002'),
    (gen_random_uuid(), v_team_id, v_c_smith, v_user_id, v_template_id,
     'INV-2024-003', 'paid', NOW() - INTERVAL '12 months', NOW() - INTERVAL '11 months',
     50000.00, 50000.00, 'USD', 'Smith Plumbing Services',
     '[{"name": "MCA Funding - MCA-2024-003", "quantity": 1, "price": 50000}]'::jsonb, 'tok_inv_003'),
    (gen_random_uuid(), v_team_id, v_c_sunrise, v_user_id, v_template_id,
     'INV-2025-001', 'paid', NOW() - INTERVAL '8 months', NOW() - INTERVAL '7 months',
     65000.00, 65000.00, 'USD', 'Sunrise Diner',
     '[{"name": "MCA Funding - MCA-2025-001", "quantity": 1, "price": 65000}]'::jsonb, 'tok_inv_004'),
    (gen_random_uuid(), v_team_id, v_c_westside, v_user_id, v_template_id,
     'INV-2025-002', 'paid', NOW() - INTERVAL '7 months', NOW() - INTERVAL '6 months',
     75000.00, 75000.00, 'USD', 'Westside Construction LLC',
     '[{"name": "MCA Funding - MCA-2025-006", "quantity": 1, "price": 75000}]'::jsonb, 'tok_inv_005'),
    (gen_random_uuid(), v_team_id, v_c_tonys, v_user_id, v_template_id,
     'INV-2025-003', 'paid', NOW() - INTERVAL '6 months', NOW() - INTERVAL '5 months',
     60000.00, 60000.00, 'USD', 'Tony''s Pizzeria',
     '[{"name": "MCA Funding - MCA-2025-004", "quantity": 1, "price": 60000}]'::jsonb, 'tok_inv_006'),
    (gen_random_uuid(), v_team_id, v_c_bella, v_user_id, v_template_id,
     'INV-2025-004', 'paid', NOW() - INTERVAL '5 months', NOW() - INTERVAL '4 months',
     45000.00, 45000.00, 'USD', 'Bella Salon & Spa',
     '[{"name": "MCA Funding - MCA-2025-003", "quantity": 1, "price": 45000}]'::jsonb, 'tok_inv_007'),
    (gen_random_uuid(), v_team_id, v_c_quickprint, v_user_id, v_template_id,
     'INV-2025-005', 'paid', NOW() - INTERVAL '4 months', NOW() - INTERVAL '3 months',
     70000.00, 70000.00, 'USD', 'Quick Print Solutions',
     '[{"name": "MCA Funding - MCA-2025-005", "quantity": 1, "price": 70000}]'::jsonb, 'tok_inv_008'),
    -- UNPAID: Recent fundings
    (gen_random_uuid(), v_team_id, v_c_greenthumb, v_user_id, v_template_id,
     'INV-2026-001', 'unpaid', NOW() - INTERVAL '14 days', NOW() + INTERVAL '16 days',
     40000.00, 40000.00, 'USD', 'Green Thumb Landscaping',
     '[{"name": "MCA Funding - MCA-2026-001", "quantity": 1, "price": 40000}]'::jsonb, 'tok_inv_009'),
    (gen_random_uuid(), v_team_id, v_c_fitness, v_user_id, v_template_id,
     'INV-2026-002', 'unpaid', NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days',
     80000.00, 80000.00, 'USD', 'Fitness First Gym',
     '[{"name": "MCA Funding - MCA-2026-002", "quantity": 1, "price": 80000}]'::jsonb, 'tok_inv_010'),
    -- OVERDUE
    (gen_random_uuid(), v_team_id, v_c_westside, v_user_id, v_template_id,
     'INV-2025-006', 'overdue', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month',
     2500.00, 2500.00, 'USD', 'Westside Construction LLC',
     '[{"name": "Legal fees - Collections review", "quantity": 1, "price": 2500}]'::jsonb, 'tok_inv_011'),
    -- DRAFT: Renewal offers
    (gen_random_uuid(), v_team_id, v_c_luckydragon, v_user_id, v_template_id,
     'INV-2026-003', 'draft', NOW(), NOW() + INTERVAL '30 days',
     100000.00, 100000.00, 'USD', 'Lucky Dragon Restaurant',
     '[{"name": "MCA Renewal Offer - Up to $100,000", "quantity": 1, "price": 100000}]'::jsonb, 'tok_inv_012'),
    (gen_random_uuid(), v_team_id, v_c_smith, v_user_id, v_template_id,
     'INV-2026-004', 'draft', NOW(), NOW() + INTERVAL '30 days',
     75000.00, 75000.00, 'USD', 'Smith Plumbing Services',
     '[{"name": "MCA Renewal Offer - Up to $75,000", "quantity": 1, "price": 75000}]'::jsonb, 'tok_inv_013');

  -- ========================================================================
  -- 13. BACKFILL deal_code, transaction_type, payment_status on transactions
  -- ========================================================================

  -- MCA daily/weekly ACH payments → credit, completed
  UPDATE public.transactions
  SET transaction_type = 'credit',
      payment_status   = 'completed',
      deal_code = CASE
        WHEN internal_id LIKE 'demo_mca_sunrise_%'    THEN 'MCA-2025-001'
        WHEN internal_id LIKE 'demo_mca_bella_%'       THEN 'MCA-2025-003'
        WHEN internal_id LIKE 'demo_mca_tonys_%'       THEN 'MCA-2025-004'
        WHEN internal_id LIKE 'demo_mca_quickprint_%'  THEN 'MCA-2025-005'
        WHEN internal_id LIKE 'demo_mca_westside_%'    THEN 'MCA-2025-006'
        WHEN internal_id LIKE 'demo_mca_greenthumb_%'  THEN 'MCA-2026-001'
        WHEN internal_id LIKE 'demo_mca_fitness_%'     THEN 'MCA-2026-002'
        WHEN internal_id LIKE 'demo_mca_martinez_%'    THEN 'MCA-2024-001'
        WHEN internal_id LIKE 'demo_mca_luckydragon_%' THEN 'MCA-2024-002'
        WHEN internal_id LIKE 'demo_mca_smith_%'       THEN 'MCA-2024-003'
      END
  WHERE category_slug = 'mca-payments'
    AND team_id = v_team_id;

  -- NSF returns → debit, failed
  UPDATE public.transactions
  SET transaction_type = 'debit',
      payment_status   = 'failed',
      deal_code = CASE
        WHEN internal_id LIKE 'demo_nsf_tonys_%'      THEN 'MCA-2025-004'
        WHEN internal_id LIKE 'demo_nsf_quickprint_%'  THEN 'MCA-2025-005'
        WHEN internal_id LIKE 'demo_nsf_westside_%'    THEN 'MCA-2025-006'
      END
  WHERE category_slug = 'nsf-returns'
    AND team_id = v_team_id;

  -- Funding disbursements → transfer, completed
  UPDATE public.transactions
  SET transaction_type = 'transfer',
      payment_status   = 'completed',
      deal_code = CASE
        WHEN internal_id = 'demo_fund_sunrise'     THEN 'MCA-2025-001'
        WHEN internal_id = 'demo_fund_bella'        THEN 'MCA-2025-003'
        WHEN internal_id = 'demo_fund_tonys'        THEN 'MCA-2025-004'
        WHEN internal_id = 'demo_fund_quickprint'   THEN 'MCA-2025-005'
        WHEN internal_id = 'demo_fund_westside'     THEN 'MCA-2025-006'
        WHEN internal_id = 'demo_fund_greenthumb'   THEN 'MCA-2026-001'
        WHEN internal_id = 'demo_fund_fitness'      THEN 'MCA-2026-002'
        WHEN internal_id = 'demo_fund_martinez'     THEN 'MCA-2024-001'
        WHEN internal_id = 'demo_fund_luckydragon'  THEN 'MCA-2024-002'
        WHEN internal_id = 'demo_fund_smith'        THEN 'MCA-2024-003'
      END
  WHERE category_slug = 'funding-disbursements'
    AND team_id = v_team_id;

  -- ISO commissions → fee, completed
  UPDATE public.transactions
  SET transaction_type = 'fee',
      payment_status   = 'completed',
      deal_code = CASE
        WHEN internal_id = 'demo_iso_luckydragon' THEN 'MCA-2024-002'
        WHEN internal_id = 'demo_iso_martinez'     THEN 'MCA-2024-001'
        WHEN internal_id = 'demo_iso_smith'        THEN 'MCA-2024-003'
        WHEN internal_id = 'demo_iso_sunrise'      THEN 'MCA-2025-001'
        WHEN internal_id = 'demo_iso_westside'     THEN 'MCA-2025-006'
        WHEN internal_id = 'demo_iso_tonys'        THEN 'MCA-2025-004'
        WHEN internal_id = 'demo_iso_bella'        THEN 'MCA-2025-003'
        WHEN internal_id = 'demo_iso_quickprint'   THEN 'MCA-2025-005'
        WHEN internal_id = 'demo_iso_greenthumb'   THEN 'MCA-2026-001'
        WHEN internal_id = 'demo_iso_fitness'      THEN 'MCA-2026-002'
      END
  WHERE category_slug = 'iso-commissions'
    AND team_id = v_team_id;

  -- Operating expenses → debit, completed (no deal_code)
  UPDATE public.transactions
  SET transaction_type = 'debit',
      payment_status   = 'completed'
  WHERE category_slug = 'operating-expenses'
    AND team_id = v_team_id;

  RAISE NOTICE 'Transaction deal_code + type backfill complete';

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '  Demo data seeded successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '  - 1 bank connection + 2 bank accounts';
  RAISE NOTICE '  - 10 customers (pre-existing)';
  RAISE NOTICE '  - 10 MCA deals (7 active, 3 paid off)';
  RAISE NOTICE '  - ~1,200+ transactions spanning 18 months';
  RAISE NOTICE '  - 13 invoices (8 paid, 2 unpaid, 1 overdue, 2 draft)';
  RAISE NOTICE '  - 5 tags applied to customers';
  RAISE NOTICE '  - ~1,200+ MCA payment records';
  RAISE NOTICE '============================================';

END $$;
