-- ============================================================================
-- DEPRECATED: Use `supabase db reset` which runs supabase/seed.sql.
-- This file is kept for reference only. All seed data (including risk
-- archetypes) is now consolidated in supabase/seed.sql.
-- ============================================================================
-- Original description:
-- Risk Scoring Seed Data
-- 8 Merchant Archetypes with payment histories for algorithm validation
-- Team ID: a0000000-0000-4000-a000-000000000001 (matches seed-all.sh)
-- ============================================================================

DO $$
DECLARE
  v_team_id uuid := 'a0000000-0000-4000-a000-000000000001';
  v_merchant_id uuid;
  v_deal_id uuid;
  v_payment_id uuid;
  v_date date;
  v_i int;
BEGIN

-- ============================================================================
-- 1. "The Rock" — Perfect payer, 60 consecutive on-time payments
-- ============================================================================
INSERT INTO merchants (id, team_id, name, email, status)
VALUES (gen_random_uuid(), v_team_id, 'Rock Solid LLC', 'rock@example.com', 'active')
RETURNING id INTO v_merchant_id;

INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, status, funded_at, payment_frequency)
VALUES (gen_random_uuid(), v_team_id, v_merchant_id, 'ROCK-001', 50000, 1.35, 67500, 1125, 0, 67500, 'paid_off', now() - interval '90 days', 'daily')
RETURNING id INTO v_deal_id;

v_date := current_date - 90;
FOR v_i IN 1..60 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, balance_before, balance_after)
  VALUES (v_team_id, v_deal_id, 1125, v_date, 'ach', 'completed', 67500 - (v_i-1)*1125, 67500 - v_i*1125);

  INSERT INTO transactions (team_id, amount, date, name, description, status, internal_id, category_slug)
  VALUES (v_team_id, 1125, v_date, 'Rock Solid LLC - Payment', 'MCA payment ROCK-001', 'posted', 'ROCK-PAY-' || v_i, 'mca-payment');

  v_date := v_date + 1;
END LOOP;

-- ============================================================================
-- 2. "The Sprinter" — Overpays aggressively, will finish early
-- ============================================================================
INSERT INTO merchants (id, team_id, name, email, status)
VALUES (gen_random_uuid(), v_team_id, 'Sprint Corp', 'sprint@example.com', 'active')
RETURNING id INTO v_merchant_id;

INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, status, funded_at, payment_frequency)
VALUES (gen_random_uuid(), v_team_id, v_merchant_id, 'SPRINT-001', 40000, 1.40, 56000, 933, 20000, 36000, 'active', now() - interval '30 days', 'daily')
RETURNING id INTO v_deal_id;

v_date := current_date - 30;
FOR v_i IN 1..30 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, balance_before, balance_after)
  VALUES (v_team_id, v_deal_id, 1200, v_date, 'ach', 'completed', 56000 - (v_i-1)*1200, 56000 - v_i*1200);

  INSERT INTO transactions (team_id, amount, date, name, description, status, internal_id, category_slug)
  VALUES (v_team_id, 1200, v_date, 'Sprint Corp - Payment', 'MCA payment SPRINT-001', 'posted', 'SPRINT-PAY-' || v_i, 'mca-payment');

  v_date := v_date + 1;
END LOOP;

-- ============================================================================
-- 3. "The Stumbler" — Missed 5 payments then caught up
-- ============================================================================
INSERT INTO merchants (id, team_id, name, email, status)
VALUES (gen_random_uuid(), v_team_id, 'Stumble & Rise Inc', 'stumbler@example.com', 'active')
RETURNING id INTO v_merchant_id;

INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, nsf_count, status, funded_at, payment_frequency)
VALUES (gen_random_uuid(), v_team_id, v_merchant_id, 'STMBL-001', 30000, 1.38, 41400, 690, 17250, 24150, 5, 'active', now() - interval '45 days', 'daily')
RETURNING id INTO v_deal_id;

v_date := current_date - 45;
-- 20 good payments
FOR v_i IN 1..20 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, balance_before, balance_after)
  VALUES (v_team_id, v_deal_id, 690, v_date, 'ach', 'completed', 41400 - (v_i-1)*690, 41400 - v_i*690);
  v_date := v_date + 1;
END LOOP;

-- 5 NSF payments
FOR v_i IN 1..5 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, nsf_at, nsf_fee)
  VALUES (v_team_id, v_deal_id, 690, v_date, 'ach', 'returned', v_date::text, 35);
  v_date := v_date + 1;
END LOOP;

-- 10 recovery payments (caught up)
FOR v_i IN 1..10 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, balance_before, balance_after)
  VALUES (v_team_id, v_deal_id, 690, v_date, 'ach', 'completed', 27600 - (v_i-1)*690, 27600 - v_i*690);
  v_date := v_date + 1;
END LOOP;

-- ============================================================================
-- 4. "The Drifter" — Pays partial amounts consistently
-- ============================================================================
INSERT INTO merchants (id, team_id, name, email, status)
VALUES (gen_random_uuid(), v_team_id, 'Drift Along Co', 'drifter@example.com', 'active')
RETURNING id INTO v_merchant_id;

INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, status, funded_at, payment_frequency)
VALUES (gen_random_uuid(), v_team_id, v_merchant_id, 'DRIFT-001', 25000, 1.42, 35500, 591, 21300, 14200, 'active', now() - interval '40 days', 'daily')
RETURNING id INTO v_deal_id;

