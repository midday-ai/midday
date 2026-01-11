-- Migration: Add recurring invoice support
-- Enables teams to create recurring invoice series that auto-generate invoices on a schedule

-- Create frequency enum
CREATE TYPE invoice_recurring_frequency AS ENUM (
  'weekly',
  'monthly_date',
  'monthly_weekday',
  'custom'
);

-- Create end type enum
CREATE TYPE invoice_recurring_end_type AS ENUM (
  'never',
  'on_date',
  'after_count'
);

-- Create status enum
CREATE TYPE invoice_recurring_status AS ENUM (
  'active',
  'paused',
  'completed',
  'canceled'
);

-- Create invoice_recurring table
CREATE TABLE IF NOT EXISTS invoice_recurring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  -- Frequency settings
  frequency invoice_recurring_frequency NOT NULL,
  frequency_day INTEGER, -- 0-6 for weekly (day of week), 1-31 for monthly_date
  frequency_week INTEGER, -- 1-5 for monthly_weekday (e.g., 1st, 2nd Friday)
  frequency_interval INTEGER, -- For custom: every X days
  -- End conditions
  end_type invoice_recurring_end_type NOT NULL,
  end_date TIMESTAMPTZ,
  end_count INTEGER,
  -- Status tracking
  status invoice_recurring_status DEFAULT 'active' NOT NULL,
  invoices_generated INTEGER DEFAULT 0 NOT NULL,
  consecutive_failures INTEGER DEFAULT 0 NOT NULL, -- Track failures for auto-pause
  next_scheduled_at TIMESTAMPTZ,
  last_generated_at TIMESTAMPTZ,
  timezone TEXT NOT NULL,
  -- Invoice template data
  due_date_offset INTEGER DEFAULT 30 NOT NULL,
  amount NUMERIC(10, 2),
  currency TEXT,
  line_items JSONB,
  template JSONB,
  payment_details JSONB,
  from_details JSONB,
  note_details JSONB,
  customer_name TEXT,
  vat NUMERIC(10, 2),
  tax NUMERIC(10, 2),
  discount NUMERIC(10, 2),
  subtotal NUMERIC(10, 2),
  top_block JSONB,
  bottom_block JSONB,
  template_id UUID REFERENCES invoice_templates(id) ON DELETE SET NULL
);

-- Add indexes for invoice_recurring
CREATE INDEX IF NOT EXISTS invoice_recurring_team_id_idx ON invoice_recurring(team_id);
CREATE INDEX IF NOT EXISTS invoice_recurring_next_scheduled_at_idx ON invoice_recurring(next_scheduled_at);
CREATE INDEX IF NOT EXISTS invoice_recurring_status_idx ON invoice_recurring(status);
-- Compound partial index for scheduler query (WHERE status = 'active' AND next_scheduled_at <= now)
CREATE INDEX IF NOT EXISTS invoice_recurring_active_scheduled_idx ON invoice_recurring(next_scheduled_at) WHERE status = 'active';

-- Add RLS policy for invoice_recurring
ALTER TABLE invoice_recurring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoice recurring can be handled by a member of the team"
  ON invoice_recurring
  FOR ALL
  TO public
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

-- Add recurring invoice fields to invoices table
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS invoice_recurring_id UUID REFERENCES invoice_recurring(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurring_sequence INTEGER;

-- Add index for efficient recurring invoice lookups
CREATE INDEX IF NOT EXISTS invoices_invoice_recurring_id_idx ON invoices(invoice_recurring_id) WHERE invoice_recurring_id IS NOT NULL;

-- Unique constraint for idempotency (prevents duplicate invoices for same sequence)
CREATE UNIQUE INDEX IF NOT EXISTS invoices_recurring_sequence_unique_idx ON invoices(invoice_recurring_id, recurring_sequence) WHERE invoice_recurring_id IS NOT NULL;

