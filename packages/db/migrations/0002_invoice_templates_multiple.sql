-- Add new columns to invoice_templates table
ALTER TABLE "invoice_templates" 
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "user_id" uuid,
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS "note_details" jsonb;

-- Remove unique constraint on team_id to allow multiple templates per team
ALTER TABLE "invoice_templates" 
  DROP CONSTRAINT IF EXISTS "invoice_templates_team_id_key";

-- Add foreign key constraint for user_id (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoice_templates_user_id_fkey'
  ) THEN
    ALTER TABLE "invoice_templates" 
      ADD CONSTRAINT "invoice_templates_user_id_fkey" 
      FOREIGN KEY ("user_id") 
      REFERENCES "public"."users"("id") 
      ON DELETE set null 
      ON UPDATE no action;
  END IF;
END $$;

-- Migrate existing templates: set name to 'Default' and is_default to true
UPDATE "invoice_templates" 
SET 
  "name" = 'Default',
  "is_default" = true
WHERE "name" IS NULL;

-- Set name to NOT NULL after migration
ALTER TABLE "invoice_templates" 
  ALTER COLUMN "name" SET NOT NULL;

