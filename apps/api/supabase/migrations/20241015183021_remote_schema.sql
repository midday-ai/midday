-- Add new columns to bank_connections table
ALTER TABLE public.bank_connections
ADD COLUMN IF NOT EXISTS error_details TEXT,
ADD COLUMN IF NOT EXISTS error_retries INTEGER,
ADD COLUMN IF NOT EXISTS last_cursor_sync TEXT;

-- Ensure 'other' category exists for each team
INSERT INTO public.transaction_categories (slug, name, team_id)
SELECT 'other', 'Other', t.id
FROM public.teams t
ON CONFLICT (slug, team_id) DO NOTHING;

-- Create or replace function to handle default categorization
CREATE OR REPLACE FUNCTION public.set_default_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_slug IS NULL OR NEW.category_slug = '' OR NEW.category_slug = 'uncategorized' THEN
    NEW.category_slug := 'other';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to apply default categorization
DROP TRIGGER IF EXISTS set_default_category_trigger ON public.transactions;
CREATE TRIGGER set_default_category_trigger
BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.set_default_category();
