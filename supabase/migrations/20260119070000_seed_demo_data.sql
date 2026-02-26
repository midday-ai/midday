-- Migration: Seed Demo Data for Abacus MCA Platform
-- Created: 2026-01-19
-- Purpose: Create admin team, demo merchants, and payment transactions
-- NOTE: This migration seeds demo data for development/testing purposes

-- ============================================================================
-- PART 1: Create Admin Team (Abacus Capital)
-- ============================================================================

INSERT INTO public.teams (id, name, base_currency, country_code, created_at, plan)
VALUES (
  'a0000000-0000-4000-a000-000000000001',
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
  'ba000000-0000-4000-a000-000000000001',
  'a0000000-0000-4000-a000-000000000001',
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
  ('a0000000-0000-4000-a000-000000000001', 'MCA Payments', 'mca-payments', '#16a34a', 'Daily/weekly ACH payments from merchants', false),
  ('a0000000-0000-4000-a000-000000000001', 'NSF Returns', 'nsf-returns', '#dc2626', 'Non-sufficient funds / bounced payments', false),
  ('a0000000-0000-4000-a000-000000000001', 'Funding Disbursements', 'funding-disbursements', '#0ea5e9', 'Outgoing funds to merchants', false),
  ('a0000000-0000-4000-a000-000000000001', 'ISO Commissions', 'iso-commissions', '#f97316', 'Broker/ISO commission payments', false),
  ('a0000000-0000-4000-a000-000000000001', 'Operating Expenses', 'operating-expenses', '#6b7280', 'General business expenses', false)
ON CONFLICT (team_id, slug) DO NOTHING;

-- ============================================================================
-- PART 4: Create Demo Merchants
-- ============================================================================
-- Mix of industries, health statuses, and deal sizes to demonstrate platform capabilities

INSERT INTO public.customers (team_id, name, email, phone, contact, industry, address_line_1, city, state, zip, country, status, note, website, created_at, token)
VALUES
  -- HEALTHY MERCHANTS (on-time payments)
  ('a0000000-0000-4000-a000-000000000001',
   'Sunrise Diner', 'mike@sunrisediner.com', '(555) 123-4567', 'Mike Rodriguez',
   'Restaurant', '245 Main Street', 'Austin', 'TX', '78701', 'US', 'active',
   'Family diner, 15 years in business. Strong breakfast crowd. Factor rate: 1.35, Daily ACH $485',
   'sunrisediner.com', NOW() - INTERVAL '8 months', 'tok_sunrise_001'),

  ('a0000000-0000-4000-a000-000000000001',
   'Martinez Auto Repair', 'carlos@martinezauto.com', '(555) 234-5678', 'Carlos Martinez',
   'Automotive', '892 Industrial Blvd', 'Houston', 'TX', '77001', 'US', 'active',
   'Full service auto shop. 3rd MCA with us - excellent payment history. Factor: 1.32, Daily ACH $320',
   'martinezautorepair.com', NOW() - INTERVAL '14 months', 'tok_martinez_001'),

  ('a0000000-0000-4000-a000-000000000001',
   'Bella Salon & Spa', 'sarah@bellasalon.com', '(555) 345-6789', 'Sarah Chen',
   'Beauty & Personal Care', '1250 Oak Avenue', 'Dallas', 'TX', '75201', 'US', 'active',
   'Upscale salon, strong recurring clientele. Factor: 1.38, Daily ACH $275',
   'bellasalonspa.com', NOW() - INTERVAL '5 months', 'tok_bella_001'),

  -- AT-RISK MERCHANTS (occasional NSFs, needs monitoring)
  ('a0000000-0000-4000-a000-000000000001',
   'Tony''s Pizzeria', 'tony@tonyspizza.com', '(555) 456-7890', 'Tony Benedetto',
   'Restaurant', '567 College Ave', 'San Antonio', 'TX', '78205', 'US', 'active',
   '⚠️ 2 NSFs in last 30 days. Seasonal slowdown claimed. Factor: 1.42, Daily ACH $380. MONITOR CLOSELY',
   'tonyspizzeria.com', NOW() - INTERVAL '6 months', 'tok_tonys_001'),

  ('a0000000-0000-4000-a000-000000000001',
   'Quick Print Solutions', 'james@quickprint.com', '(555) 567-8901', 'James Wilson',
   'Business Services', '2100 Commerce St', 'Fort Worth', 'TX', '76102', 'US', 'active',
   '⚠️ 1 NSF last week, claims large client paid late. Factor: 1.40, Daily ACH $425. Following up Friday',
   'quickprintsolutions.com', NOW() - INTERVAL '4 months', 'tok_quickprint_001'),

  -- HIGH-RISK MERCHANTS (multiple issues)
  ('a0000000-0000-4000-a000-000000000001',
   'Westside Construction LLC', 'dave@westsideconstruct.com', '(555) 678-9012', 'Dave Thompson',
   'Construction', '4500 Builder Lane', 'El Paso', 'TX', '79901', 'US', 'active',
   '🔴 HIGH RISK: 4 NSFs in 45 days. Switched to weekly ACH. Factor: 1.45, Weekly ACH $1,890. Legal review pending',
   'westsideconstruction.com', NOW() - INTERVAL '7 months', 'tok_westside_001'),

  -- NEW MERCHANTS (recently funded)
  ('a0000000-0000-4000-a000-000000000001',
   'Green Thumb Landscaping', 'maria@greenthumb.com', '(555) 789-0123', 'Maria Santos',
   'Landscaping', '789 Garden Way', 'Austin', 'TX', '78702', 'US', 'active',
   'New deal funded 2 weeks ago. First 10 payments on time. Factor: 1.36, Daily ACH $295',
   'greenthumblandscaping.com', NOW() - INTERVAL '14 days', 'tok_greenthumb_001'),

  ('a0000000-0000-4000-a000-000000000001',
   'Fitness First Gym', 'kevin@fitnessfirst.com', '(555) 890-1234', 'Kevin Park',
   'Health & Fitness', '3200 Wellness Blvd', 'Houston', 'TX', '77002', 'US', 'active',
   'New deal funded last week. Membership-based revenue, stable cash flow expected. Factor: 1.34, Daily ACH $510',
   'fitnessfirstgym.com', NOW() - INTERVAL '7 days', 'tok_fitnessfirst_001'),

  -- COMPLETED DEALS (paid off)
  ('a0000000-0000-4000-a000-000000000001',
   'Lucky Dragon Restaurant', 'chen@luckydragon.com', '(555) 901-2345', 'Wei Chen',
   'Restaurant', '1888 Asian District', 'Dallas', 'TX', '75207', 'US', 'active',
   '✅ RENEWAL: Paid off $75K deal (D-0009). Now on 2nd deal $100K (D-0022). Top client.',
   'luckydragonrestaurant.com', NOW() - INTERVAL '18 months', 'tok_luckydragon_001'),

  ('a0000000-0000-4000-a000-000000000001',
   'Smith Plumbing Services', 'john@smithplumbing.com', '(555) 012-3456', 'John Smith',
   'Home Services', '456 Trade Circle', 'San Antonio', 'TX', '78210', 'US', 'active',
   '✅ PAID OFF: $50,000 deal completed early! Interested in equipment financing next',
   'smithplumbingservices.com', NOW() - INTERVAL '12 months', 'tok_smithplumbing_001'),

  -- ======== NEW MERCHANTS (11-20) — Expanded portfolio ========

  -- HEALTHY (diverse geographies)
  ('a0000000-0000-4000-a000-000000000001',
   'Harbor Freight Logistics', 'rick@harborfreightlog.com', '(305) 555-1100', 'Rick Morales',
   'Transportation', '8900 NW 33rd Street', 'Miami', 'FL', '33172', 'US', 'active',
   'Regional freight company, 8 years in business. Steady contract revenue. Factor: 1.38, Daily ACH $570',
   'harborfreightlogistics.com', NOW() - INTERVAL '3 months', 'tok_harbor_001'),

  ('a0000000-0000-4000-a000-000000000001',
   'Golden Gate Nail Studio', 'linda@goldengatenails.com', '(408) 555-1200', 'Linda Tran',
   'Beauty & Personal Care', '1520 Saratoga Ave', 'San Jose', 'CA', '95129', 'US', 'active',
   'Popular nail salon, strong walk-in traffic. Factor: 1.39, Daily ACH $245',
   'goldengatenailstudio.com', NOW() - INTERVAL '3 months', 'tok_nailstudio_001'),

  -- VIP / LARGE DEALS
  ('a0000000-0000-4000-a000-000000000001',
   'BlueSky Dental Group', 'amy@blueskydental.com', '(480) 555-1300', 'Dr. Amy Fong',
   'Healthcare', '4200 E Camelback Rd', 'Phoenix', 'AZ', '85018', 'US', 'active',
   'Multi-location dental practice. Very reliable cash flow. Factor: 1.32, Daily ACH $720. VIP client.',
   'blueskydental.com', NOW() - INTERVAL '6 months', 'tok_bluesky_001'),

  ('a0000000-0000-4000-a000-000000000001',
   'Lakeside Urgent Care', 'priya@lakesideuc.com', '(312) 555-1400', 'Dr. Priya Shah',
   'Healthcare', '900 N Michigan Ave', 'Chicago', 'IL', '60611', 'US', 'active',
   'New deal — largest in portfolio at $150K. Insurance-backed revenue. Factor: 1.30, Daily ACH $870. VIP.',
   'lakesideurgentcare.com', NOW() - INTERVAL '21 days', 'tok_urgentcare_001'),

  -- NEAR PAYOFF
  ('a0000000-0000-4000-a000-000000000001',
   'Peak Performance CrossFit', 'jake@peakcrossfit.com', '(720) 555-1500', 'Jake Torres',
   'Health & Fitness', '2800 Blake St', 'Denver', 'CO', '80205', 'US', 'active',
   'About to pay off! Only ~$280 remaining. Renewal candidate. Factor: 1.36, Daily ACH $345',
   'peakperformancecrossfit.com', NOW() - INTERVAL '10 months', 'tok_crossfit_001'),

  -- AT-RISK / LATE
  ('a0000000-0000-4000-a000-000000000001',
   'Coastal Catering Co.', 'nina@coastalcatering.com', '(813) 555-1600', 'Nina Patel',
   'Food Services', '3100 W Kennedy Blvd', 'Tampa', 'FL', '33609', 'US', 'active',
   '⚠️ 2 NSFs in past month. Seasonal drop in events. Factor: 1.41, Daily ACH $325. Watching closely.',
   'coastalcatering.com', NOW() - INTERVAL '5 months', 'tok_catering_001'),

  ('a0000000-0000-4000-a000-000000000001',
   'NightOwl Printing', 'derek@nightowlprint.com', '(404) 555-1700', 'Derek Simmons',
   'Business Services', '550 Peachtree St NE', 'Atlanta', 'GA', '30308', 'US', 'active',
   '⚠️ 3 NSFs, payments stalled for 3 weeks. Claims equipment breakdown. Factor: 1.44, Daily ACH $310. On payment plan.',
   'nightowlprinting.com', NOW() - INTERVAL '5 months', 'tok_nightowl_001'),

  -- DEFAULTED
  ('a0000000-0000-4000-a000-000000000001',
   'Redrock Excavation LLC', 'troy@redrockexcavation.com', '(702) 555-1800', 'Troy Hendrix',
   'Construction', '7700 S Las Vegas Blvd', 'Las Vegas', 'NV', '89123', 'US', 'inactive',
   '🔴 DEFAULTED: 6 NSFs, payments stopped 8 months ago. $56K balance outstanding. In collections. Direct deal (no broker).',
   'redrockexcavation.com', NOW() - INTERVAL '20 months', 'tok_redrock_001'),

  -- RENEWAL CHAIN MERCHANTS
  ('a0000000-0000-4000-a000-000000000001',
   'The Bookshelf Cafe', 'emma@bookshelfcafe.com', '(503) 555-1900', 'Emma Walsh',
   'Retail', '820 NW 23rd Ave', 'Portland', 'OR', '97210', 'US', 'active',
   '✅ RENEWAL: Paid off $35K deal (D-0011). Now on 2nd deal $55K (D-0014). Great client.',
   'thebookshelfcafe.com', NOW() - INTERVAL '24 months', 'tok_bookshelf_001'),

  ('a0000000-0000-4000-a000-000000000001',
   'Cardinal Electric Co.', 'marcus@cardinalelectric.com', '(704) 555-2000', 'Marcus Webb',
   'Home Services', '1200 S Tryon St', 'Charlotte', 'NC', '28203', 'US', 'active',
   '✅ RENEWAL: Paid off $60K deal (D-0012). Now on 2nd deal $85K (D-0015). Near payoff — only $8.8K left!',
   'cardinalelectric.com', NOW() - INTERVAL '22 months', 'tok_cardinal_001')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTES FOR DEVELOPMENT
-- ============================================================================
--
-- Demo Data Summary:
-- - 20 merchants across different industries, risk profiles, and geographies
-- - 1 bank account with $847,592.45 balance
-- - 5 transaction categories for MCA operations
--
-- Merchant Categories (20 total):
-- - 3 Healthy TX (Sunrise Diner, Martinez Auto, Bella Salon)
-- - 2 Healthy national (Harbor Freight FL, Golden Gate Nail CA)
-- - 2 At-Risk (Tony's Pizzeria, Quick Print)
-- - 3 Late/High-Risk (Westside Construction, Coastal Catering, NightOwl Printing)
-- - 1 Defaulted (Redrock Excavation)
-- - 2 New (Green Thumb, Fitness First)
-- - 2 VIP/Large (BlueSky Dental, Lakeside Urgent Care)
-- - 1 Near Payoff (Peak Performance CrossFit)
-- - 2 Paid Off (Martinez Auto, Smith Plumbing)
-- - 3 Renewal Chains (Lucky Dragon 2 deals, Bookshelf Cafe 2 deals, Cardinal Electric 2 deals)
--
-- Total deals: 23 (20 merchants, 3 have 2 deals each)
--
-- Payment transactions are generated dynamically via the app or separate seed script
-- See: supabase/seed.sql for transaction seeding
