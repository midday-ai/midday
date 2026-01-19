-- Add Stripe subscription billing fields to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Create index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS teams_stripe_customer_id_idx ON teams (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
