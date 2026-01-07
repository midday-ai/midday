-- Customer Enrichment Migration
-- Adds relationship fields and AI-enriched company intelligence fields

-- ===========================================
-- CUSTOMER RELATIONSHIP FIELDS
-- ===========================================

-- Status: active, inactive, prospect, churned
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Financial defaults for invoicing
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_currency TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_payment_terms INTEGER;

-- Organization
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS external_id TEXT;

-- ===========================================
-- ENRICHMENT FIELDS (from Gemini + Grounding)
-- ===========================================

-- Visual / Brand
ALTER TABLE customers ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS brand_color TEXT;

-- Company basics
ALTER TABLE customers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_type TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS employee_count TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS founded_year INTEGER;

-- Financial intelligence
ALTER TABLE customers ADD COLUMN IF NOT EXISTS estimated_revenue TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS funding_stage TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_funding TEXT;

-- Location / Timezone
ALTER TABLE customers ADD COLUMN IF NOT EXISTS headquarters_location TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Social links
ALTER TABLE customers ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Enrichment metadata (null = not attempted, pending, processing, completed, failed)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS enrichment_status TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP WITH TIME ZONE;

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_is_archived ON customers(is_archived);
CREATE INDEX IF NOT EXISTS idx_customers_enrichment_status ON customers(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_customers_website ON customers(website) WHERE website IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry) WHERE industry IS NOT NULL;

-- ===========================================
-- SUPABASE REALTIME
-- Enable realtime for the customers table
-- ===========================================
ALTER PUBLICATION supabase_realtime ADD TABLE customers;

