-- Migration: Seed Demo Data for Abacus MCA Platform
-- Created: 2026-01-19
-- Purpose: Create admin team, demo merchants, and payment transactions
-- NOTE: This migration seeds demo data for development/testing purposes

-- ============================================================================
-- PART 1: Create Admin Team (Abacus Capital)
-- ============================================================================

INSERT INTO public.teams (id, name, base_currency, country_code, created_at, plan)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Abacus Capital',
  'USD',
  'US',
  NOW(),
  'pro'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 2: Create Bank Account
-- ============================================================================

INSERT INTO public.bank_accounts (id, team_id, created_by, name, currency, balance, type, manual, enabled, account_id)
SELECT
  'ba000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  u.id,
  'Abacus Capital Operating',
  'USD',
  847592.45,
  'depository',
  true,
  true,
  'manual_operating_001'
FROM public.users u
WHERE u.email = 'suph.tweel@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 3: Create MCA Transaction Categories
-- ============================================================================

INSERT INTO public.transaction_categories (team_id, name, slug, color, description, system)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'MCA Payments', 'mca-payments', '#16a34a', 'Daily/weekly ACH payments from merchants', false),
  ('a0000000-0000-0000-0000-000000000001', 'NSF Returns', 'nsf-returns', '#dc2626', 'Non-sufficient funds / bounced payments', false),
  ('a0000000-0000-0000-0000-000000000001', 'Funding Disbursements', 'funding-disbursements', '#0ea5e9', 'Outgoing funds to merchants', false),
  ('a0000000-0000-0000-0000-000000000001', 'ISO Commissions', 'iso-commissions', '#f97316', 'Broker/ISO commission payments', false),
  ('a0000000-0000-0000-0000-000000000001', 'Operating Expenses', 'operating-expenses', '#6b7280', 'General business expenses', false)
ON CONFLICT (team_id, slug) DO NOTHING;

-- ============================================================================
-- PART 4: Create Demo Merchants
-- ============================================================================
-- Mix of industries, health statuses, and deal sizes to demonstrate platform capabilities

