-- Create test user in Supabase Auth
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  -- GoTrue requires these string columns to be non-NULL (Go sql.Scan fails on NULL -> string)
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'suph.tweel@gmail.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Suphi Tweel"}',
  'authenticated',
  'authenticated',
  '', '', '', '', '', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Create identity for the user
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'suph.tweel@gmail.com',
  'email',
  '{"sub": "00000000-0000-0000-0000-000000000001", "email": "suph.tweel@gmail.com"}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create profile in public.users table
INSERT INTO public.users (id, email, full_name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'suph.tweel@gmail.com',
  'Suphi Tweel',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Comprehensive Demo Data for Abacus Dashboard
-- Runs after user creation so the user lookup succeeds.
-- ============================================================================

DO $$
DECLARE
  v_team_id  uuid := 'a0000000-0000-0000-0000-000000000001';
  v_bank_op  uuid := 'ba000000-0000-0000-0000-000000000001';
  v_bank_res uuid := 'ba000000-0000-0000-0000-000000000002';
  v_user_id  uuid := '00000000-0000-0000-0000-000000000001';

  -- Customer IDs (looked up from existing data)
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
  -- New merchants (11-20)
  v_c_harbor      uuid;
  v_c_bluesky     uuid;
  v_c_crossfit    uuid;
  v_c_catering    uuid;
  v_c_nightowl    uuid;
  v_c_nailstudio  uuid;
  v_c_redrock     uuid;
  v_c_bookshelf   uuid;
  v_c_cardinal    uuid;
  v_c_urgentcare  uuid;

  -- Deal IDs (deterministic for reproducible seeds)
  v_d_sunrise     uuid := 'd0000000-0000-0000-0000-000000000001';
  v_d_martinez    uuid := 'd0000000-0000-0000-0000-000000000002';
  v_d_bella       uuid := 'd0000000-0000-0000-0000-000000000003';
  v_d_tonys       uuid := 'd0000000-0000-0000-0000-000000000004';
  v_d_quickprint  uuid := 'd0000000-0000-0000-0000-000000000005';
  v_d_westside    uuid := 'd0000000-0000-0000-0000-000000000006';
  v_d_greenthumb  uuid := 'd0000000-0000-0000-0000-000000000007';
  v_d_fitness     uuid := 'd0000000-0000-0000-0000-000000000008';
  v_d_luckydragon uuid := 'd0000000-0000-0000-0000-000000000009';
  v_d_smith       uuid := 'd0000000-0000-0000-0000-000000000010';
  -- New deals (13 total: 10 single + 3 renewal second deals)
  v_d_harbor         uuid := 'd0000000-0000-0000-0000-000000000011';
  v_d_bluesky        uuid := 'd0000000-0000-0000-0000-000000000012';
  v_d_crossfit       uuid := 'd0000000-0000-0000-0000-000000000013';
  v_d_catering       uuid := 'd0000000-0000-0000-0000-000000000014';
  v_d_nightowl       uuid := 'd0000000-0000-0000-0000-000000000015';
  v_d_nailstudio     uuid := 'd0000000-0000-0000-0000-000000000016';
  v_d_redrock        uuid := 'd0000000-0000-0000-0000-000000000017';
  v_d_urgentcare     uuid := 'd0000000-0000-0000-0000-000000000018';
  -- Renewal chain deals (paid-off first deals + active second deals)
  v_d_bookshelf_1    uuid := 'd0000000-0000-0000-0000-000000000019';
  v_d_bookshelf_2    uuid := 'd0000000-0000-0000-0000-000000000020';
  v_d_cardinal_1     uuid := 'd0000000-0000-0000-0000-000000000021';
  v_d_cardinal_2     uuid := 'd0000000-0000-0000-0000-000000000022';
  v_d_luckydragon_2  uuid := 'd0000000-0000-0000-0000-000000000023';

  -- Deal template
  v_template_id uuid := 'd1000000-0000-0000-0000-000000000001';

  -- Tag IDs
  v_tag_vip        uuid;
  v_tag_highrisk   uuid;
  v_tag_renewal    uuid;
  v_tag_newclient  uuid;
  v_tag_seasonal   uuid;

  -- Broker IDs (deterministic)
  v_broker_pinnacle   uuid := 'b0000000-0000-0000-0000-000000000001';
  v_broker_capital    uuid := 'b0000000-0000-0000-0000-000000000002';
  v_broker_southwest  uuid := 'b0000000-0000-0000-0000-000000000003';

  -- Syndicator IDs (deterministic)
  v_syndicator_atlas    uuid := 'c0000000-0000-0000-0000-000000000001';
  v_syndicator_meridian uuid := 'c0000000-0000-0000-0000-000000000002';
  v_syndicator_coastal  uuid := 'c0000000-0000-0000-0000-000000000003';

  -- Collection Stage IDs (deterministic)
  v_cs_early       uuid := 'c5000000-0000-0000-0000-000000000001';
  v_cs_promise     uuid := 'c5000000-0000-0000-0000-000000000002';
  v_cs_plan        uuid := 'c5000000-0000-0000-0000-000000000003';
  v_cs_escalated   uuid := 'c5000000-0000-0000-0000-000000000004';
  v_cs_legal       uuid := 'c5000000-0000-0000-0000-000000000005';
  v_cs_agency      uuid := 'c5000000-0000-0000-0000-000000000006';
  v_cs_resolved    uuid := 'c5000000-0000-0000-0000-000000000007';

  -- Collection Agency IDs (deterministic)
  v_agency_premier uuid := 'ca000000-0000-0000-0000-000000000001';
  v_agency_rapid   uuid := 'ca000000-0000-0000-0000-000000000002';

  -- Collection Case IDs (deterministic)
  v_cc_tonys       uuid := 'cc000000-0000-0000-0000-000000000001';
  v_cc_westside    uuid := 'cc000000-0000-0000-0000-000000000002';
  v_cc_redrock     uuid := 'cc000000-0000-0000-0000-000000000003';
  v_cc_catering    uuid := 'cc000000-0000-0000-0000-000000000004';
  v_cc_nightowl    uuid := 'cc000000-0000-0000-0000-000000000005';

BEGIN

  -- ========================================================================
  -- GUARD: Skip if demo data already exists
  -- ========================================================================
  IF EXISTS (
    SELECT 1 FROM public.mca_deals
    WHERE deal_code = 'MCA-2025-001' AND team_id = v_team_id
  ) THEN
    RAISE NOTICE 'Demo data already exists. Skipping seed.';
    RETURN;
  END IF;

  -- ========================================================================
  -- 1. USER & TEAM SETUP
  -- ========================================================================

  -- Link user to team (only if not already a member)
  INSERT INTO public.users_on_team (user_id, team_id, role)
  SELECT v_user_id, v_team_id, 'owner'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users_on_team
    WHERE user_id = v_user_id AND team_id = v_team_id
  );

  -- Set team_id on user (legacy field, some queries may still use it)
  UPDATE public.users SET team_id = v_team_id
  WHERE id = v_user_id AND team_id IS NULL;

  -- Update team branding
  UPDATE public.teams SET
    email = 'hello@abacuscapital.com',
    inbox_email = 'inbox@abacuscapital.com'
  WHERE id = v_team_id;

  -- ========================================================================
  -- 2. BANK CONNECTION & BANK ACCOUNTS
  -- ========================================================================

  INSERT INTO public.bank_connections (id, team_id, institution_id, name, provider, status)
  VALUES
    ('bc000000-0000-0000-0000-000000000001'::uuid, v_team_id, 'manual_local', 'Manual Accounts', 'plaid', 'connected')
  ON CONFLICT (institution_id, team_id) DO NOTHING;

  INSERT INTO public.bank_accounts (id, team_id, created_by, name, currency, balance, type, manual, enabled, account_id, bank_connection_id)
  VALUES
    (v_bank_op, v_team_id, v_user_id, 'Abacus Capital Operating', 'USD', 847500.00, 'depository', false, true, 'acct_operating_001',
     'bc000000-0000-0000-0000-000000000001'::uuid)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.bank_accounts (id, team_id, created_by, name, currency, balance, type, manual, enabled, account_id, bank_connection_id)
  VALUES
    (v_bank_res, v_team_id, v_user_id, 'Abacus Capital Reserve', 'USD', 250000.00, 'depository', false, true, 'acct_reserve_001',
     'bc000000-0000-0000-0000-000000000001'::uuid)
  ON CONFLICT (id) DO NOTHING;

  -- ========================================================================
  -- 3. LOOK UP CUSTOMER IDs
  -- ========================================================================

  SELECT id INTO v_c_sunrise     FROM public.merchants WHERE name = 'Sunrise Diner'             AND team_id = v_team_id;
  SELECT id INTO v_c_martinez    FROM public.merchants WHERE name = 'Martinez Auto Repair'       AND team_id = v_team_id;
  SELECT id INTO v_c_bella       FROM public.merchants WHERE name = 'Bella Salon & Spa'          AND team_id = v_team_id;
  SELECT id INTO v_c_tonys       FROM public.merchants WHERE name = 'Tony''s Pizzeria'           AND team_id = v_team_id;
  SELECT id INTO v_c_quickprint  FROM public.merchants WHERE name = 'Quick Print Solutions'       AND team_id = v_team_id;
  SELECT id INTO v_c_westside    FROM public.merchants WHERE name = 'Westside Construction LLC'   AND team_id = v_team_id;
  SELECT id INTO v_c_greenthumb  FROM public.merchants WHERE name = 'Green Thumb Landscaping'     AND team_id = v_team_id;
  SELECT id INTO v_c_fitness     FROM public.merchants WHERE name = 'Fitness First Gym'           AND team_id = v_team_id;
  SELECT id INTO v_c_luckydragon FROM public.merchants WHERE name = 'Lucky Dragon Restaurant'     AND team_id = v_team_id;
  SELECT id INTO v_c_smith       FROM public.merchants WHERE name = 'Smith Plumbing Services'     AND team_id = v_team_id;
  -- New merchants (11-20)
  SELECT id INTO v_c_harbor      FROM public.merchants WHERE name = 'Harbor Freight Logistics'    AND team_id = v_team_id;
  SELECT id INTO v_c_bluesky     FROM public.merchants WHERE name = 'BlueSky Dental Group'        AND team_id = v_team_id;
  SELECT id INTO v_c_crossfit    FROM public.merchants WHERE name = 'Peak Performance CrossFit'   AND team_id = v_team_id;
  SELECT id INTO v_c_catering    FROM public.merchants WHERE name = 'Coastal Catering Co.'        AND team_id = v_team_id;
  SELECT id INTO v_c_nightowl    FROM public.merchants WHERE name = 'NightOwl Printing'           AND team_id = v_team_id;
  SELECT id INTO v_c_nailstudio  FROM public.merchants WHERE name = 'Golden Gate Nail Studio'     AND team_id = v_team_id;
  SELECT id INTO v_c_redrock     FROM public.merchants WHERE name = 'Redrock Excavation LLC'      AND team_id = v_team_id;
  SELECT id INTO v_c_bookshelf   FROM public.merchants WHERE name = 'The Bookshelf Cafe'          AND team_id = v_team_id;
  SELECT id INTO v_c_cardinal    FROM public.merchants WHERE name = 'Cardinal Electric Co.'       AND team_id = v_team_id;
  SELECT id INTO v_c_urgentcare  FROM public.merchants WHERE name = 'Lakeside Urgent Care'        AND team_id = v_team_id;

  IF v_c_sunrise IS NULL THEN
    RAISE NOTICE 'Customers not found. Run the previous seed migration first.';
    RETURN;
  END IF;

  -- ========================================================================
  -- 4. TAGS
  -- ========================================================================

  INSERT INTO public.tags (id, team_id, name)
  VALUES
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

  INSERT INTO public.merchant_tags (id, merchant_id, team_id, tag_id)
  VALUES
    (gen_random_uuid(), v_c_luckydragon, v_team_id, v_tag_vip),
    (gen_random_uuid(), v_c_luckydragon, v_team_id, v_tag_renewal),
    (gen_random_uuid(), v_c_martinez,    v_team_id, v_tag_vip),
    (gen_random_uuid(), v_c_martinez,    v_team_id, v_tag_renewal),
    (gen_random_uuid(), v_c_smith,       v_team_id, v_tag_renewal),
    (gen_random_uuid(), v_c_westside,    v_team_id, v_tag_highrisk),
    (gen_random_uuid(), v_c_tonys,       v_team_id, v_tag_highrisk),
    (gen_random_uuid(), v_c_tonys,       v_team_id, v_tag_seasonal),
    (gen_random_uuid(), v_c_greenthumb,  v_team_id, v_tag_newclient),
    (gen_random_uuid(), v_c_fitness,     v_team_id, v_tag_newclient),
    -- New merchants (11-20)
    (gen_random_uuid(), v_c_bluesky,     v_team_id, v_tag_vip),
    (gen_random_uuid(), v_c_bluesky,     v_team_id, v_tag_renewal),
    (gen_random_uuid(), v_c_urgentcare,  v_team_id, v_tag_vip),
    (gen_random_uuid(), v_c_urgentcare,  v_team_id, v_tag_newclient),
    (gen_random_uuid(), v_c_crossfit,    v_team_id, v_tag_renewal),
    (gen_random_uuid(), v_c_catering,    v_team_id, v_tag_seasonal),
    (gen_random_uuid(), v_c_catering,    v_team_id, v_tag_highrisk),
    (gen_random_uuid(), v_c_nightowl,    v_team_id, v_tag_highrisk),
    (gen_random_uuid(), v_c_harbor,      v_team_id, v_tag_newclient),
    (gen_random_uuid(), v_c_nailstudio,  v_team_id, v_tag_newclient),
    (gen_random_uuid(), v_c_redrock,     v_team_id, v_tag_highrisk),
    (gen_random_uuid(), v_c_bookshelf,   v_team_id, v_tag_renewal),
    (gen_random_uuid(), v_c_cardinal,    v_team_id, v_tag_renewal)
  ON CONFLICT (merchant_id, tag_id) DO NOTHING;

  -- ========================================================================
  -- 5. MCA DEALS
  -- ========================================================================

  INSERT INTO public.mca_deals (
    id, team_id, merchant_id, deal_code,
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
     0.00, 66500.00, 0),

    -- ======== NEW DEALS (11-20 + renewal chains) ========

    -- Renewal chain: Bookshelf Cafe Deal 1 (paid off)
    (v_d_bookshelf_1, v_team_id, v_c_bookshelf, 'MCA-2024-004',
     35000.00, 1.3800, 48300.00, 215.00, 'daily',
     'paid_off', NOW() - INTERVAL '24 months', (NOW() - INTERVAL '15 months')::date,
     0.00, 48300.00, 0),

    -- Renewal chain: Cardinal Electric Deal 1 (paid off)
    (v_d_cardinal_1, v_team_id, v_c_cardinal, 'MCA-2024-005',
     60000.00, 1.4000, 84000.00, 370.00, 'daily',
     'paid_off', NOW() - INTERVAL '22 months', (NOW() - INTERVAL '12 months')::date,
     0.00, 84000.00, 0),

    -- Redrock Excavation (defaulted)
    (v_d_redrock, v_team_id, v_c_redrock, 'MCA-2024-006',
     80000.00, 1.4800, 118400.00, 480.00, 'daily',
     'defaulted', NOW() - INTERVAL '20 months', (NOW() - INTERVAL '8 months')::date,
     56000.00, 62400.00, 6),

    -- Renewal chain: Bookshelf Cafe Deal 2 (active renewal)
    (v_d_bookshelf_2, v_team_id, v_c_bookshelf, 'MCA-2025-007',
     55000.00, 1.3600, 74800.00, 330.00, 'daily',
     'active', NOW() - INTERVAL '6 months', (NOW() + INTERVAL '3 months')::date,
     31900.00, 42900.00, 0),

    -- Renewal chain: Cardinal Electric Deal 2 (active, near payoff)
    (v_d_cardinal_2, v_team_id, v_c_cardinal, 'MCA-2025-008',
     85000.00, 1.3800, 117300.00, 500.00, 'daily',
     'active', NOW() - INTERVAL '10 months', (NOW() + INTERVAL '18 days')::date,
     8800.00, 108500.00, 0),

    -- Harbor Freight Logistics (active, healthy)
    (v_d_harbor, v_team_id, v_c_harbor, 'MCA-2025-009',
     90000.00, 1.3800, 124200.00, 570.00, 'daily',
     'active', NOW() - INTERVAL '3 months', (NOW() + INTERVAL '7 months')::date,
     87150.00, 37050.00, 0),

    -- BlueSky Dental Group (active, VIP)
    (v_d_bluesky, v_team_id, v_c_bluesky, 'MCA-2025-010',
     120000.00, 1.3200, 158400.00, 720.00, 'daily',
     'active', NOW() - INTERVAL '6 months', (NOW() + INTERVAL '4 months')::date,
     64800.00, 93600.00, 0),

    -- Peak Performance CrossFit (active, near payoff — only $280 left!)
    (v_d_crossfit, v_team_id, v_c_crossfit, 'MCA-2025-011',
     55000.00, 1.3600, 74800.00, 345.00, 'daily',
     'active', NOW() - INTERVAL '10 months', (NOW() + INTERVAL '1 day')::date,
     280.00, 74520.00, 0),

    -- Coastal Catering Co. (late, 2 NSFs)
    (v_d_catering, v_team_id, v_c_catering, 'MCA-2025-012',
     50000.00, 1.4100, 70500.00, 325.00, 'daily',
     'late', NOW() - INTERVAL '5 months', (NOW() + INTERVAL '4 months')::date,
     38000.00, 32500.00, 2),

    -- NightOwl Printing (late, 3 NSFs)
    (v_d_nightowl, v_team_id, v_c_nightowl, 'MCA-2025-013',
     45000.00, 1.4400, 64800.00, 310.00, 'daily',
     'late', NOW() - INTERVAL '5 months', (NOW() + INTERVAL '5 months')::date,
     40000.00, 24800.00, 3),

    -- Golden Gate Nail Studio (active, healthy)
    (v_d_nailstudio, v_team_id, v_c_nailstudio, 'MCA-2025-014',
     30000.00, 1.3900, 41700.00, 245.00, 'daily',
     'active', NOW() - INTERVAL '3 months', (NOW() + INTERVAL '4 months')::date,
     25775.00, 15925.00, 0),

    -- Renewal chain: Lucky Dragon Deal 2 (active renewal)
    (v_d_luckydragon_2, v_team_id, v_c_luckydragon, 'MCA-2026-003',
     100000.00, 1.3300, 133000.00, 610.00, 'daily',
     'active', NOW() - INTERVAL '3 months', (NOW() + INTERVAL '6 months')::date,
     96710.00, 36290.00, 0),

    -- Lakeside Urgent Care (active, new, largest deal in portfolio)
    (v_d_urgentcare, v_team_id, v_c_urgentcare, 'MCA-2026-004',
     150000.00, 1.3000, 195000.00, 870.00, 'daily',
     'active', NOW() - INTERVAL '21 days', (NOW() + INTERVAL '10 months')::date,
     181950.00, 13050.00, 0)
  ON CONFLICT (team_id, deal_code) DO NOTHING;

  -- ========================================================================
  -- 6. MCA PAYMENT INCOME TRANSACTIONS
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  )
  SELECT
    gen_random_uuid(),
    v_team_id,
    v_bank_op,
    d::date,
    mp.customer_name || ' - ACH Payment',
    'Daily MCA payment - ' || mp.customer_name,
    mp.daily_amount,
    'USD',
    'mca-payments',
    'posted',
    'ach',
    'demo_mca_' || mp.code || '_' || to_char(d::date, 'YYYYMMDD')
  FROM (
    VALUES
      ('Sunrise Diner',         485.00, (NOW() - INTERVAL '8 months')::date,  CURRENT_DATE,                          'sunrise'),
      ('Martinez Auto Repair',  320.00, (NOW() - INTERVAL '14 months')::date, (NOW() - INTERVAL '4 months')::date,   'martinez'),
      ('Bella Salon & Spa',     275.00, (NOW() - INTERVAL '5 months')::date,  CURRENT_DATE,                          'bella'),
      ('Tony''s Pizzeria',      380.00, (NOW() - INTERVAL '6 months')::date,  CURRENT_DATE,                          'tonys'),
      ('Quick Print Solutions',  425.00, (NOW() - INTERVAL '4 months')::date,  CURRENT_DATE,                          'quickprint'),
      ('Lucky Dragon Restaurant',450.00, (NOW() - INTERVAL '18 months')::date,(NOW() - INTERVAL '7 months')::date,   'luckydragon'),
      ('Smith Plumbing Services',350.00, (NOW() - INTERVAL '12 months')::date,(NOW() - INTERVAL '3 months')::date,   'smith'),
      ('Green Thumb Landscaping',295.00, (NOW() - INTERVAL '14 days')::date,  CURRENT_DATE,                          'greenthumb'),
      ('Fitness First Gym',     510.00, (NOW() - INTERVAL '7 days')::date,    CURRENT_DATE,                          'fitness'),
      -- New merchants (11-20)
      ('Harbor Freight Logistics',  570.00, (NOW() - INTERVAL '3 months')::date,   CURRENT_DATE,                          'harbor'),
      ('BlueSky Dental Group',      720.00, (NOW() - INTERVAL '6 months')::date,   CURRENT_DATE,                          'bluesky'),
      ('Peak Performance CrossFit', 345.00, (NOW() - INTERVAL '10 months')::date,  CURRENT_DATE,                          'crossfit'),
      ('Coastal Catering Co.',      325.00, (NOW() - INTERVAL '5 months')::date,   (NOW() - INTERVAL '14 days')::date,    'catering'),
      ('NightOwl Printing',         310.00, (NOW() - INTERVAL '5 months')::date,   (NOW() - INTERVAL '21 days')::date,    'nightowl'),
      ('Golden Gate Nail Studio',   245.00, (NOW() - INTERVAL '3 months')::date,   CURRENT_DATE,                          'nailstudio'),
      ('Redrock Excavation LLC',    480.00, (NOW() - INTERVAL '20 months')::date,  (NOW() - INTERVAL '8 months')::date,   'redrock'),
      ('Lakeside Urgent Care',      870.00, (NOW() - INTERVAL '21 days')::date,    CURRENT_DATE,                          'urgentcare'),
      -- Renewal chain: paid-off first deals
      ('The Bookshelf Cafe',        215.00, (NOW() - INTERVAL '24 months')::date,  (NOW() - INTERVAL '15 months')::date,  'bookshelf1'),
      ('Cardinal Electric Co.',     370.00, (NOW() - INTERVAL '22 months')::date,  (NOW() - INTERVAL '12 months')::date,  'cardinal1'),
      -- Renewal chain: active second deals
      ('The Bookshelf Cafe',        330.00, (NOW() - INTERVAL '6 months')::date,   CURRENT_DATE,                          'bookshelf2'),
      ('Cardinal Electric Co.',     500.00, (NOW() - INTERVAL '10 months')::date,  CURRENT_DATE,                          'cardinal2'),
      ('Lucky Dragon Restaurant',   610.00, (NOW() - INTERVAL '3 months')::date,   CURRENT_DATE,                          'luckydragon2')
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
    gen_random_uuid(),
    v_team_id,
    v_bank_op,
    d::date,
    'Westside Construction LLC - Weekly ACH',
    'Weekly MCA payment - Westside Construction LLC',
    1890.00,
    'USD',
    'mca-payments',
    'posted',
    'ach',
    'demo_mca_westside_' || to_char(d::date, 'YYYYMMDD')
  FROM generate_series(
    (NOW() - INTERVAL '7 months')::date,
    CURRENT_DATE,
    '7 days'::interval
  ) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
  ON CONFLICT (internal_id) DO NOTHING;

  -- ========================================================================
  -- 7. NSF RETURN TRANSACTIONS
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  ) VALUES
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '25 days')::date,
     'Tony''s Pizzeria - NSF Return', 'Returned ACH - insufficient funds',
     -380.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_tonys_1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '12 days')::date,
     'Tony''s Pizzeria - NSF Return', 'Returned ACH - insufficient funds',
     -380.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_tonys_2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '8 days')::date,
     'Quick Print Solutions - NSF Return', 'Returned ACH - insufficient funds',
     -425.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_quickprint_1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '40 days')::date,
     'Westside Construction - NSF Return', 'Returned ACH - insufficient funds',
     -1890.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_westside_1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '33 days')::date,
     'Westside Construction - NSF Return', 'Returned ACH - insufficient funds',
     -1890.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_westside_2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '19 days')::date,
     'Westside Construction - NSF Return', 'Returned ACH - insufficient funds',
     -1890.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_westside_3'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '5 days')::date,
     'Westside Construction - NSF Return', 'Returned ACH - insufficient funds',
     -1890.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_westside_4'),
    -- Coastal Catering (2 NSFs)
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '30 days')::date,
     'Coastal Catering Co. - NSF Return', 'Returned ACH - insufficient funds',
     -325.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_catering_1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '16 days')::date,
     'Coastal Catering Co. - NSF Return', 'Returned ACH - insufficient funds',
     -325.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_catering_2'),
    -- NightOwl Printing (3 NSFs)
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '50 days')::date,
     'NightOwl Printing - NSF Return', 'Returned ACH - insufficient funds',
     -310.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_nightowl_1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '35 days')::date,
     'NightOwl Printing - NSF Return', 'Returned ACH - insufficient funds',
     -310.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_nightowl_2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '23 days')::date,
     'NightOwl Printing - NSF Return', 'Returned ACH - insufficient funds',
     -310.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_nightowl_3'),
    -- Redrock Excavation (6 NSFs spread across months 2-8 before default)
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '18 months')::date,
     'Redrock Excavation LLC - NSF Return', 'Returned ACH - insufficient funds',
     -480.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_redrock_1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '17 months')::date,
     'Redrock Excavation LLC - NSF Return', 'Returned ACH - insufficient funds',
     -480.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_redrock_2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '16 months')::date,
     'Redrock Excavation LLC - NSF Return', 'Returned ACH - insufficient funds',
     -480.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_redrock_3'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '14 months')::date,
     'Redrock Excavation LLC - NSF Return', 'Returned ACH - insufficient funds',
     -480.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_redrock_4'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '12 months')::date,
     'Redrock Excavation LLC - NSF Return', 'Returned ACH - insufficient funds',
     -480.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_redrock_5'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '10 months')::date,
     'Redrock Excavation LLC - NSF Return', 'Returned ACH - insufficient funds',
     -480.00, 'USD', 'nsf-returns', 'posted', 'ach', 'demo_nsf_redrock_6')
  ON CONFLICT (internal_id) DO NOTHING;

  -- ========================================================================
  -- 8. FUNDING DISBURSEMENT TRANSACTIONS
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  ) VALUES
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '18 months')::date,
     'Funding - Lucky Dragon Restaurant', 'MCA funding disbursement MCA-2024-002',
     -75000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_luckydragon'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '14 months')::date,
     'Funding - Martinez Auto Repair', 'MCA funding disbursement MCA-2024-001',
     -50000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_martinez'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '12 months')::date,
     'Funding - Smith Plumbing Services', 'MCA funding disbursement MCA-2024-003',
     -50000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_smith'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '8 months')::date,
     'Funding - Sunrise Diner', 'MCA funding disbursement MCA-2025-001',
     -65000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_sunrise'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '7 months')::date,
     'Funding - Westside Construction', 'MCA funding disbursement MCA-2025-006',
     -75000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_westside'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '6 months')::date,
     'Funding - Tony''s Pizzeria', 'MCA funding disbursement MCA-2025-004',
     -60000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_tonys'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '5 months')::date,
     'Funding - Bella Salon & Spa', 'MCA funding disbursement MCA-2025-003',
     -45000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_bella'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '4 months')::date,
     'Funding - Quick Print Solutions', 'MCA funding disbursement MCA-2025-005',
     -70000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_quickprint'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '14 days')::date,
     'Funding - Green Thumb Landscaping', 'MCA funding disbursement MCA-2026-001',
     -40000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_greenthumb'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '7 days')::date,
     'Funding - Fitness First Gym', 'MCA funding disbursement MCA-2026-002',
     -80000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_fitness'),
    -- New merchants + renewal chain deals
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '24 months')::date,
     'Funding - The Bookshelf Cafe', 'MCA funding disbursement MCA-2024-004',
     -35000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_bookshelf1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '22 months')::date,
     'Funding - Cardinal Electric Co.', 'MCA funding disbursement MCA-2024-005',
     -60000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_cardinal1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '20 months')::date,
     'Funding - Redrock Excavation LLC', 'MCA funding disbursement MCA-2024-006',
     -80000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_redrock'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '10 months')::date,
     'Funding - Cardinal Electric Co.', 'MCA funding disbursement MCA-2025-008 (renewal)',
     -85000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_cardinal2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '10 months')::date,
     'Funding - Peak Performance CrossFit', 'MCA funding disbursement MCA-2025-011',
     -55000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_crossfit'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '6 months')::date,
     'Funding - BlueSky Dental Group', 'MCA funding disbursement MCA-2025-010',
     -120000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_bluesky'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '6 months')::date,
     'Funding - The Bookshelf Cafe', 'MCA funding disbursement MCA-2025-007 (renewal)',
     -55000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_bookshelf2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '5 months')::date,
     'Funding - Coastal Catering Co.', 'MCA funding disbursement MCA-2025-012',
     -50000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_catering'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '5 months')::date,
     'Funding - NightOwl Printing', 'MCA funding disbursement MCA-2025-013',
     -45000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_nightowl'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '3 months')::date,
     'Funding - Harbor Freight Logistics', 'MCA funding disbursement MCA-2025-009',
     -90000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_harbor'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '3 months')::date,
     'Funding - Golden Gate Nail Studio', 'MCA funding disbursement MCA-2025-014',
     -30000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_nailstudio'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '3 months')::date,
     'Funding - Lucky Dragon Restaurant', 'MCA funding disbursement MCA-2026-003 (renewal)',
     -100000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_luckydragon2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '21 days')::date,
     'Funding - Lakeside Urgent Care', 'MCA funding disbursement MCA-2026-004',
     -150000.00, 'USD', 'funding-disbursements', 'posted', 'wire', 'demo_fund_urgentcare')
  ON CONFLICT (internal_id) DO NOTHING;

  -- ========================================================================
  -- 9. ISO COMMISSION PAYMENTS
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  ) VALUES
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '18 months')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Lucky Dragon deal (10%)',
     -7500.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_luckydragon'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '14 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on Martinez Auto deal (11%)',
     -5500.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_martinez'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '12 months')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on Smith Plumbing deal (11%)',
     -5500.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_smith'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '8 months')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Sunrise Diner deal (10%)',
     -6500.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_sunrise'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '7 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on Westside Construction deal (11%)',
     -8250.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_westside'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '6 months')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on Tony''s Pizzeria deal (11%)',
     -6600.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_tonys'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '5 months')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Bella Salon deal (10%)',
     -4500.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_bella'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '4 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on Quick Print deal (11%)',
     -7700.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_quickprint'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '14 days')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on Green Thumb deal (11%)',
     -4400.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_greenthumb'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '7 days')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Fitness First deal (10%)',
     -8000.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_fitness'),
    -- New deals commissions (Redrock has no broker — direct deal)
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '24 months')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on Bookshelf Cafe deal (11%)',
     -3850.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_bookshelf1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '22 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on Cardinal Electric deal (11%)',
     -6600.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_cardinal1'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '10 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on Cardinal Electric renewal (11%)',
     -9350.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_cardinal2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '10 months')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on CrossFit deal (11%)',
     -6050.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_crossfit'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '6 months')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on BlueSky Dental deal (10%)',
     -12000.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_bluesky'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '6 months')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on Bookshelf Cafe renewal (11%)',
     -6050.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_bookshelf2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '5 months')::date,
     'ISO Commission - Southwest Funding Partners', 'Commission on Coastal Catering deal (11%)',
     -5500.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_catering'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '5 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on NightOwl Printing deal (11%)',
     -4950.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_nightowl'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '3 months')::date,
     'ISO Commission - Capital Brokers LLC', 'Commission on Harbor Freight deal (11%)',
     -9900.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_harbor'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '3 months')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Golden Gate Nail deal (10%)',
     -3000.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_nailstudio'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '3 months')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Lucky Dragon renewal (10%)',
     -10000.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_luckydragon2'),
    (gen_random_uuid(), v_team_id, v_bank_op,
     (NOW() - INTERVAL '21 days')::date,
     'ISO Commission - Pinnacle Funding Group', 'Commission on Lakeside Urgent Care deal (10%)',
     -15000.00, 'USD', 'iso-commissions', 'posted', 'ach', 'demo_iso_urgentcare')
  ON CONFLICT (internal_id) DO NOTHING;

  -- ========================================================================
  -- 10. MONTHLY OPERATING EXPENSES
  -- ========================================================================

  INSERT INTO public.transactions (
    id, team_id, bank_account_id, date, name, description,
    amount, currency, category_slug, status, method, internal_id
  )
  SELECT
    gen_random_uuid(),
    v_team_id,
    v_bank_op,
    LEAST(
      (date_trunc('month', d) + (exp.day_offset || ' days')::interval)::date,
      CURRENT_DATE
    ),
    exp.txn_name,
    exp.description,
    exp.amount,
    'USD',
    'operating-expenses',
    'posted',
    exp.method::"transactionMethods",
    'demo_opex_' || exp.code || '_' || to_char(d::date, 'YYYYMM')
  FROM generate_series(
    (NOW() - INTERVAL '12 months')::date,
    CURRENT_DATE,
    '1 month'::interval
  ) d
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

  -- ========================================================================
  -- 11. MCA PAYMENT RECORDS
  -- ========================================================================

  INSERT INTO public.mca_payments (
    id, deal_id, team_id, amount, payment_date, payment_type, status, description
  )
  SELECT
    gen_random_uuid(),
    mp.deal_id,
    v_team_id,
    mp.daily_amount,
    d::date,
    'ach',
    'completed',
    'Daily ACH payment'
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
      (v_d_fitness,     510.00, (NOW() - INTERVAL '7 days')::date,    CURRENT_DATE),
      -- New deals
      (v_d_harbor,       570.00, (NOW() - INTERVAL '3 months')::date,   CURRENT_DATE),
      (v_d_bluesky,      720.00, (NOW() - INTERVAL '6 months')::date,   CURRENT_DATE),
      (v_d_crossfit,     345.00, (NOW() - INTERVAL '10 months')::date,  CURRENT_DATE),
      (v_d_catering,     325.00, (NOW() - INTERVAL '5 months')::date,   (NOW() - INTERVAL '14 days')::date),
      (v_d_nightowl,     310.00, (NOW() - INTERVAL '5 months')::date,   (NOW() - INTERVAL '21 days')::date),
      (v_d_nailstudio,   245.00, (NOW() - INTERVAL '3 months')::date,   CURRENT_DATE),
      (v_d_redrock,      480.00, (NOW() - INTERVAL '20 months')::date,  (NOW() - INTERVAL '8 months')::date),
      (v_d_urgentcare,   870.00, (NOW() - INTERVAL '21 days')::date,    CURRENT_DATE),
      -- Renewal chain deals
      (v_d_bookshelf_1,  215.00, (NOW() - INTERVAL '24 months')::date,  (NOW() - INTERVAL '15 months')::date),
      (v_d_cardinal_1,   370.00, (NOW() - INTERVAL '22 months')::date,  (NOW() - INTERVAL '12 months')::date),
      (v_d_bookshelf_2,  330.00, (NOW() - INTERVAL '6 months')::date,   CURRENT_DATE),
      (v_d_cardinal_2,   500.00, (NOW() - INTERVAL '10 months')::date,  CURRENT_DATE),
      (v_d_luckydragon_2, 610.00, (NOW() - INTERVAL '3 months')::date,  CURRENT_DATE)
  ) AS mp(deal_id, daily_amount, start_date, end_date)
  CROSS JOIN LATERAL generate_series(mp.start_date, mp.end_date, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);

  -- Weekly Westside payments
  INSERT INTO public.mca_payments (
    id, deal_id, team_id, amount, payment_date, payment_type, status, description
  )
  SELECT
    gen_random_uuid(),
    v_d_westside,
    v_team_id,
    1890.00,
    d::date,
    'ach',
    'completed',
    'Weekly ACH payment'
  FROM generate_series(
    (NOW() - INTERVAL '7 months')::date,
    CURRENT_DATE,
    '7 days'::interval
  ) d
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
    (gen_random_uuid(), v_d_westside,  v_team_id, 1890.00, (NOW() - INTERVAL '5 days')::date,  'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '5 days',  35.00),
    -- Coastal Catering NSFs
    (gen_random_uuid(), v_d_catering,  v_team_id, 325.00,  (NOW() - INTERVAL '30 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '30 days', 35.00),
    (gen_random_uuid(), v_d_catering,  v_team_id, 325.00,  (NOW() - INTERVAL '16 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '16 days', 35.00),
    -- NightOwl Printing NSFs
    (gen_random_uuid(), v_d_nightowl,  v_team_id, 310.00,  (NOW() - INTERVAL '50 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '50 days', 35.00),
    (gen_random_uuid(), v_d_nightowl,  v_team_id, 310.00,  (NOW() - INTERVAL '35 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '35 days', 35.00),
    (gen_random_uuid(), v_d_nightowl,  v_team_id, 310.00,  (NOW() - INTERVAL '23 days')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '23 days', 35.00),
    -- Redrock Excavation NSFs (spread across months before default)
    (gen_random_uuid(), v_d_redrock,   v_team_id, 480.00,  (NOW() - INTERVAL '18 months')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '18 months', 35.00),
    (gen_random_uuid(), v_d_redrock,   v_team_id, 480.00,  (NOW() - INTERVAL '17 months')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '17 months', 35.00),
    (gen_random_uuid(), v_d_redrock,   v_team_id, 480.00,  (NOW() - INTERVAL '16 months')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '16 months', 35.00),
    (gen_random_uuid(), v_d_redrock,   v_team_id, 480.00,  (NOW() - INTERVAL '14 months')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '14 months', 35.00),
    (gen_random_uuid(), v_d_redrock,   v_team_id, 480.00,  (NOW() - INTERVAL '12 months')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '12 months', 35.00),
    (gen_random_uuid(), v_d_redrock,   v_team_id, 480.00,  (NOW() - INTERVAL '10 months')::date, 'ach', 'returned', 'NSF - Insufficient funds', NOW() - INTERVAL '10 months', 35.00);

  -- ========================================================================
  -- 11b. DYNAMIC BALANCE CALCULATION
  --      Compute total_paid / current_balance from actual payment records
  --      so balances never drift regardless of when the seed runs.
  -- ========================================================================

  UPDATE mca_deals d
  SET total_paid = LEAST(sub.paid, d.payback_amount),
      current_balance = GREATEST(d.payback_amount - sub.paid, 0)
  FROM (
    SELECT deal_id, SUM(amount) as paid
    FROM mca_payments
    WHERE status = 'completed' AND team_id = v_team_id
    GROUP BY deal_id
  ) sub
  WHERE d.id = sub.deal_id AND d.team_id = v_team_id;

  -- ========================================================================
  -- 11c. BACKFILL balance_before / balance_after ON mca_payments
  --      Uses a window function over payment order to compute running balances.
  -- ========================================================================

  WITH ordered_payments AS (
    SELECT id, deal_id, amount,
      ROW_NUMBER() OVER (PARTITION BY deal_id ORDER BY payment_date, id) as rn
    FROM mca_payments WHERE team_id = v_team_id AND status = 'completed'
  ),
  running AS (
    SELECT op.id,
      d.payback_amount - COALESCE(SUM(op.amount) OVER (
        PARTITION BY op.deal_id ORDER BY op.rn
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ), 0) as balance_before,
      d.payback_amount - SUM(op.amount) OVER (
        PARTITION BY op.deal_id ORDER BY op.rn
      ) as balance_after
    FROM ordered_payments op JOIN mca_deals d ON d.id = op.deal_id
  )
  UPDATE mca_payments p
  SET balance_before = r.balance_before, balance_after = r.balance_after
  FROM running r WHERE p.id = r.id;

  -- ========================================================================
  -- 11d. FIX NSF COUNTS FROM ACTUAL DATA
  --      Derive nsf_count from returned payment records.
  -- ========================================================================

  UPDATE mca_deals d
  SET nsf_count = COALESCE(sub.cnt, 0)
  FROM (
    SELECT deal_id, COUNT(*) as cnt
    FROM mca_payments
    WHERE status = 'returned' AND team_id = v_team_id
    GROUP BY deal_id
  ) sub
  WHERE d.id = sub.deal_id AND d.team_id = v_team_id;

  -- ========================================================================
  -- 12. DEAL TEMPLATE (formerly invoice_templates)
  -- ========================================================================

  INSERT INTO public.deal_templates (id, team_id, name, is_default, currency, size)
  VALUES (v_template_id, v_team_id, 'Default', true, 'USD', 'letter')
  ON CONFLICT DO NOTHING;

  -- ========================================================================
  -- 13. DEALS (formerly invoices)
  -- ========================================================================

  INSERT INTO public.deals (
    id, team_id, merchant_id, user_id, template_id,
    deal_number, status, issue_date, due_date,
    amount, subtotal, currency, merchant_name, line_items, token
  ) VALUES
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

    (gen_random_uuid(), v_team_id, v_c_greenthumb, v_user_id, v_template_id,
     'INV-2026-001', 'unpaid', NOW() - INTERVAL '14 days', NOW() + INTERVAL '16 days',
     40000.00, 40000.00, 'USD', 'Green Thumb Landscaping',
     '[{"name": "MCA Funding - MCA-2026-001", "quantity": 1, "price": 40000}]'::jsonb, 'tok_inv_009'),

    (gen_random_uuid(), v_team_id, v_c_fitness, v_user_id, v_template_id,
     'INV-2026-002', 'unpaid', NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days',
     80000.00, 80000.00, 'USD', 'Fitness First Gym',
     '[{"name": "MCA Funding - MCA-2026-002", "quantity": 1, "price": 80000}]'::jsonb, 'tok_inv_010'),

    (gen_random_uuid(), v_team_id, v_c_westside, v_user_id, v_template_id,
     'INV-2025-006', 'overdue', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month',
     2500.00, 2500.00, 'USD', 'Westside Construction LLC',
     '[{"name": "Legal fees - Collections review", "quantity": 1, "price": 2500}]'::jsonb, 'tok_inv_011'),

    (gen_random_uuid(), v_team_id, v_c_luckydragon, v_user_id, v_template_id,
     'INV-2026-003', 'paid', NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 months',
     100000.00, 100000.00, 'USD', 'Lucky Dragon Restaurant',
     '[{"name": "MCA Renewal Funding - MCA-2026-003", "quantity": 1, "price": 100000}]'::jsonb, 'tok_inv_012'),

    (gen_random_uuid(), v_team_id, v_c_smith, v_user_id, v_template_id,
     'INV-2026-004', 'draft', NOW(), NOW() + INTERVAL '30 days',
     75000.00, 75000.00, 'USD', 'Smith Plumbing Services',
     '[{"name": "MCA Renewal Offer - Up to $75,000", "quantity": 1, "price": 75000}]'::jsonb, 'tok_inv_013');

  -- ========================================================================
  -- 14. BACKFILL transaction_type, payment_status, deal_code
  --     (Migrations run BEFORE seed.sql, so we must set these here.)
  -- ========================================================================

  -- MCA daily/weekly ACH payments (income) → credit, completed
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
        -- New deals
        WHEN internal_id LIKE 'demo_mca_harbor_%'      THEN 'MCA-2025-009'
        WHEN internal_id LIKE 'demo_mca_bluesky_%'     THEN 'MCA-2025-010'
        WHEN internal_id LIKE 'demo_mca_crossfit_%'    THEN 'MCA-2025-011'
        WHEN internal_id LIKE 'demo_mca_catering_%'    THEN 'MCA-2025-012'
        WHEN internal_id LIKE 'demo_mca_nightowl_%'    THEN 'MCA-2025-013'
        WHEN internal_id LIKE 'demo_mca_nailstudio_%'  THEN 'MCA-2025-014'
        WHEN internal_id LIKE 'demo_mca_redrock_%'     THEN 'MCA-2024-006'
        WHEN internal_id LIKE 'demo_mca_urgentcare_%'  THEN 'MCA-2026-004'
        -- Renewal chain deals
        WHEN internal_id LIKE 'demo_mca_bookshelf1_%'  THEN 'MCA-2024-004'
        WHEN internal_id LIKE 'demo_mca_bookshelf2_%'  THEN 'MCA-2025-007'
        WHEN internal_id LIKE 'demo_mca_cardinal1_%'   THEN 'MCA-2024-005'
        WHEN internal_id LIKE 'demo_mca_cardinal2_%'   THEN 'MCA-2025-008'
        WHEN internal_id LIKE 'demo_mca_luckydragon2_%' THEN 'MCA-2026-003'
      END
  WHERE category_slug = 'mca-payments'
    AND team_id = v_team_id;

  -- NSF returns (bounced payments) → debit, failed
  UPDATE public.transactions
  SET transaction_type = 'debit',
      payment_status   = 'failed',
      deal_code = CASE
        WHEN internal_id LIKE 'demo_nsf_tonys_%'      THEN 'MCA-2025-004'
        WHEN internal_id LIKE 'demo_nsf_quickprint_%'  THEN 'MCA-2025-005'
        WHEN internal_id LIKE 'demo_nsf_westside_%'    THEN 'MCA-2025-006'
        WHEN internal_id LIKE 'demo_nsf_catering_%'    THEN 'MCA-2025-012'
        WHEN internal_id LIKE 'demo_nsf_nightowl_%'    THEN 'MCA-2025-013'
        WHEN internal_id LIKE 'demo_nsf_redrock_%'     THEN 'MCA-2024-006'
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
        WHEN internal_id = 'demo_fund_bookshelf1'   THEN 'MCA-2024-004'
        WHEN internal_id = 'demo_fund_cardinal1'    THEN 'MCA-2024-005'
        WHEN internal_id = 'demo_fund_redrock'      THEN 'MCA-2024-006'
        WHEN internal_id = 'demo_fund_bookshelf2'   THEN 'MCA-2025-007'
        WHEN internal_id = 'demo_fund_cardinal2'    THEN 'MCA-2025-008'
        WHEN internal_id = 'demo_fund_harbor'       THEN 'MCA-2025-009'
        WHEN internal_id = 'demo_fund_bluesky'      THEN 'MCA-2025-010'
        WHEN internal_id = 'demo_fund_crossfit'     THEN 'MCA-2025-011'
        WHEN internal_id = 'demo_fund_catering'     THEN 'MCA-2025-012'
        WHEN internal_id = 'demo_fund_nightowl'     THEN 'MCA-2025-013'
        WHEN internal_id = 'demo_fund_nailstudio'   THEN 'MCA-2025-014'
        WHEN internal_id = 'demo_fund_luckydragon2' THEN 'MCA-2026-003'
        WHEN internal_id = 'demo_fund_urgentcare'   THEN 'MCA-2026-004'
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
        WHEN internal_id = 'demo_iso_bookshelf1'   THEN 'MCA-2024-004'
        WHEN internal_id = 'demo_iso_cardinal1'    THEN 'MCA-2024-005'
        WHEN internal_id = 'demo_iso_bookshelf2'   THEN 'MCA-2025-007'
        WHEN internal_id = 'demo_iso_cardinal2'    THEN 'MCA-2025-008'
        WHEN internal_id = 'demo_iso_harbor'       THEN 'MCA-2025-009'
        WHEN internal_id = 'demo_iso_bluesky'      THEN 'MCA-2025-010'
        WHEN internal_id = 'demo_iso_crossfit'     THEN 'MCA-2025-011'
        WHEN internal_id = 'demo_iso_catering'     THEN 'MCA-2025-012'
        WHEN internal_id = 'demo_iso_nightowl'     THEN 'MCA-2025-013'
        WHEN internal_id = 'demo_iso_nailstudio'   THEN 'MCA-2025-014'
        WHEN internal_id = 'demo_iso_luckydragon2' THEN 'MCA-2026-003'
        WHEN internal_id = 'demo_iso_urgentcare'   THEN 'MCA-2026-004'
      END
  WHERE category_slug = 'iso-commissions'
    AND team_id = v_team_id;

  -- Operating expenses → debit, completed
  UPDATE public.transactions
  SET transaction_type = 'debit',
      payment_status   = 'completed'
  WHERE category_slug = 'operating-expenses'
    AND team_id = v_team_id;

  -- ========================================================================
  -- 15. BROKERS (ISOs)
  -- ========================================================================

  INSERT INTO public.brokers (
    id, team_id, name, email, phone, company_name, commission_percentage,
    status, portal_enabled, portal_id, note
  ) VALUES
    (v_broker_pinnacle, v_team_id,
     'Mike Chen', 'mike@pinnaclefunding.com', '(212) 555-0101',
     'Pinnacle Funding Group', 10.00,
     'active', true, 'brk_pncl',
     'Top ISO partner. Consistent deal flow since 2023.'),

    (v_broker_capital, v_team_id,
     'Sarah Johnson', 'sarah@capitalbrokers.com', '(305) 555-0202',
     'Capital Brokers LLC', 11.00,
     'active', true, 'brk_cptl',
     'Strong in construction & trades verticals.'),

    (v_broker_southwest, v_team_id,
     'David Martinez', 'david@southwestfp.com', '(602) 555-0303',
     'Southwest Funding Partners', 11.00,
     'active', false, NULL,
     'Regional ISO covering AZ, NM, TX.')
  ON CONFLICT (id) DO NOTHING;

  -- ========================================================================
  -- 16. BROKER COMMISSIONS & DEAL ASSIGNMENTS
  -- ========================================================================

  -- Assign brokers to deals
  UPDATE public.mca_deals SET broker_id = v_broker_pinnacle
  WHERE id IN (v_d_luckydragon, v_d_sunrise, v_d_bella, v_d_fitness,
               v_d_luckydragon_2, v_d_bluesky, v_d_nailstudio, v_d_urgentcare)
    AND team_id = v_team_id;

  UPDATE public.mca_deals SET broker_id = v_broker_capital
  WHERE id IN (v_d_martinez, v_d_westside, v_d_quickprint,
               v_d_harbor, v_d_nightowl, v_d_cardinal_1, v_d_cardinal_2)
    AND team_id = v_team_id;

  UPDATE public.mca_deals SET broker_id = v_broker_southwest
  WHERE id IN (v_d_smith, v_d_tonys, v_d_greenthumb,
               v_d_bookshelf_1, v_d_bookshelf_2, v_d_crossfit, v_d_catering)
    AND team_id = v_team_id;
  -- Note: v_d_redrock has no broker (direct deal)

  -- Commission records
  INSERT INTO public.broker_commissions (
    id, deal_id, broker_id, team_id,
    commission_percentage, commission_amount, status, paid_at
  ) VALUES
    -- Pinnacle deals
    (gen_random_uuid(), v_d_luckydragon, v_broker_pinnacle, v_team_id,
     10.00, 7500.00, 'paid', NOW() - INTERVAL '18 months'),
    (gen_random_uuid(), v_d_sunrise, v_broker_pinnacle, v_team_id,
     10.00, 6500.00, 'paid', NOW() - INTERVAL '8 months'),
    (gen_random_uuid(), v_d_bella, v_broker_pinnacle, v_team_id,
     10.00, 4500.00, 'paid', NOW() - INTERVAL '5 months'),
    (gen_random_uuid(), v_d_fitness, v_broker_pinnacle, v_team_id,
     10.00, 8000.00, 'paid', NOW() - INTERVAL '7 days'),

    -- Capital deals
    (gen_random_uuid(), v_d_martinez, v_broker_capital, v_team_id,
     11.00, 5500.00, 'paid', NOW() - INTERVAL '14 months'),
    (gen_random_uuid(), v_d_westside, v_broker_capital, v_team_id,
     11.00, 8250.00, 'paid', NOW() - INTERVAL '7 months'),
    (gen_random_uuid(), v_d_quickprint, v_broker_capital, v_team_id,
     11.00, 7700.00, 'paid', NOW() - INTERVAL '4 months'),

    -- Southwest deals
    (gen_random_uuid(), v_d_smith, v_broker_southwest, v_team_id,
     11.00, 5500.00, 'paid', NOW() - INTERVAL '12 months'),
    (gen_random_uuid(), v_d_tonys, v_broker_southwest, v_team_id,
     11.00, 6600.00, 'paid', NOW() - INTERVAL '6 months'),
    (gen_random_uuid(), v_d_greenthumb, v_broker_southwest, v_team_id,
     11.00, 4400.00, 'pending', NULL),

    -- New deal commissions
    -- Pinnacle deals
    (gen_random_uuid(), v_d_luckydragon_2, v_broker_pinnacle, v_team_id,
     10.00, 10000.00, 'paid', NOW() - INTERVAL '3 months'),
    (gen_random_uuid(), v_d_bluesky, v_broker_pinnacle, v_team_id,
     10.00, 12000.00, 'paid', NOW() - INTERVAL '6 months'),
    (gen_random_uuid(), v_d_nailstudio, v_broker_pinnacle, v_team_id,
     10.00, 3000.00, 'paid', NOW() - INTERVAL '3 months'),
    (gen_random_uuid(), v_d_urgentcare, v_broker_pinnacle, v_team_id,
     10.00, 15000.00, 'pending', NULL),

    -- Capital deals
    (gen_random_uuid(), v_d_harbor, v_broker_capital, v_team_id,
     11.00, 9900.00, 'paid', NOW() - INTERVAL '3 months'),
    (gen_random_uuid(), v_d_nightowl, v_broker_capital, v_team_id,
     11.00, 4950.00, 'paid', NOW() - INTERVAL '5 months'),
    (gen_random_uuid(), v_d_cardinal_1, v_broker_capital, v_team_id,
     11.00, 6600.00, 'paid', NOW() - INTERVAL '22 months'),
    (gen_random_uuid(), v_d_cardinal_2, v_broker_capital, v_team_id,
     11.00, 9350.00, 'paid', NOW() - INTERVAL '10 months'),

    -- Southwest deals
    (gen_random_uuid(), v_d_bookshelf_1, v_broker_southwest, v_team_id,
     11.00, 3850.00, 'paid', NOW() - INTERVAL '24 months'),
    (gen_random_uuid(), v_d_bookshelf_2, v_broker_southwest, v_team_id,
     11.00, 6050.00, 'paid', NOW() - INTERVAL '6 months'),
    (gen_random_uuid(), v_d_crossfit, v_broker_southwest, v_team_id,
     11.00, 6050.00, 'paid', NOW() - INTERVAL '10 months'),
    (gen_random_uuid(), v_d_catering, v_broker_southwest, v_team_id,
     11.00, 5500.00, 'paid', NOW() - INTERVAL '5 months')
  ON CONFLICT ON CONSTRAINT broker_commissions_deal_broker_unique DO NOTHING;

  -- ========================================================================
  -- 17. SYNDICATORS (Co-Funding Partners)
  -- ========================================================================

  INSERT INTO public.syndicators (
    id, team_id, name, email, phone, company_name, website,
    city, state, status, portal_enabled, portal_id, note
  ) VALUES
    (v_syndicator_atlas, v_team_id,
     'Robert Chang', 'robert@atlascapital.com', '(646) 555-0401',
     'Atlas Capital Partners', 'https://atlascapital.com',
     'New York', 'NY',
     'active', true, 'syn_atls',
     'Primary syndication partner. Prefers deals $50K+ with factor rates under 1.40.'),

    (v_syndicator_meridian, v_team_id,
     'Lisa Park', 'lisa@meridianfunding.com', '(415) 555-0502',
     'Meridian Funding Group', 'https://meridianfunding.com',
     'San Francisco', 'CA',
     'active', true, 'syn_merd',
     'West coast partner. Interested in retail and service verticals.'),

    (v_syndicator_coastal, v_team_id,
     'James Wilson', 'james@coastalinvest.com', '(954) 555-0603',
     'Coastal Investment Fund', NULL,
     'Fort Lauderdale', 'FL',
     'active', false, NULL,
     'New partner, started Q1 2025. Conservative appetite, 20-30% positions only.')
  ON CONFLICT (id) DO NOTHING;

  -- ========================================================================
  -- 18. SYNDICATION PARTICIPANTS (Deal Co-Funding Splits)
  -- ========================================================================
  -- Ownership percentages represent the syndicator's share of the deal.
  -- funding_share = funding_amount * ownership_percentage
  -- Total syndicated % per deal must be <= 100%.

  INSERT INTO public.syndication_participants (
    id, deal_id, syndicator_id, team_id,
    funding_share, ownership_percentage, status, note
  ) VALUES
    -- Sunrise Diner ($65K): Atlas 40% + Coastal 20% = 60% syndicated
    (gen_random_uuid(), v_d_sunrise, v_syndicator_atlas, v_team_id,
     26000.00, 0.4000, 'active', 'Took 40% at funding'),
    (gen_random_uuid(), v_d_sunrise, v_syndicator_coastal, v_team_id,
     13000.00, 0.2000, 'active', 'Took 20% at funding'),

    -- Quick Print ($70K): Atlas 30% = 30% syndicated
    (gen_random_uuid(), v_d_quickprint, v_syndicator_atlas, v_team_id,
     21000.00, 0.3000, 'active', NULL),

    -- Bella Salon ($45K): Meridian 25% = 25% syndicated
    (gen_random_uuid(), v_d_bella, v_syndicator_meridian, v_team_id,
     11250.00, 0.2500, 'active', 'Retail vertical fit'),

    -- Fitness First ($80K): Meridian 35% = 35% syndicated
    (gen_random_uuid(), v_d_fitness, v_syndicator_meridian, v_team_id,
     28000.00, 0.3500, 'active', NULL),

    -- Westside Construction ($75K): Coastal 30% = 30% syndicated
    (gen_random_uuid(), v_d_westside, v_syndicator_coastal, v_team_id,
     22500.00, 0.3000, 'active', 'Higher risk, smaller position'),

    -- Martinez Auto (paid off, $50K): Atlas had 50% = 50% syndicated
    (gen_random_uuid(), v_d_martinez, v_syndicator_atlas, v_team_id,
     25000.00, 0.5000, 'active', 'Paid off successfully'),

    -- Lucky Dragon (paid off, $75K): Meridian 40% + Coastal 20% = 60% syndicated
    (gen_random_uuid(), v_d_luckydragon, v_syndicator_meridian, v_team_id,
     30000.00, 0.4000, 'active', NULL),
    (gen_random_uuid(), v_d_luckydragon, v_syndicator_coastal, v_team_id,
     15000.00, 0.2000, 'active', NULL),

    -- New deal syndications
    -- Lakeside Urgent Care ($150K): Atlas 40% + Meridian 20% = 60% syndicated (largest deal)
    (gen_random_uuid(), v_d_urgentcare, v_syndicator_atlas, v_team_id,
     60000.00, 0.4000, 'active', 'Largest deal in portfolio'),
    (gen_random_uuid(), v_d_urgentcare, v_syndicator_meridian, v_team_id,
     30000.00, 0.2000, 'active', NULL),

    -- Cardinal Electric D2 ($85K): Atlas 35% = 35% syndicated (near payoff)
    (gen_random_uuid(), v_d_cardinal_2, v_syndicator_atlas, v_team_id,
     29750.00, 0.3500, 'active', 'Near payoff — strong return'),

    -- BlueSky Dental ($120K): Meridian 30% = 30% syndicated
    (gen_random_uuid(), v_d_bluesky, v_syndicator_meridian, v_team_id,
     36000.00, 0.3000, 'active', 'Healthcare vertical'),

    -- Lucky Dragon D2 ($100K): Meridian 35% = 35% syndicated (renewal)
    (gen_random_uuid(), v_d_luckydragon_2, v_syndicator_meridian, v_team_id,
     35000.00, 0.3500, 'active', 'Renewal deal — returning client')
  ON CONFLICT ON CONSTRAINT syndication_participants_deal_syndicator_unique DO NOTHING;

  -- ========================================================================
  -- COLLECTIONS MODULE: Stages, Agencies, Cases, Notes, SLA, Escalation
  -- ========================================================================

  -- Collection Stages (configurable workflow)
  INSERT INTO collection_stages (id, team_id, name, slug, position, color, is_default, is_terminal) VALUES
    (v_cs_early,     v_team_id, 'Early Contact',   'early-contact',   1, '#3B82F6', true,  false),
    (v_cs_promise,   v_team_id, 'Promise to Pay',  'promise-to-pay',  2, '#8B5CF6', false, false),
    (v_cs_plan,      v_team_id, 'Payment Plan',    'payment-plan',    3, '#6366F1', false, false),
    (v_cs_escalated, v_team_id, 'Escalated',       'escalated',       4, '#F59E0B', false, false),
    (v_cs_legal,     v_team_id, 'Legal Review',    'legal-review',    5, '#EF4444', false, false),
    (v_cs_agency,    v_team_id, 'Agency Referral', 'agency-referral', 6, '#DC2626', false, false),
    (v_cs_resolved,  v_team_id, 'Resolved',        'resolved',        7, '#16A34A', false, true)
  ON CONFLICT DO NOTHING;

  -- Collection Agencies
  INSERT INTO collection_agencies (id, team_id, name, contact_name, contact_email, contact_phone, notes, is_active) VALUES
    (v_agency_premier, v_team_id, 'Premier Recovery Solutions', 'James Morrison', 'jmorrison@premierrecovery.com', '(555) 901-2345', 'Tier-1 agency. 30% contingency fee. Specializes in MCA collections. Avg 42-day resolution.', true),
    (v_agency_rapid,   v_team_id, 'Rapid Collections Group',   'Diana Chen',     'dchen@rapidcollections.com',    '(555) 678-9012', 'Budget option. 22% contingency. Good for smaller balances under $40K.', true)
  ON CONFLICT DO NOTHING;

  -- Collection Cases
  -- Tony's Pizzeria: late, 2 NSFs, in "Promise to Pay" stage, high priority
  INSERT INTO collection_cases (id, team_id, deal_id, stage_id, assigned_to, priority, next_follow_up, stage_entered_at, entered_collections_at) VALUES
    (v_cc_tonys, v_team_id, v_d_tonys, v_cs_promise, v_user_id, 'high',
     NOW() + INTERVAL '2 days',
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '18 days')
  ON CONFLICT (deal_id) DO NOTHING;

  -- Westside Construction LLC: late, 4 NSFs, in "Escalated" stage, critical priority
  INSERT INTO collection_cases (id, team_id, deal_id, stage_id, assigned_to, priority, next_follow_up, stage_entered_at, entered_collections_at) VALUES
    (v_cc_westside, v_team_id, v_d_westside, v_cs_escalated, v_user_id, 'critical',
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '3 days',
     NOW() - INTERVAL '35 days')
  ON CONFLICT (deal_id) DO NOTHING;

  -- Redrock Excavation: defaulted, 6 NSFs, in "Agency Referral" stage, sent to agency
  INSERT INTO collection_cases (id, team_id, deal_id, stage_id, priority, outcome, agency_id, stage_entered_at, entered_collections_at, resolved_at) VALUES
    (v_cc_redrock, v_team_id, v_d_redrock, v_cs_agency, 'critical', 'sent_to_agency', v_agency_premier,
     NOW() - INTERVAL '14 days',
     NOW() - INTERVAL '90 days',
     NOW() - INTERVAL '14 days')
  ON CONFLICT (deal_id) DO NOTHING;

  -- Coastal Catering: late, 2 NSFs, in "Early Contact" stage, medium priority
  INSERT INTO collection_cases (id, team_id, deal_id, stage_id, assigned_to, priority, next_follow_up, stage_entered_at, entered_collections_at) VALUES
    (v_cc_catering, v_team_id, v_d_catering, v_cs_early, v_user_id, 'medium',
     NOW() + INTERVAL '1 day',
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '2 days')
  ON CONFLICT (deal_id) DO NOTHING;

  -- NightOwl Printing: late, 3 NSFs, in "Payment Plan" stage, high priority
  INSERT INTO collection_cases (id, team_id, deal_id, stage_id, assigned_to, priority, next_follow_up, stage_entered_at, entered_collections_at) VALUES
    (v_cc_nightowl, v_team_id, v_d_nightowl, v_cs_plan, v_user_id, 'high',
     NOW() + INTERVAL '5 days',
     NOW() - INTERVAL '8 days',
     NOW() - INTERVAL '25 days')
  ON CONFLICT (deal_id) DO NOTHING;

  -- Collection Notes (activity log for each case)
  INSERT INTO collection_notes (case_id, author_id, contact_name, contact_method, follow_up_date, summary, created_at) VALUES
    -- Tony's notes
    (v_cc_tonys, v_user_id, 'Tony Rossi', 'phone', NOW() + INTERVAL '2 days',
     'Spoke with Tony directly. He acknowledged the missed payments and says cash flow has been tight due to a kitchen renovation. Promised to resume daily payments by end of week. Will follow up in 2 days to confirm first payment hits.',
     NOW() - INTERVAL '5 days'),
    (v_cc_tonys, v_user_id, 'Tony Rossi', 'email', NULL,
     'Sent formal collections notice via email with payment schedule and consequences of continued non-payment. Attached copy of signed MCA agreement.',
     NOW() - INTERVAL '12 days'),
    (v_cc_tonys, v_user_id, NULL, 'phone', NOW() - INTERVAL '5 days',
     'Initial outreach call. Left voicemail requesting callback regarding account status. No answer on business or mobile number.',
     NOW() - INTERVAL '18 days'),

    -- Westside notes
    (v_cc_westside, v_user_id, 'Marco Gutierrez', 'phone', NOW() - INTERVAL '1 day',
     'Called Marco — very confrontational. Claims he never agreed to daily debits and is threatening to close his bank account. Explained the RTR agreement terms. He calmed down slightly and said he''d "think about it." Escalating to management review.',
     NOW() - INTERVAL '3 days'),
    (v_cc_westside, v_user_id, 'Receptionist', 'phone', NULL,
     'Called shop, spoke with receptionist. Marco is "not available." Receptionist says they''ve been having financial difficulties. Left urgent message.',
     NOW() - INTERVAL '10 days'),
    (v_cc_westside, v_user_id, 'Marco Gutierrez', 'email', NULL,
     'Sent 3rd formal notice. Mentioned potential legal action if no response by end of week. Cc''d our legal team.',
     NOW() - INTERVAL '15 days'),
    (v_cc_westside, v_user_id, NULL, NULL, NULL,
     'System: Case auto-escalated from "Promise to Pay" to "Escalated" due to 14 days without payment after promise.',
     NOW() - INTERVAL '3 days'),

    -- Redrock notes
    (v_cc_redrock, v_user_id, NULL, NULL, NULL,
     'Case referred to Premier Recovery Solutions. Contact: James Morrison. 30% contingency fee. All documentation package sent including: original MCA agreement, payment history, NSF records, UCC filing.',
     NOW() - INTERVAL '14 days'),
    (v_cc_redrock, v_user_id, 'Bob Redfield', 'in_person', NULL,
     'Met with Bob at his office. Company is clearly struggling — reduced staff, equipment idle. He admits he can''t make payments. Discussed settlement options but he said he needs to talk to his attorney first. Not optimistic about recovery.',
     NOW() - INTERVAL '45 days'),
    (v_cc_redrock, v_user_id, 'Bob Redfield', 'phone', NULL,
     'Multiple attempts over 2 weeks. Finally reached Bob. Very evasive, keeps saying "next week." No concrete payment commitment. Recommending escalation to external agency.',
     NOW() - INTERVAL '60 days'),

    -- Catering notes
    (v_cc_catering, v_user_id, 'Maria Vasquez', 'phone', NOW() + INTERVAL '1 day',
     'First contact with Maria. She was apologetic about the missed payments — says they had two large event cancellations last month that hit revenue hard. She expects a $15K catering contract payment this week and promises to resume payments. Setting follow-up for tomorrow to verify.',
     NOW() - INTERVAL '2 days'),

    -- NightOwl notes
    (v_cc_nightowl, v_user_id, 'Dave Kim', 'phone', NOW() + INTERVAL '5 days',
     'Negotiated a restructured payment plan with Dave. He''ll pay $200/day (reduced from $310) for the next 60 days, then return to full payments. Plan starts Monday. He seems committed — signed the modification agreement today.',
     NOW() - INTERVAL '8 days'),
    (v_cc_nightowl, v_user_id, 'Dave Kim', 'phone', NULL,
     'Dave called proactively to report another NSF. Says his biggest client is 45 days past due on a $12K invoice. Offered to show proof. Moved from Early Contact to Payment Plan stage.',
     NOW() - INTERVAL '15 days'),
    (v_cc_nightowl, v_user_id, NULL, 'email', NULL,
     'Sent initial collections notice to Dave Kim at NightOwl Printing. Included account summary showing 3 NSF events and current balance of $40,000.',
     NOW() - INTERVAL '25 days')
  ON CONFLICT DO NOTHING;

  -- SLA Configs (thresholds for the team)
  INSERT INTO collection_sla_configs (team_id, stage_id, metric, threshold_minutes) VALUES
    (v_team_id, v_cs_early,     'time_in_stage',  10080),  -- 7 days in Early Contact
    (v_team_id, v_cs_promise,   'time_in_stage',  20160),  -- 14 days in Promise to Pay
    (v_team_id, v_cs_plan,      'time_in_stage',  43200),  -- 30 days in Payment Plan
    (v_team_id, v_cs_escalated, 'time_in_stage',  20160),  -- 14 days in Escalated
    (v_team_id, v_cs_legal,     'time_in_stage',  43200),  -- 30 days in Legal Review
    (v_team_id, NULL,           'response_time',  1440),   -- 24hr response time (global)
    (v_team_id, NULL,           'resolution_time', 129600) -- 90 day resolution time (global)
  ON CONFLICT DO NOTHING;

  -- Escalation Rules
  INSERT INTO collection_escalation_rules (team_id, trigger_type, from_stage_id, to_stage_id, condition, is_active) VALUES
    (v_team_id, 'time_based',  v_cs_early,   v_cs_promise,  '{"daysInStage": 7}',  true),
    (v_team_id, 'time_based',  v_cs_promise, v_cs_escalated, '{"daysInStage": 14}', true),
    (v_team_id, 'event_based', v_cs_early,   v_cs_escalated, '{"eventType": "nsf_returned", "threshold": 3}', true),
    (v_team_id, 'event_based', v_cs_plan,    v_cs_escalated, '{"eventType": "missed_payment", "threshold": 5}', true)
  ON CONFLICT DO NOTHING;

  -- Collection Notifications (sample unread notifications)
  INSERT INTO collection_notifications (team_id, user_id, case_id, type, message, created_at) VALUES
    (v_team_id, v_user_id, v_cc_westside, 'follow_up_due',
     'Follow-up overdue for Westside Construction LLC (MCA-2025-006). Was due yesterday.',
     NOW() - INTERVAL '1 day'),
    (v_team_id, v_user_id, v_cc_catering, 'assignment',
     'New collection case assigned: Coastal Catering Co. (MCA-2025-012). Balance: $38,000. Priority: Medium.',
     NOW() - INTERVAL '2 days'),
    (v_team_id, v_user_id, v_cc_westside, 'sla_breach',
     'SLA breach: Westside Construction LLC (MCA-2025-006) — follow-up overdue by 3 days in "Escalated" stage. 4 NSFs on record.',
     NOW() - INTERVAL '3 days'),
    (v_team_id, v_user_id, v_cc_nightowl, 'escalation',
     'NightOwl Printing auto-escalated from "Early Contact" to "Payment Plan" after payment plan agreement.',
     NOW() - INTERVAL '8 days')
  ON CONFLICT DO NOTHING;

  -- Grant collections permission to the demo user
  UPDATE users_on_team
  SET has_collections_permission = true
  WHERE user_id = v_user_id AND team_id = v_team_id;

  -- ========================================================================
  -- DEAL BANK ACCOUNTS (merchant bank details per deal)
  -- ========================================================================

  INSERT INTO deal_bank_accounts (deal_id, team_id, bank_name, routing_number, account_number, account_type, is_primary)
  VALUES
    -- Original 10 deals
    (v_d_sunrise,      v_team_id, 'Chase Bank',          '021000021', '****4521', 'checking', true),
    (v_d_martinez,     v_team_id, 'Citibank',            '021000089', '****7832', 'checking', true),
    (v_d_bella,        v_team_id, 'Bank of America',     '026009593', '****6190', 'checking', true),
    (v_d_tonys,        v_team_id, 'Wells Fargo',         '121000248', '****3344', 'checking', true),
    (v_d_quickprint,   v_team_id, 'TD Bank',             '031101266', '****8877', 'checking', true),
    (v_d_westside,     v_team_id, 'PNC Bank',            '043000096', '****2201', 'checking', true),
    (v_d_greenthumb,   v_team_id, 'Chase Bank',          '021000021', '****5612', 'checking', true),
    (v_d_fitness,      v_team_id, 'US Bank',             '091000019', '****9043', 'checking', true),
    (v_d_luckydragon,  v_team_id, 'Capital One',         '051405515', '****1198', 'checking', true),
    (v_d_smith,        v_team_id, 'Regions Bank',        '062005690', '****4400', 'checking', true),
    -- New deals (13)
    (v_d_harbor,       v_team_id, 'JPMorgan Chase',      '021000021', '****7701', 'checking', true),
    (v_d_bluesky,      v_team_id, 'Bank of America',     '026009593', '****3355', 'checking', true),
    (v_d_crossfit,     v_team_id, 'US Bank',             '091000019', '****6622', 'checking', true),
    (v_d_catering,     v_team_id, 'Regions Bank',        '062005690', '****8833', 'checking', true),
    (v_d_nightowl,     v_team_id, 'PNC Bank',            '043000096', '****1144', 'checking', true),
    (v_d_nailstudio,   v_team_id, 'Silicon Valley Bank', '121140399', '****5500', 'checking', true),
    (v_d_redrock,      v_team_id, 'Nevada State Bank',   '121201694', '****2277', 'checking', true),
    (v_d_urgentcare,   v_team_id, 'BMO Harris',          '071000288', '****9988', 'checking', true),
    (v_d_bookshelf_1,  v_team_id, 'Chase Bank',          '021000021', '****3301', 'checking', true),
    (v_d_bookshelf_2,  v_team_id, 'Chase Bank',          '021000021', '****3302', 'checking', true),
    (v_d_cardinal_1,   v_team_id, 'Wells Fargo',         '121000248', '****4401', 'checking', true),
    (v_d_cardinal_2,   v_team_id, 'Wells Fargo',         '121000248', '****4402', 'checking', true),
    (v_d_luckydragon_2,v_team_id, 'Capital One',         '051405515', '****1199', 'checking', true)
  ON CONFLICT DO NOTHING;

  -- ========================================================================
  -- ACH BATCHES + ITEMS
  -- ========================================================================

  INSERT INTO ach_batches (
    id, team_id, created_by, batch_number, effective_date, description,
    total_amount, item_count, originator_bank_account_id,
    originator_name, originator_routing, originator_account,
    status, submitted_at, completed_at
  ) VALUES (
    'ab000000-0000-0000-0000-000000000001'::uuid, v_team_id, v_user_id,
    'ACH-2026-0218-001', '2026-02-18', 'Daily MCA collections — Feb 18',
    1990.00, 5, v_bank_op,
    'Abacus Capital LLC', '021000021', '****4521',
    'completed', '2026-02-18 08:00:00-05', '2026-02-18 16:30:00-05'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO ach_batches (
    id, team_id, created_by, batch_number, effective_date, description,
    total_amount, item_count, originator_bank_account_id,
    originator_name, originator_routing, originator_account,
    status, submitted_at
  ) VALUES (
    'ab000000-0000-0000-0000-000000000002'::uuid, v_team_id, v_user_id,
    'ACH-2026-0224-001', '2026-02-24', 'Daily MCA collections — Feb 24',
    1770.00, 4, v_bank_op,
    'Abacus Capital LLC', '021000021', '****4521',
    'processing', '2026-02-24 08:00:00-05'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO ach_batches (
    id, team_id, created_by, batch_number, effective_date, description,
    total_amount, item_count, originator_bank_account_id,
    originator_name, originator_routing, originator_account,
    status
  ) VALUES (
    'ab000000-0000-0000-0000-000000000003'::uuid, v_team_id, v_user_id,
    'ACH-2026-0226-001', CURRENT_DATE, 'Daily MCA collections — today',
    2065.00, 5, v_bank_op,
    'Abacus Capital LLC', '021000021', '****4521',
    'draft'
  ) ON CONFLICT DO NOTHING;

  -- ACH Batch Items (amounts match each deal's daily_payment)
  -- Batch 1 (completed)
  INSERT INTO ach_batch_items (batch_id, team_id, deal_id, receiver_name, receiver_routing, receiver_account, amount, transaction_code, status)
  VALUES
    ('ab000000-0000-0000-0000-000000000001'::uuid, v_team_id, v_d_sunrise,    'Sunrise Diner LLC',        '021000021', '****4521', 485.00, '27', 'completed'),
    ('ab000000-0000-0000-0000-000000000001'::uuid, v_team_id, v_d_bella,      'Bella Salon & Spa Inc',    '026009593', '****6190', 275.00, '27', 'completed'),
    ('ab000000-0000-0000-0000-000000000001'::uuid, v_team_id, v_d_quickprint, 'Quick Print Solutions LLC', '031101266', '****8877', 425.00, '27', 'completed'),
    ('ab000000-0000-0000-0000-000000000001'::uuid, v_team_id, v_d_greenthumb, 'Green Thumb Landscaping',  '021000021', '****5612', 295.00, '27', 'completed'),
    ('ab000000-0000-0000-0000-000000000001'::uuid, v_team_id, v_d_fitness,    'Fitness First Gym LLC',    '091000019', '****9043', 510.00, '27', 'completed')
  ON CONFLICT DO NOTHING;

  -- Batch 2 (processing)
  INSERT INTO ach_batch_items (batch_id, team_id, deal_id, receiver_name, receiver_routing, receiver_account, amount, transaction_code, status)
  VALUES
    ('ab000000-0000-0000-0000-000000000002'::uuid, v_team_id, v_d_sunrise,    'Sunrise Diner LLC',        '021000021', '****4521', 485.00, '27', 'pending'),
    ('ab000000-0000-0000-0000-000000000002'::uuid, v_team_id, v_d_bella,      'Bella Salon & Spa Inc',    '026009593', '****6190', 275.00, '27', 'pending'),
    ('ab000000-0000-0000-0000-000000000002'::uuid, v_team_id, v_d_quickprint, 'Quick Print Solutions LLC', '031101266', '****8877', 425.00, '27', 'pending'),
    ('ab000000-0000-0000-0000-000000000002'::uuid, v_team_id, v_d_fitness,    'Fitness First Gym LLC',    '091000019', '****9043', 510.00, '27', 'pending')
  ON CONFLICT DO NOTHING;

  -- Batch 3 (draft — today)
  INSERT INTO ach_batch_items (batch_id, team_id, deal_id, receiver_name, receiver_routing, receiver_account, amount, transaction_code, status)
  VALUES
    ('ab000000-0000-0000-0000-000000000003'::uuid, v_team_id, v_d_sunrise,    'Sunrise Diner LLC',        '021000021', '****4521', 485.00, '27', 'pending'),
    ('ab000000-0000-0000-0000-000000000003'::uuid, v_team_id, v_d_bella,      'Bella Salon & Spa Inc',    '026009593', '****6190', 275.00, '27', 'pending'),
    ('ab000000-0000-0000-0000-000000000003'::uuid, v_team_id, v_d_tonys,      'Tony''s Pizzeria Inc',     '121000248', '****3344', 380.00, '27', 'pending'),
    ('ab000000-0000-0000-0000-000000000003'::uuid, v_team_id, v_d_quickprint, 'Quick Print Solutions LLC', '031101266', '****8877', 425.00, '27', 'pending'),
    ('ab000000-0000-0000-0000-000000000003'::uuid, v_team_id, v_d_fitness,    'Fitness First Gym LLC',    '091000019', '****9043', 510.00, '27', 'pending')
  ON CONFLICT DO NOTHING;

  -- ========================================================================
  -- RISK SCORING: Test Merchant Archetypes (8 merchants)
  -- Integrated from scripts/seed-risk-data.sql with fixes:
  --   - Skip weekends
  --   - Use 'mca-payments' (plural) for category_slug
  --   - NSF counts dynamically calculated
  -- ========================================================================

  DECLARE
    v_risk_merchant_id uuid;
    v_risk_deal_id uuid;
    v_risk_date date;
    v_risk_i int;
  BEGIN

  -- 1. "The Rock" — Perfect payer, 60 consecutive on-time payments
  INSERT INTO merchants (id, team_id, name, email, status)
  VALUES (gen_random_uuid(), v_team_id, 'Rock Solid LLC', 'rock@example.com', 'active')
  RETURNING id INTO v_risk_merchant_id;

  v_risk_deal_id := 'd0000000-0000-0000-0000-0000000000a1';
  INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, status, funded_at, payment_frequency)
  VALUES (v_risk_deal_id, v_team_id, v_risk_merchant_id, 'ROCK-001', 50000, 1.35, 67500, 1125, 0, 67500, 'paid_off', now() - interval '90 days', 'daily');

  v_risk_date := current_date - 90;
  FOR v_risk_i IN 1..60 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
      VALUES (v_team_id, v_risk_deal_id, 1125, v_risk_date, 'ach', 'completed');

      INSERT INTO transactions (team_id, bank_account_id, amount, date, name, description, status, method, internal_id, category_slug, currency)
      VALUES (v_team_id, v_bank_op, 1125, v_risk_date, 'Rock Solid LLC - Payment', 'MCA payment ROCK-001', 'posted', 'ach', 'ROCK-PAY-' || v_risk_i, 'mca-payments', 'USD');
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;

  -- 2. "The Sprinter" — Overpays aggressively, will finish early
  INSERT INTO merchants (id, team_id, name, email, status)
  VALUES (gen_random_uuid(), v_team_id, 'Sprint Corp', 'sprint@example.com', 'active')
  RETURNING id INTO v_risk_merchant_id;

  v_risk_deal_id := 'd0000000-0000-0000-0000-0000000000a2';
  INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, status, funded_at, payment_frequency)
  VALUES (v_risk_deal_id, v_team_id, v_risk_merchant_id, 'SPRINT-001', 40000, 1.40, 56000, 933, 20000, 36000, 'active', now() - interval '30 days', 'daily');

  v_risk_date := current_date - 30;
  FOR v_risk_i IN 1..30 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
      VALUES (v_team_id, v_risk_deal_id, 1200, v_risk_date, 'ach', 'completed');

      INSERT INTO transactions (team_id, bank_account_id, amount, date, name, description, status, method, internal_id, category_slug, currency)
      VALUES (v_team_id, v_bank_op, 1200, v_risk_date, 'Sprint Corp - Payment', 'MCA payment SPRINT-001', 'posted', 'ach', 'SPRINT-PAY-' || v_risk_i, 'mca-payments', 'USD');
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;

  -- 3. "The Stumbler" — Missed 5 payments then caught up
  INSERT INTO merchants (id, team_id, name, email, status)
  VALUES (gen_random_uuid(), v_team_id, 'Stumble & Rise Inc', 'stumbler@example.com', 'active')
  RETURNING id INTO v_risk_merchant_id;

  v_risk_deal_id := 'd0000000-0000-0000-0000-0000000000a3';
  INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, nsf_count, status, funded_at, payment_frequency)
  VALUES (v_risk_deal_id, v_team_id, v_risk_merchant_id, 'STMBL-001', 30000, 1.38, 41400, 690, 17250, 24150, 0, 'active', now() - interval '45 days', 'daily');

  v_risk_date := current_date - 45;
  -- 20 good payments
  FOR v_risk_i IN 1..20 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
      VALUES (v_team_id, v_risk_deal_id, 690, v_risk_date, 'ach', 'completed');
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;
  -- 5 NSF payments
  FOR v_risk_i IN 1..5 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, nsf_at, nsf_fee)
      VALUES (v_team_id, v_risk_deal_id, 690, v_risk_date, 'ach', 'returned', v_risk_date::timestamptz, 35);
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;
  -- 10 recovery payments
  FOR v_risk_i IN 1..10 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
      VALUES (v_team_id, v_risk_deal_id, 690, v_risk_date, 'ach', 'completed');
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;

  -- 4. "The Drifter" — Pays partial amounts consistently
  INSERT INTO merchants (id, team_id, name, email, status)
  VALUES (gen_random_uuid(), v_team_id, 'Drift Along Co', 'drifter@example.com', 'active')
  RETURNING id INTO v_risk_merchant_id;

  v_risk_deal_id := 'd0000000-0000-0000-0000-0000000000a4';
  INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, status, funded_at, payment_frequency)
  VALUES (v_risk_deal_id, v_team_id, v_risk_merchant_id, 'DRIFT-001', 25000, 1.42, 35500, 591, 21300, 14200, 'active', now() - interval '40 days', 'daily');

  v_risk_date := current_date - 40;
  FOR v_risk_i IN 1..40 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
      VALUES (v_team_id, v_risk_deal_id, 355, v_risk_date, 'ach', 'completed');
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;

  -- 5. "The Slider" — Started strong, deteriorating over time
  INSERT INTO merchants (id, team_id, name, email, status)
  VALUES (gen_random_uuid(), v_team_id, 'Sliding Scale LLC', 'slider@example.com', 'active')
  RETURNING id INTO v_risk_merchant_id;

  v_risk_deal_id := 'd0000000-0000-0000-0000-0000000000a5';
  INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, nsf_count, status, funded_at, payment_frequency)
  VALUES (v_risk_deal_id, v_team_id, v_risk_merchant_id, 'SLIDE-001', 35000, 1.36, 47600, 793, 31920, 15680, 0, 'late', now() - interval '60 days', 'daily');

  v_risk_date := current_date - 60;
  -- 20 perfect payments
  FOR v_risk_i IN 1..20 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
      VALUES (v_team_id, v_risk_deal_id, 793, v_risk_date, 'ach', 'completed');
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;
  -- 10 partial payments (declining amounts)
  FOR v_risk_i IN 1..10 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
      VALUES (v_team_id, v_risk_deal_id, 793 - v_risk_i*50, v_risk_date, 'ach', 'completed');
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;
  -- 3 NSF events recently
  FOR v_risk_i IN 1..3 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, nsf_at, nsf_fee)
      VALUES (v_team_id, v_risk_deal_id, 793, v_risk_date, 'ach', 'returned', v_risk_date::timestamptz, 35);
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;

  -- 6. "The Bouncer" — Frequent NSFs throughout
  INSERT INTO merchants (id, team_id, name, email, status)
  VALUES (gen_random_uuid(), v_team_id, 'Bounce House Inc', 'bouncer@example.com', 'active')
  RETURNING id INTO v_risk_merchant_id;

  v_risk_deal_id := 'd0000000-0000-0000-0000-0000000000a6';
  INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, nsf_count, status, funded_at, payment_frequency)
  VALUES (v_risk_deal_id, v_team_id, v_risk_merchant_id, 'BNCE-001', 20000, 1.45, 29000, 483, 22000, 7000, 0, 'active', now() - interval '50 days', 'daily');

  v_risk_date := current_date - 50;
  FOR v_risk_i IN 1..50 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      IF v_risk_i % 3 = 0 THEN
        INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, nsf_at, nsf_fee)
        VALUES (v_team_id, v_risk_deal_id, 483, v_risk_date, 'ach', 'returned', v_risk_date::timestamptz, 35);
      ELSE
        INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
        VALUES (v_team_id, v_risk_deal_id, 483, v_risk_date, 'ach', 'completed');
      END IF;
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;

  -- 7. "The Comeback" — Bad start, strong recovery
  INSERT INTO merchants (id, team_id, name, email, status)
  VALUES (gen_random_uuid(), v_team_id, 'Comeback Kid LLC', 'comeback@example.com', 'active')
  RETURNING id INTO v_risk_merchant_id;

  v_risk_deal_id := 'd0000000-0000-0000-0000-0000000000a7';
  INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, nsf_count, status, funded_at, payment_frequency)
  VALUES (v_risk_deal_id, v_team_id, v_risk_merchant_id, 'CMBK-001', 45000, 1.32, 59400, 990, 29700, 29700, 0, 'active', now() - interval '50 days', 'daily');

  v_risk_date := current_date - 50;
  -- 5 NSFs at start
  FOR v_risk_i IN 1..5 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, nsf_at, nsf_fee)
      VALUES (v_team_id, v_risk_deal_id, 990, v_risk_date, 'ach', 'returned', v_risk_date::timestamptz, 35);
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;
  -- 30 perfect payments since
  FOR v_risk_i IN 1..30 LOOP
    IF EXTRACT(DOW FROM v_risk_date) NOT IN (0, 6) THEN
      INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
      VALUES (v_team_id, v_risk_deal_id, 990, v_risk_date, 'ach', 'completed');

      INSERT INTO transactions (team_id, bank_account_id, amount, date, name, description, status, method, internal_id, category_slug, currency)
      VALUES (v_team_id, v_bank_op, 990, v_risk_date, 'Comeback Kid LLC - Payment', 'MCA payment CMBK-001', 'posted', 'ach', 'CMBK-PAY-' || v_risk_i, 'mca-payments', 'USD');
    END IF;
    v_risk_date := v_risk_date + 1;
  END LOOP;

  -- 8. "The New Deal" — Just funded, no payment history yet
  INSERT INTO merchants (id, team_id, name, email, status)
  VALUES (gen_random_uuid(), v_team_id, 'Fresh Start Corp', 'newdeal@example.com', 'active')
  RETURNING id INTO v_risk_merchant_id;

  INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, status, funded_at, payment_frequency)
  VALUES ('d0000000-0000-0000-0000-0000000000a8', v_team_id, v_risk_merchant_id, 'NEW-001', 30000, 1.35, 40500, 675, 40500, 0, 'active', now(), 'daily');

  -- Re-run dynamic balance + NSF calculation for risk merchants too
  UPDATE mca_deals d
  SET total_paid = LEAST(sub.paid, d.payback_amount),
      current_balance = GREATEST(d.payback_amount - sub.paid, 0)
  FROM (
    SELECT deal_id, SUM(amount) as paid
    FROM mca_payments
    WHERE status = 'completed' AND team_id = v_team_id
    GROUP BY deal_id
  ) sub
  WHERE d.id = sub.deal_id AND d.team_id = v_team_id;

  UPDATE mca_deals d
  SET nsf_count = COALESCE(sub.cnt, 0)
  FROM (
    SELECT deal_id, COUNT(*) as cnt
    FROM mca_payments
    WHERE status = 'returned' AND team_id = v_team_id
    GROUP BY deal_id
  ) sub
  WHERE d.id = sub.deal_id AND d.team_id = v_team_id;

  -- Backfill balance_before/balance_after for risk merchant payments too
  WITH ordered_payments AS (
    SELECT id, deal_id, amount,
      ROW_NUMBER() OVER (PARTITION BY deal_id ORDER BY payment_date, id) as rn
    FROM mca_payments WHERE team_id = v_team_id AND status = 'completed'
      AND balance_before IS NULL
  ),
  running AS (
    SELECT op.id,
      d.payback_amount - COALESCE(SUM(op.amount) OVER (
        PARTITION BY op.deal_id ORDER BY op.rn
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ), 0) as balance_before,
      d.payback_amount - SUM(op.amount) OVER (
        PARTITION BY op.deal_id ORDER BY op.rn
      ) as balance_after
    FROM ordered_payments op JOIN mca_deals d ON d.id = op.deal_id
  )
  UPDATE mca_payments p
  SET balance_before = r.balance_before, balance_after = r.balance_after
  FROM running r WHERE p.id = r.id;

  END; -- end risk archetype DECLARE block

  -- ========================================================================
  -- RISK CONFIG (team-level configuration)
  -- ========================================================================

  INSERT INTO risk_config (team_id, preset, weights, decay_half_life_days, baseline_score, band_thresholds)
  VALUES (v_team_id, 'balanced',
    '{"consistency": 0.25, "nsf": 0.25, "velocity": 0.15, "recovery": 0.15, "progress": 0.10, "amounts": 0.10}'::jsonb,
    30, 50,
    '{"low_max": 33, "high_min": 67}'::jsonb)
  ON CONFLICT (team_id) DO NOTHING;

  -- ========================================================================
  -- RISK SCORES (pre-calculated for all active/late/defaulted deals)
  -- Lower score = healthier. Bands: low (0-33), medium (34-66), high (67-100)
  -- ========================================================================

  INSERT INTO risk_scores (team_id, deal_id, overall_score, previous_score, band, sub_scores, calculated_at)
  VALUES
    -- Healthy active deals
    (v_team_id, v_d_sunrise,       12.00, 14.00, 'low',    '{"consistency":0.95,"nsf":1.00,"velocity":0.90,"recovery":1.00,"progress":0.85,"amounts":0.95}'::jsonb, NOW()),
    (v_team_id, v_d_bella,         18.00, 20.00, 'low',    '{"consistency":0.92,"nsf":1.00,"velocity":0.88,"recovery":1.00,"progress":0.60,"amounts":0.90}'::jsonb, NOW()),
    (v_team_id, v_d_harbor,        15.00, 16.00, 'low',    '{"consistency":0.94,"nsf":1.00,"velocity":0.89,"recovery":1.00,"progress":0.45,"amounts":0.93}'::jsonb, NOW()),
    (v_team_id, v_d_bluesky,       10.00, 12.00, 'low',    '{"consistency":0.96,"nsf":1.00,"velocity":0.92,"recovery":1.00,"progress":0.70,"amounts":0.96}'::jsonb, NOW()),
    (v_team_id, v_d_crossfit,       8.00, 10.00, 'low',    '{"consistency":0.97,"nsf":1.00,"velocity":0.95,"recovery":1.00,"progress":0.99,"amounts":0.98}'::jsonb, NOW()),
    (v_team_id, v_d_nailstudio,    20.00, 22.00, 'low',    '{"consistency":0.90,"nsf":1.00,"velocity":0.85,"recovery":1.00,"progress":0.42,"amounts":0.88}'::jsonb, NOW()),
    (v_team_id, v_d_bookshelf_2,   16.00, 18.00, 'low',    '{"consistency":0.93,"nsf":1.00,"velocity":0.87,"recovery":1.00,"progress":0.65,"amounts":0.91}'::jsonb, NOW()),
    (v_team_id, v_d_cardinal_2,     5.00,  7.00, 'low',    '{"consistency":0.98,"nsf":1.00,"velocity":0.97,"recovery":1.00,"progress":0.95,"amounts":0.99}'::jsonb, NOW()),
    (v_team_id, v_d_luckydragon_2, 14.00, 15.00, 'low',    '{"consistency":0.94,"nsf":1.00,"velocity":0.90,"recovery":1.00,"progress":0.40,"amounts":0.92}'::jsonb, NOW()),
    -- At-risk deals (late payments, some NSFs)
    (v_team_id, v_d_tonys,         48.00, 42.00, 'medium', '{"consistency":0.65,"nsf":0.70,"velocity":0.55,"recovery":0.60,"progress":0.50,"amounts":0.70}'::jsonb, NOW()),
    (v_team_id, v_d_quickprint,    42.00, 38.00, 'medium', '{"consistency":0.70,"nsf":0.80,"velocity":0.60,"recovery":0.65,"progress":0.55,"amounts":0.72}'::jsonb, NOW()),
    -- Late deals (in collections or near it)
    (v_team_id, v_d_westside,      72.00, 65.00, 'high',   '{"consistency":0.35,"nsf":0.40,"velocity":0.30,"recovery":0.25,"progress":0.48,"amounts":0.38}'::jsonb, NOW()),
    (v_team_id, v_d_catering,      62.00, 55.00, 'medium', '{"consistency":0.50,"nsf":0.60,"velocity":0.42,"recovery":0.45,"progress":0.52,"amounts":0.55}'::jsonb, NOW()),
    (v_team_id, v_d_nightowl,      68.00, 60.00, 'high',   '{"consistency":0.40,"nsf":0.50,"velocity":0.35,"recovery":0.38,"progress":0.44,"amounts":0.42}'::jsonb, NOW()),
    -- Defaulted
    (v_team_id, v_d_redrock,       90.00, 85.00, 'high',   '{"consistency":0.10,"nsf":0.15,"velocity":0.08,"recovery":0.05,"progress":0.45,"amounts":0.12}'::jsonb, NOW()),
    -- Paid-off deals (frozen scores)
    (v_team_id, v_d_martinez,       8.00,  8.00, 'low',    '{"consistency":0.97,"nsf":1.00,"velocity":0.95,"recovery":1.00,"progress":1.00,"amounts":0.97}'::jsonb, NOW()),
    (v_team_id, v_d_luckydragon,   10.00, 10.00, 'low',    '{"consistency":0.96,"nsf":1.00,"velocity":0.93,"recovery":1.00,"progress":1.00,"amounts":0.95}'::jsonb, NOW()),
    (v_team_id, v_d_smith,         12.00, 12.00, 'low',    '{"consistency":0.95,"nsf":1.00,"velocity":0.91,"recovery":1.00,"progress":1.00,"amounts":0.93}'::jsonb, NOW()),
    (v_team_id, v_d_bookshelf_1,   15.00, 15.00, 'low',    '{"consistency":0.93,"nsf":1.00,"velocity":0.88,"recovery":1.00,"progress":1.00,"amounts":0.90}'::jsonb, NOW()),
    (v_team_id, v_d_cardinal_1,    11.00, 11.00, 'low',    '{"consistency":0.95,"nsf":1.00,"velocity":0.92,"recovery":1.00,"progress":1.00,"amounts":0.94}'::jsonb, NOW()),
    -- New deals (baseline score)
    (v_team_id, v_d_greenthumb,    50.00, NULL,   'medium', '{"consistency":0.50,"nsf":1.00,"velocity":0.50,"recovery":0.50,"progress":0.05,"amounts":0.50}'::jsonb, NOW()),
    (v_team_id, v_d_fitness,       50.00, NULL,   'medium', '{"consistency":0.50,"nsf":1.00,"velocity":0.50,"recovery":0.50,"progress":0.03,"amounts":0.50}'::jsonb, NOW()),
    (v_team_id, v_d_urgentcare,    50.00, NULL,   'medium', '{"consistency":0.50,"nsf":1.00,"velocity":0.50,"recovery":0.50,"progress":0.07,"amounts":0.50}'::jsonb, NOW())
  ON CONFLICT (deal_id) DO NOTHING;

  RAISE NOTICE 'Demo data seeded successfully!';

END $$;
