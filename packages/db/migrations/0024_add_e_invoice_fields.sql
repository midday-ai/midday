-- Add company address and e-invoice fields to teams
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "address_line_1" text;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "address_line_2" text;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "state" text;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "zip" text;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "vat_number" text;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "tax_id" text;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "peppol_id" text;

-- Add e-invoice tracking fields to invoices
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "e_invoice_status" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "e_invoice_silo_entry_id" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "e_invoice_job_id" text;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "e_invoice_faults" jsonb;

-- Add Peppol ID to customers
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "peppol_id" text;

-- Create e-invoice registrations table
CREATE TABLE IF NOT EXISTS "e_invoice_registrations" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "silo_entry_id" text,
  "peppol_id" text,
  "peppol_scheme" text,
  "registration_url" text,
  "faults" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "e_invoice_registrations_team_id_idx" ON "e_invoice_registrations" ("team_id");
CREATE INDEX IF NOT EXISTS "e_invoice_registrations_team_provider_idx" ON "e_invoice_registrations" ("team_id", "provider");

-- RLS policy for e_invoice_registrations
ALTER TABLE "e_invoice_registrations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "E-invoice registrations can be managed by team members"
  ON "e_invoice_registrations" FOR ALL TO PUBLIC
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