INSERT INTO public.customers (team_id, name, email, phone, contact, industry, address_line_1, city, state, zip, country, status, note, website, created_at, token)
VALUES
  -- HEALTHY MERCHANTS (on-time payments)
  ('a0000000-0000-0000-0000-000000000001',
   'Sunrise Diner', 'mike@sunrisediner.com', '(555) 123-4567', 'Mike Rodriguez',
   'Restaurant', '245 Main Street', 'Austin', 'TX', '78701', 'US', 'active',
   'Family diner, 15 years in business. Strong breakfast crowd. Factor rate: 1.35, Daily ACH $485',
   'sunrisediner.com', NOW() - INTERVAL '8 months', 'tok_sunrise_001'),

  ('a0000000-0000-0000-0000-000000000001',
   'Martinez Auto Repair', 'carlos@martinezauto.com', '(555) 234-5678', 'Carlos Martinez',
   'Automotive', '892 Industrial Blvd', 'Houston', 'TX', '77001', 'US', 'active',
   'Full service auto shop. 3rd MCA with us - excellent payment history. Factor: 1.32, Daily ACH $320',
   'martinezautorepair.com', NOW() - INTERVAL '14 months', 'tok_martinez_001'),

  ('a0000000-0000-0000-0000-000000000001',
   'Bella Salon & Spa', 'sarah@bellasalon.com', '(555) 345-6789', 'Sarah Chen',
   'Beauty & Personal Care', '1250 Oak Avenue', 'Dallas', 'TX', '75201', 'US', 'active',
   'Upscale salon, strong recurring clientele. Factor: 1.38, Daily ACH $275',
   'bellasalonspa.com', NOW() - INTERVAL '5 months', 'tok_bella_001'),

  -- AT-RISK MERCHANTS (occasional NSFs, needs monitoring)
  ('a0000000-0000-0000-0000-000000000001',
   'Tony''s Pizzeria', 'tony@tonyspizza.com', '(555) 456-7890', 'Tony Benedetto',
   'Restaurant', '567 College Ave', 'San Antonio', 'TX', '78205', 'US', 'active',
   '⚠️ 2 NSFs in last 30 days. Seasonal slowdown claimed. Factor: 1.42, Daily ACH $380. MONITOR CLOSELY',
   'tonyspizzeria.com', NOW() - INTERVAL '6 months', 'tok_tonys_001'),

  ('a0000000-0000-0000-0000-000000000001',
   'Quick Print Solutions', 'james@quickprint.com', '(555) 567-8901', 'James Wilson',
   'Business Services', '2100 Commerce St', 'Fort Worth', 'TX', '76102', 'US', 'active',
   '⚠️ 1 NSF last week, claims large client paid late. Factor: 1.40, Daily ACH $425. Following up Friday',
   'quickprintsolutions.com', NOW() - INTERVAL '4 months', 'tok_quickprint_001'),

  -- HIGH-RISK MERCHANTS (multiple issues)
  ('a0000000-0000-0000-0000-000000000001',
   'Westside Construction LLC', 'dave@westsideconstruct.com', '(555) 678-9012', 'Dave Thompson',
   'Construction', '4500 Builder Lane', 'El Paso', 'TX', '79901', 'US', 'active',
   '🔴 HIGH RISK: 4 NSFs in 45 days. Switched to weekly ACH. Factor: 1.45, Weekly ACH $1,890. Legal review pending',
   'westsideconstruction.com', NOW() - INTERVAL '7 months', 'tok_westside_001'),

  -- NEW MERCHANTS (recently funded)
  ('a0000000-0000-0000-0000-000000000001',
   'Green Thumb Landscaping', 'maria@greenthumb.com', '(555) 789-0123', 'Maria Santos',
   'Landscaping', '789 Garden Way', 'Austin', 'TX', '78702', 'US', 'active',
   'New deal funded 2 weeks ago. First 10 payments on time. Factor: 1.36, Daily ACH $295',
   'greenthumblandscaping.com', NOW() - INTERVAL '14 days', 'tok_greenthumb_001'),

  ('a0000000-0000-0000-0000-000000000001',
   'Fitness First Gym', 'kevin@fitnessfirst.com', '(555) 890-1234', 'Kevin Park',
   'Health & Fitness', '3200 Wellness Blvd', 'Houston', 'TX', '77002', 'US', 'active',
   'New deal funded last week. Membership-based revenue, stable cash flow expected. Factor: 1.34, Daily ACH $510',
   'fitnessfirstgym.com', NOW() - INTERVAL '7 days', 'tok_fitnessfirst_001'),

  -- COMPLETED DEALS (paid off)
  ('a0000000-0000-0000-0000-000000000001',
   'Lucky Dragon Restaurant', 'chen@luckydragon.com', '(555) 901-2345', 'Wei Chen',
   'Restaurant', '1888 Asian District', 'Dallas', 'TX', '75207', 'US', 'active',
   '✅ PAID OFF: $75,000 deal completed. Excellent history - pre-approved for renewal up to $100k',
   'luckydragonrestaurant.com', NOW() - INTERVAL '18 months', 'tok_luckydragon_001'),

  ('a0000000-0000-0000-0000-000000000001',
   'Smith Plumbing Services', 'john@smithplumbing.com', '(555) 012-3456', 'John Smith',
   'Home Services', '456 Trade Circle', 'San Antonio', 'TX', '78210', 'US', 'active',
   '✅ PAID OFF: $50,000 deal completed early! Interested in equipment financing next',
   'smithplumbingservices.com', NOW() - INTERVAL '12 months', 'tok_smithplumbing_001')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTES FOR DEVELOPMENT
-- ============================================================================
--
-- Demo Data Summary:
-- - 10 merchants across different industries and risk profiles
-- - 1 bank account with $847,592.45 balance
-- - 5 transaction categories for MCA operations
--
-- Merchant Categories:
-- - 3 Healthy (Sunrise Diner, Martinez Auto, Bella Salon)
-- - 2 At-Risk (Tony's Pizzeria, Quick Print)
-- - 1 High-Risk (Westside Construction)
-- - 2 New (Green Thumb, Fitness First)
-- - 2 Completed/Paid Off (Lucky Dragon, Smith Plumbing)
--
-- Payment transactions are generated dynamically via the app or separate seed script
-- See: supabase/seed.sql for transaction seeding