v_date := current_date - 40;
FOR v_i IN 1..40 LOOP
  -- Pays only ~60% of expected amount
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, balance_before, balance_after)
  VALUES (v_team_id, v_deal_id, 355, v_date, 'ach', 'completed', 35500 - (v_i-1)*355, 35500 - v_i*355);
  v_date := v_date + 1;
END LOOP;

-- ============================================================================
-- 5. "The Slider" — Started strong, deteriorating over time
-- ============================================================================
INSERT INTO merchants (id, team_id, name, email, status)
VALUES (gen_random_uuid(), v_team_id, 'Sliding Scale LLC', 'slider@example.com', 'active')
RETURNING id INTO v_merchant_id;

INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, nsf_count, status, funded_at, payment_frequency)
VALUES (gen_random_uuid(), v_team_id, v_merchant_id, 'SLIDE-001', 35000, 1.36, 47600, 793, 31920, 15680, 3, 'late', now() - interval '60 days', 'daily')
RETURNING id INTO v_deal_id;

v_date := current_date - 60;
-- 20 perfect payments
FOR v_i IN 1..20 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, balance_before, balance_after)
  VALUES (v_team_id, v_deal_id, 793, v_date, 'ach', 'completed', 47600 - (v_i-1)*793, 47600 - v_i*793);
  v_date := v_date + 1;
END LOOP;

-- 10 partial payments (declining amounts)
FOR v_i IN 1..10 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
  VALUES (v_team_id, v_deal_id, 793 - v_i*50, v_date, 'ach', 'completed');
  v_date := v_date + 1;
END LOOP;

-- 3 NSF events recently
FOR v_i IN 1..3 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, nsf_at, nsf_fee)
  VALUES (v_team_id, v_deal_id, 793, v_date, 'ach', 'returned', v_date::text, 35);
  v_date := v_date + 1;
END LOOP;

-- ============================================================================
-- 6. "The Bouncer" — Frequent NSFs throughout
-- ============================================================================
INSERT INTO merchants (id, team_id, name, email, status)
VALUES (gen_random_uuid(), v_team_id, 'Bounce House Inc', 'bouncer@example.com', 'active')
RETURNING id INTO v_merchant_id;

INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, nsf_count, status, funded_at, payment_frequency)
VALUES (gen_random_uuid(), v_team_id, v_merchant_id, 'BNCE-001', 20000, 1.45, 29000, 483, 22000, 7000, 10, 'active', now() - interval '50 days', 'daily')
RETURNING id INTO v_deal_id;

v_date := current_date - 50;
FOR v_i IN 1..50 LOOP
  IF v_i % 3 = 0 THEN
    -- Every 3rd payment is NSF
    INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, nsf_at, nsf_fee)
    VALUES (v_team_id, v_deal_id, 483, v_date, 'ach', 'returned', v_date::text, 35);
  ELSE
    INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status)
    VALUES (v_team_id, v_deal_id, 483, v_date, 'ach', 'completed');
  END IF;
  v_date := v_date + 1;
END LOOP;

-- ============================================================================
-- 7. "The Comeback" — Bad start, strong recovery
-- ============================================================================
INSERT INTO merchants (id, team_id, name, email, status)
VALUES (gen_random_uuid(), v_team_id, 'Comeback Kid LLC', 'comeback@example.com', 'active')
RETURNING id INTO v_merchant_id;

INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, nsf_count, status, funded_at, payment_frequency)
VALUES (gen_random_uuid(), v_team_id, v_merchant_id, 'CMBK-001', 45000, 1.32, 59400, 990, 29700, 29700, 5, 'active', now() - interval '50 days', 'daily')
RETURNING id INTO v_deal_id;

v_date := current_date - 50;
-- 5 NSFs at start
FOR v_i IN 1..5 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, nsf_at, nsf_fee)
  VALUES (v_team_id, v_deal_id, 990, v_date, 'ach', 'returned', v_date::text, 35);
  v_date := v_date + 1;
END LOOP;

-- 30 perfect payments since
FOR v_i IN 1..30 LOOP
  INSERT INTO mca_payments (team_id, deal_id, amount, payment_date, payment_type, status, balance_before, balance_after)
  VALUES (v_team_id, v_deal_id, 990, v_date, 'ach', 'completed', 59400 - (v_i-1)*990, 59400 - v_i*990);

  INSERT INTO transactions (team_id, amount, date, name, description, status, internal_id, category_slug)
  VALUES (v_team_id, 990, v_date, 'Comeback Kid LLC - Payment', 'MCA payment CMBK-001', 'posted', 'CMBK-PAY-' || v_i, 'mca-payment');

  v_date := v_date + 1;
END LOOP;

-- ============================================================================
-- 8. "The New Deal" — Just funded, no payment history yet
-- ============================================================================
INSERT INTO merchants (id, team_id, name, email, status)
VALUES (gen_random_uuid(), v_team_id, 'Fresh Start Corp', 'newdeal@example.com', 'active')
RETURNING id INTO v_merchant_id;

INSERT INTO mca_deals (id, team_id, merchant_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, current_balance, total_paid, status, funded_at, payment_frequency)
VALUES (gen_random_uuid(), v_team_id, v_merchant_id, 'NEW-001', 30000, 1.35, 40500, 675, 40500, 0, 'active', now(), 'daily');

RAISE NOTICE 'Risk scoring seed data created: 8 merchants with diverse payment patterns';

END $$;
