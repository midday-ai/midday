-- Add customizable email content fields to invoice_templates
ALTER TABLE "public"."invoice_templates"
  ADD COLUMN "email_subject" text,
  ADD COLUMN "email_heading" text,
  ADD COLUMN "email_body" text,
  ADD COLUMN "email_button_text" text;
