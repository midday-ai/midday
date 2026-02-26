drop extension if exists "pg_net";

create extension if not exists "vector" with schema "public";

create type "public"."account_type" as enum ('depository', 'credit', 'other_asset', 'loan', 'other_liability');

create type "public"."accounting_provider" as enum ('xero', 'quickbooks', 'fortnox');

create type "public"."accounting_sync_status" as enum ('synced', 'failed', 'pending', 'partial');

create type "public"."accounting_sync_type" as enum ('auto', 'manual');

create type "public"."activity_source" as enum ('system', 'user');

create type "public"."activity_status" as enum ('unread', 'read', 'archived');

create type "public"."activity_type" as enum ('transactions_enriched', 'transactions_created', 'invoice_paid', 'inbox_new', 'inbox_auto_matched', 'inbox_needs_review', 'inbox_cross_currency_matched', 'invoice_overdue', 'invoice_sent', 'inbox_match_confirmed', 'invoice_refunded', 'recurring_series_started', 'recurring_series_completed', 'recurring_series_paused', 'recurring_invoice_upcoming', 'document_uploaded', 'document_processed', 'invoice_duplicated', 'invoice_scheduled', 'invoice_reminder_sent', 'invoice_cancelled', 'invoice_created', 'draft_invoice_created', 'tracker_entry_created', 'tracker_project_created', 'transactions_categorized', 'transactions_assigned', 'transaction_attachment_created', 'transaction_category_created', 'transactions_exported', 'customer_created');

create type "public"."bank_providers" as enum ('gocardless', 'plaid', 'teller', 'enablebanking');

create type "public"."connection_status" as enum ('disconnected', 'connected', 'unknown');

create type "public"."document_processing_status" as enum ('pending', 'processing', 'completed', 'failed');

create type "public"."inbox_account_providers" as enum ('gmail', 'outlook');

create type "public"."inbox_account_status" as enum ('connected', 'disconnected');

create type "public"."inbox_blocklist_type" as enum ('email', 'domain');

create type "public"."inbox_status" as enum ('processing', 'pending', 'archived', 'new', 'analyzing', 'suggested_match', 'no_match', 'done', 'deleted');

create type "public"."inbox_type" as enum ('invoice', 'expense');

create type "public"."invoice_delivery_type" as enum ('create', 'create_and_send', 'scheduled');

create type "public"."invoice_recurring_end_type" as enum ('never', 'on_date', 'after_count');

create type "public"."invoice_recurring_frequency" as enum ('weekly', 'biweekly', 'monthly_date', 'monthly_weekday', 'monthly_last_day', 'quarterly', 'semi_annual', 'annual', 'custom');

create type "public"."invoice_recurring_status" as enum ('active', 'paused', 'completed', 'canceled');

create type "public"."invoice_size" as enum ('a4', 'letter');

create type "public"."invoice_status" as enum ('draft', 'overdue', 'paid', 'unpaid', 'canceled', 'scheduled', 'refunded');

create type "public"."plans" as enum ('trial', 'starter', 'pro');

create type "public"."reportTypes" as enum ('profit', 'revenue', 'burn_rate', 'expense', 'monthly_revenue', 'revenue_forecast', 'runway', 'category_expenses');

create type "public"."subscription_status" as enum ('active', 'past_due');

create type "public"."teamRoles" as enum ('owner', 'member');

create type "public"."trackerStatus" as enum ('in_progress', 'completed');

create type "public"."transactionMethods" as enum ('payment', 'card_purchase', 'card_atm', 'transfer', 'other', 'unknown', 'ach', 'interest', 'deposit', 'wire', 'fee');

create type "public"."transactionStatus" as enum ('posted', 'pending', 'excluded', 'completed', 'archived', 'exported');

create type "public"."transaction_frequency" as enum ('weekly', 'biweekly', 'monthly', 'semi_monthly', 'annually', 'irregular', 'unknown');

-- Functions must be defined before tables that reference them in generated columns
set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.extract_product_names(products_json json)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result text := '';
  product json;
BEGIN
  IF products_json IS NULL THEN
    RETURN '';
  END IF;
  FOR product IN SELECT * FROM json_array_elements(products_json)
  LOOP
    IF result != '' THEN
      result := result || ' ';
    END IF;
    result := result || COALESCE(product->>'name', '');
  END LOOP;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN '';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_inbox_fts(display_name_text text, product_names text)
 RETURNS tsvector
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN to_tsvector('english', COALESCE(display_name_text, '') || ' ' || COALESCE(product_names, ''));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_id(size integer)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  characters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..size LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_inbox(size integer)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.generate_id(size);
END;
$function$
;

  create table "public"."accounting_sync_records" (
    "id" uuid not null default gen_random_uuid(),
    "transaction_id" uuid not null,
    "team_id" uuid not null,
    "provider" public.accounting_provider not null,
    "provider_tenant_id" text not null,
    "provider_transaction_id" text,
    "synced_attachment_mapping" jsonb not null default '{}'::jsonb,
    "synced_at" timestamp with time zone not null default now(),
    "sync_type" public.accounting_sync_type,
    "status" public.accounting_sync_status not null default 'synced'::public.accounting_sync_status,
    "error_message" text,
    "error_code" text,
    "provider_entity_type" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."accounting_sync_records" enable row level security;


  create table "public"."activities" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "team_id" uuid not null,
    "user_id" uuid,
    "type" public.activity_type not null,
    "priority" smallint default 5,
    "group_id" uuid,
    "source" public.activity_source not null,
    "metadata" jsonb not null,
    "status" public.activity_status not null default 'unread'::public.activity_status,
    "last_used_at" timestamp with time zone
      );


alter table "public"."activities" enable row level security;


  create table "public"."api_keys" (
    "id" uuid not null default gen_random_uuid(),
    "key_encrypted" text not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "team_id" uuid not null,
    "key_hash" text,
    "scopes" text[] not null default '{}'::text[],
    "last_used_at" timestamp with time zone
      );


alter table "public"."api_keys" enable row level security;


  create table "public"."apps" (
    "id" uuid not null default gen_random_uuid(),
    "team_id" uuid default gen_random_uuid(),
    "config" jsonb,
    "created_at" timestamp with time zone default now(),
    "app_id" text not null,
    "created_by" uuid default gen_random_uuid(),
    "settings" jsonb
      );


alter table "public"."apps" enable row level security;


  create table "public"."bank_accounts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid not null,
    "team_id" uuid not null,
    "name" text,
    "currency" text,
    "bank_connection_id" uuid,
    "enabled" boolean not null default true,
    "account_id" text not null,
    "balance" numeric(10,2) default 0,
    "manual" boolean default false,
    "type" public.account_type,
    "base_currency" text,
    "baseBalance" numeric(10,2),
    "error_details" text,
    "error_retries" smallint,
    "account_reference" text,
    "iban" text,
    "subtype" text,
    "bic" text,
    "routing_number" text,
    "wire_routing_number" text,
    "account_number" text,
    "sort_code" text,
    "availableBalance" numeric(10,2),
    "creditLimit" numeric(10,2)
      );


alter table "public"."bank_accounts" enable row level security;


  create table "public"."bank_connections" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "institution_id" text not null,
    "expires_at" timestamp with time zone,
    "team_id" uuid not null,
    "name" text not null,
    "logo_url" text,
    "access_token" text,
    "enrollment_id" text,
    "provider" public.bank_providers not null,
    "last_accessed" timestamp with time zone,
    "reference_id" text,
    "status" public.connection_status default 'connected'::public.connection_status,
    "error_details" text,
    "error_retries" smallint default '0'::smallint
      );


alter table "public"."bank_connections" enable row level security;


  create table "public"."customer_tags" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "customer_id" uuid not null,
    "team_id" uuid not null,
    "tag_id" uuid not null
      );


alter table "public"."customer_tags" enable row level security;


  create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "email" text not null,
    "billingEmail" text,
    "country" text,
    "address_line_1" text,
    "address_line_2" text,
    "city" text,
    "state" text,
    "zip" text,
    "note" text,
    "team_id" uuid not null default gen_random_uuid(),
    "website" text,
    "phone" text,
    "vat_number" text,
    "country_code" text,
    "token" text not null default ''::text,
    "contact" text,
    "status" text default 'active'::text,
    "preferred_currency" text,
    "default_payment_terms" integer,
    "is_archived" boolean default false,
    "source" text default 'manual'::text,
    "external_id" text,
    "logo_url" text,
    "description" text,
    "industry" text,
    "company_type" text,
    "employee_count" text,
    "founded_year" integer,
    "estimated_revenue" text,
    "funding_stage" text,
    "total_funding" text,
    "headquarters_location" text,
    "timezone" text,
    "linkedin_url" text,
    "twitter_url" text,
    "instagram_url" text,
    "facebook_url" text,
    "ceo_name" text,
    "finance_contact" text,
    "finance_contact_email" text,
    "primary_language" text,
    "fiscal_year_end" text,
    "enrichment_status" text,
    "enriched_at" timestamp with time zone,
    "portal_enabled" boolean default false,
    "portal_id" text,
    "fts" tsvector not null generated always as (to_tsvector('english'::regconfig, ((((((((((((((((((COALESCE(name, ''::text) || ' '::text) || COALESCE(contact, ''::text)) || ' '::text) || COALESCE(phone, ''::text)) || ' '::text) || COALESCE(email, ''::text)) || ' '::text) || COALESCE(address_line_1, ''::text)) || ' '::text) || COALESCE(address_line_2, ''::text)) || ' '::text) || COALESCE(city, ''::text)) || ' '::text) || COALESCE(state, ''::text)) || ' '::text) || COALESCE(zip, ''::text)) || ' '::text) || COALESCE(country, ''::text)))) stored
      );


alter table "public"."customers" enable row level security;


  create table "public"."document_tag_assignments" (
    "document_id" uuid not null,
    "tag_id" uuid not null,
    "team_id" uuid not null
      );


alter table "public"."document_tag_assignments" enable row level security;


  create table "public"."document_tag_embeddings" (
    "slug" text not null,
    "embedding" public.vector(768),
    "name" text not null,
    "model" text not null default 'gemini-embedding-001'::text
      );


alter table "public"."document_tag_embeddings" enable row level security;


  create table "public"."document_tags" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "slug" text not null,
    "team_id" uuid not null
      );


alter table "public"."document_tags" enable row level security;


  create table "public"."documents" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "created_at" timestamp with time zone default now(),
    "metadata" jsonb,
    "path_tokens" text[],
    "team_id" uuid,
    "parent_id" text,
    "object_id" uuid,
    "owner_id" uuid,
    "tag" text,
    "title" text,
    "body" text,
    "fts" tsvector not null generated always as (to_tsvector('english'::regconfig, ((title || ' '::text) || body))) stored,
    "summary" text,
    "content" text,
    "date" date,
    "language" text,
    "processing_status" public.document_processing_status default 'pending'::public.document_processing_status,
    "fts_simple" tsvector,
    "fts_english" tsvector,
    "fts_language" tsvector
      );


alter table "public"."documents" enable row level security;


  create table "public"."exchange_rates" (
    "id" uuid not null default gen_random_uuid(),
    "base" text,
    "rate" numeric(10,2),
    "target" text,
    "updated_at" timestamp with time zone
      );


alter table "public"."exchange_rates" enable row level security;


  create table "public"."inbox" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "team_id" uuid,
    "file_path" text[],
    "file_name" text,
    "transaction_id" uuid,
    "amount" numeric(10,2),
    "currency" text,
    "content_type" text,
    "size" bigint,
    "attachment_id" uuid,
    "date" date,
    "forwarded_to" text,
    "reference_id" text,
    "meta" json,
    "status" public.inbox_status default 'new'::public.inbox_status,
    "website" text,
    "sender_email" text,
    "display_name" text,
    "fts" tsvector not null generated always as (public.generate_inbox_fts(display_name, public.extract_product_names((meta -> 'products'::text)))) stored,
    "type" public.inbox_type,
    "description" text,
    "base_amount" numeric(10,2),
    "base_currency" text,
    "tax_amount" numeric(10,2),
    "tax_rate" numeric(10,2),
    "tax_type" text,
    "inbox_account_id" uuid,
    "invoice_number" text,
    "grouped_inbox_id" uuid
      );


alter table "public"."inbox" enable row level security;


  create table "public"."inbox_accounts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "email" text not null,
    "access_token" text not null,
    "refresh_token" text not null,
    "team_id" uuid not null,
    "last_accessed" timestamp with time zone not null,
    "provider" public.inbox_account_providers not null,
    "external_id" text not null,
    "expiry_date" timestamp with time zone not null,
    "schedule_id" text,
    "status" public.inbox_account_status not null default 'connected'::public.inbox_account_status,
    "error_message" text
      );


alter table "public"."inbox_accounts" enable row level security;


  create table "public"."inbox_blocklist" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "team_id" uuid not null,
    "type" public.inbox_blocklist_type not null,
    "value" text not null
      );


alter table "public"."inbox_blocklist" enable row level security;


  create table "public"."inbox_embeddings" (
    "id" uuid not null default gen_random_uuid(),
    "inbox_id" uuid not null,
    "team_id" uuid not null,
    "embedding" public.vector(768),
    "source_text" text not null,
    "created_at" timestamp with time zone not null default now(),
    "model" text not null default 'gemini-embedding-001'::text
      );


alter table "public"."inbox_embeddings" enable row level security;


  create table "public"."invoice_comments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."invoice_comments" enable row level security;


  create table "public"."invoice_products" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now(),
    "team_id" uuid not null,
    "created_by" uuid,
    "name" text not null,
    "description" text,
    "price" numeric(10,2),
    "currency" text,
    "unit" text,
    "tax_rate" numeric(10,2),
    "isActive" boolean not null default true,
    "usage_count" integer not null default 0,
    "last_used_at" timestamp with time zone,
    "fts" tsvector not null generated always as (to_tsvector('english'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)))) stored
      );


alter table "public"."invoice_products" enable row level security;


  create table "public"."invoice_recurring" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now(),
    "team_id" uuid not null,
    "user_id" uuid not null,
    "customer_id" uuid,
    "frequency" public.invoice_recurring_frequency not null,
    "frequency_day" integer,
    "frequency_week" integer,
    "frequency_interval" integer,
    "end_type" public.invoice_recurring_end_type not null,
    "end_date" timestamp with time zone,
    "end_count" integer,
    "status" public.invoice_recurring_status not null default 'active'::public.invoice_recurring_status,
    "invoices_generated" integer not null default 0,
    "consecutive_failures" integer not null default 0,
    "next_scheduled_at" timestamp with time zone,
    "last_generated_at" timestamp with time zone,
    "timezone" text not null,
    "due_date_offset" integer not null default 30,
    "amount" numeric(10,2),
    "currency" text,
    "line_items" jsonb,
    "template" jsonb,
    "payment_details" jsonb,
    "from_details" jsonb,
    "note_details" jsonb,
    "customer_name" text,
    "vat" numeric(10,2),
    "tax" numeric(10,2),
    "discount" numeric(10,2),
    "subtotal" numeric(10,2),
    "top_block" jsonb,
    "bottom_block" jsonb,
    "template_id" uuid,
    "upcoming_notification_sent_at" timestamp with time zone
      );


alter table "public"."invoice_recurring" enable row level security;


  create table "public"."invoice_templates" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "team_id" uuid not null,
    "name" text not null default 'Default'::text,
    "is_default" boolean default false,
    "customer_label" text,
    "from_label" text,
    "invoice_no_label" text,
    "issue_date_label" text,
    "due_date_label" text,
    "description_label" text,
    "price_label" text,
    "quantity_label" text,
    "total_label" text,
    "vat_label" text,
    "tax_label" text,
    "payment_label" text,
    "note_label" text,
    "logo_url" text,
    "currency" text,
    "payment_details" jsonb,
    "from_details" jsonb,
    "note_details" jsonb,
    "size" public.invoice_size default 'a4'::public.invoice_size,
    "date_format" text,
    "include_vat" boolean,
    "include_tax" boolean,
    "tax_rate" numeric(10,2),
    "delivery_type" public.invoice_delivery_type not null default 'create'::public.invoice_delivery_type,
    "discount_label" text,
    "include_discount" boolean,
    "include_decimals" boolean,
    "include_qr" boolean,
    "total_summary_label" text,
    "title" text,
    "vat_rate" numeric(10,2),
    "include_units" boolean,
    "subtotal_label" text,
    "include_pdf" boolean,
    "send_copy" boolean,
    "include_line_item_tax" boolean default false,
    "line_item_tax_label" text,
    "payment_enabled" boolean default false,
    "payment_terms_days" integer default 30
      );


alter table "public"."invoice_templates" enable row level security;


  create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now(),
    "due_date" timestamp with time zone,
    "invoice_number" text,
    "customer_id" uuid,
    "amount" numeric(10,2),
    "currency" text,
    "line_items" jsonb,
    "payment_details" jsonb,
    "customer_details" jsonb,
    "company_datails" jsonb,
    "note" text,
    "internal_note" text,
    "team_id" uuid not null,
    "paid_at" timestamp with time zone,
    "fts" tsvector not null generated always as (to_tsvector('english'::regconfig, ((COALESCE((amount)::text, ''::text) || ' '::text) || COALESCE(invoice_number, ''::text)))) stored,
    "vat" numeric(10,2),
    "tax" numeric(10,2),
    "url" text,
    "file_path" text[],
    "status" public.invoice_status not null default 'draft'::public.invoice_status,
    "viewed_at" timestamp with time zone,
    "from_details" jsonb,
    "issue_date" timestamp with time zone,
    "template" jsonb,
    "note_details" jsonb,
    "customer_name" text,
    "token" text not null default ''::text,
    "sent_to" text,
    "reminder_sent_at" timestamp with time zone,
    "discount" numeric(10,2),
    "file_size" bigint,
    "user_id" uuid,
    "subtotal" numeric(10,2),
    "top_block" jsonb,
    "bottom_block" jsonb,
    "sent_at" timestamp with time zone,
    "scheduled_at" timestamp with time zone,
    "scheduled_job_id" text,
    "template_id" uuid,
    "payment_intent_id" text,
    "refunded_at" timestamp with time zone,
    "invoice_recurring_id" uuid,
    "recurring_sequence" integer
      );


alter table "public"."invoices" enable row level security;


  create table "public"."notification_settings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "team_id" uuid not null,
    "notification_type" text not null,
    "channel" text not null,
    "enabled" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."notification_settings" enable row level security;


  create table "public"."oauth_access_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "token" text not null,
    "refresh_token" text,
    "application_id" uuid not null,
    "user_id" uuid not null,
    "team_id" uuid not null,
    "scopes" text[] not null,
    "expires_at" timestamp with time zone not null,
    "refresh_token_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "last_used_at" timestamp with time zone,
    "revoked" boolean default false,
    "revoked_at" timestamp with time zone
      );


alter table "public"."oauth_access_tokens" enable row level security;


  create table "public"."oauth_applications" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "overview" text,
    "developer_name" text,
    "logo_url" text,
    "website" text,
    "install_url" text,
    "screenshots" text[] default '{}'::text[],
    "redirect_uris" text[] not null,
    "client_id" text not null,
    "client_secret" text not null,
    "scopes" text[] not null default '{}'::text[],
    "team_id" uuid not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "is_public" boolean default false,
    "active" boolean default true,
    "status" text default 'draft'::text
      );


alter table "public"."oauth_applications" enable row level security;


  create table "public"."oauth_authorization_codes" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "application_id" uuid not null,
    "user_id" uuid not null,
    "team_id" uuid not null,
    "scopes" text[] not null,
    "redirect_uri" text not null,
    "expires_at" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now(),
    "used" boolean default false,
    "code_challenge" text,
    "code_challenge_method" text
      );


alter table "public"."oauth_authorization_codes" enable row level security;


  create table "public"."reports" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "link_id" text,
    "team_id" uuid,
    "short_link" text,
    "from" timestamp with time zone,
    "to" timestamp with time zone,
    "type" public."reportTypes",
    "expire_at" timestamp with time zone,
    "currency" text,
    "created_by" uuid
      );


alter table "public"."reports" enable row level security;


  create table "public"."short_links" (
    "id" uuid not null default gen_random_uuid(),
    "short_id" text not null,
    "url" text not null,
    "type" text,
    "size" numeric(10,2),
    "mime_type" text,
    "file_name" text,
    "team_id" uuid not null,
    "user_id" uuid not null,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."short_links" enable row level security;


  create table "public"."tags" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "team_id" uuid not null,
    "name" text not null
      );


alter table "public"."tags" enable row level security;


  create table "public"."teams" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "logo_url" text,
    "inbox_id" text default 'generate_inbox(10)'::text,
    "email" text,
    "inbox_email" text,
    "inbox_forwarding" boolean default true,
    "base_currency" text,
    "country_code" text,
    "fiscal_year_start_month" smallint,
    "document_classification" boolean default false,
    "flags" text[],
    "canceled_at" timestamp with time zone,
    "plan" public.plans not null default 'trial'::public.plans,
    "subscription_status" public.subscription_status,
    "export_settings" jsonb,
    "stripe_account_id" text,
    "stripe_connect_status" text,
    "stripe_customer_id" text,
    "stripe_subscription_id" text,
    "stripe_price_id" text
      );


alter table "public"."teams" enable row level security;


  create table "public"."tracker_entries" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "duration" bigint,
    "project_id" uuid,
    "start" timestamp with time zone,
    "stop" timestamp with time zone,
    "assigned_id" uuid,
    "team_id" uuid,
    "description" text,
    "rate" numeric(10,2),
    "currency" text,
    "billed" boolean default false,
    "date" date default now()
      );


alter table "public"."tracker_entries" enable row level security;


  create table "public"."tracker_project_tags" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "tracker_project_id" uuid not null,
    "tag_id" uuid not null,
    "team_id" uuid not null
      );


alter table "public"."tracker_project_tags" enable row level security;


  create table "public"."tracker_projects" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "team_id" uuid,
    "rate" numeric(10,2),
    "currency" text,
    "status" public."trackerStatus" not null default 'in_progress'::public."trackerStatus",
    "description" text,
    "name" text not null,
    "billable" boolean default false,
    "estimate" bigint,
    "customer_id" uuid,
    "fts" tsvector not null generated always as (to_tsvector('english'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)))) stored
      );


alter table "public"."tracker_projects" enable row level security;


  create table "public"."tracker_reports" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "link_id" text,
    "short_link" text,
    "team_id" uuid default gen_random_uuid(),
    "project_id" uuid default gen_random_uuid(),
    "created_by" uuid
      );


alter table "public"."tracker_reports" enable row level security;


  create table "public"."transaction_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "type" text,
    "transaction_id" uuid,
    "team_id" uuid,
    "size" bigint,
    "name" text,
    "path" text[]
      );


alter table "public"."transaction_attachments" enable row level security;


  create table "public"."transaction_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "team_id" uuid not null,
    "color" text,
    "created_at" timestamp with time zone default now(),
    "system" boolean default false,
    "slug" text not null,
    "tax_rate" numeric(10,2),
    "tax_type" text,
    "tax_reporting_code" text,
    "excluded" boolean default false,
    "description" text,
    "parent_id" uuid
      );


alter table "public"."transaction_categories" enable row level security;


  create table "public"."transaction_category_embeddings" (
    "name" text not null,
    "embedding" public.vector(768),
    "model" text not null default 'gemini-embedding-001'::text,
    "system" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."transaction_category_embeddings" enable row level security;


  create table "public"."transaction_embeddings" (
    "id" uuid not null default gen_random_uuid(),
    "transaction_id" uuid not null,
    "team_id" uuid not null,
    "embedding" public.vector(768),
    "source_text" text not null,
    "created_at" timestamp with time zone not null default now(),
    "model" text not null default 'gemini-embedding-001'::text
      );


alter table "public"."transaction_embeddings" enable row level security;


  create table "public"."transaction_enrichments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "team_id" uuid,
    "category_slug" text,
    "system" boolean default false
      );


alter table "public"."transaction_enrichments" enable row level security;


  create table "public"."transaction_match_suggestions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "team_id" uuid not null,
    "inbox_id" uuid not null,
    "transaction_id" uuid not null,
    "confidence_score" numeric(4,3) not null,
    "amount_score" numeric(4,3),
    "currency_score" numeric(4,3),
    "date_score" numeric(4,3),
    "embedding_score" numeric(4,3),
    "name_score" numeric(4,3),
    "match_type" text not null,
    "match_details" jsonb,
    "status" text not null default 'pending'::text,
    "user_action_at" timestamp with time zone,
    "user_id" uuid
      );


alter table "public"."transaction_match_suggestions" enable row level security;


  create table "public"."transaction_tags" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "team_id" uuid not null,
    "tag_id" uuid not null,
    "transaction_id" uuid not null
      );


alter table "public"."transaction_tags" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "date" date not null,
    "name" text not null,
    "method" public."transactionMethods" not null,
    "amount" numeric(10,2) not null,
    "currency" text not null,
    "team_id" uuid not null,
    "assigned_id" uuid,
    "note" character varying,
    "bank_account_id" uuid,
    "internal_id" text not null,
    "status" public."transactionStatus" default 'posted'::public."transactionStatus",
    "balance" numeric(10,2),
    "manual" boolean default false,
    "notified" boolean default false,
    "internal" boolean default false,
    "description" text,
    "category_slug" text,
    "baseAmount" numeric(10,2),
    "counterparty_name" text,
    "base_currency" text,
    "tax_amount" numeric(10,2),
    "tax_rate" numeric(10,2),
    "tax_type" text,
    "recurring" boolean,
    "frequency" public.transaction_frequency,
    "merchant_name" text,
    "enrichment_completed" boolean default false,
    "fts_vector" tsvector not null generated always as (to_tsvector('english'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)))) stored
      );


alter table "public"."transactions" enable row level security;


  create table "public"."user_invites" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "team_id" uuid,
    "email" text,
    "role" public."teamRoles",
    "code" text default 'nanoid(24)'::text,
    "invited_by" uuid
      );


alter table "public"."user_invites" enable row level security;


  create table "public"."users" (
    "id" uuid not null,
    "full_name" text,
    "avatar_url" text,
    "email" text,
    "team_id" uuid,
    "created_at" timestamp with time zone default now(),
    "locale" text default 'en'::text,
    "week_starts_on_monday" boolean default false,
    "timezone" text,
    "timezone_auto_sync" boolean default true,
    "time_format" numeric default 24,
    "date_format" text
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX accounting_sync_records_pkey ON public.accounting_sync_records USING btree (id);

CREATE UNIQUE INDEX accounting_sync_records_transaction_provider_key ON public.accounting_sync_records USING btree (transaction_id, provider);

CREATE UNIQUE INDEX activities_pkey ON public.activities USING btree (id);

CREATE UNIQUE INDEX api_keys_key_unique ON public.api_keys USING btree (key_hash);

CREATE UNIQUE INDEX api_keys_pkey ON public.api_keys USING btree (id);

CREATE UNIQUE INDEX apps_pkey ON public.apps USING btree (id);

CREATE UNIQUE INDEX bank_accounts_pkey ON public.bank_accounts USING btree (id);

CREATE UNIQUE INDEX bank_connections_pkey ON public.bank_connections USING btree (id);

CREATE UNIQUE INDEX customer_tags_pkey ON public.customer_tags USING btree (id);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX document_tag_assignments_pkey ON public.document_tag_assignments USING btree (document_id, tag_id);

CREATE UNIQUE INDEX document_tag_embeddings_pkey ON public.document_tag_embeddings USING btree (slug);

CREATE UNIQUE INDEX document_tags_pkey ON public.document_tags USING btree (id);

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX exchange_rates_pkey ON public.exchange_rates USING btree (id);

CREATE UNIQUE INDEX inbox_accounts_email_key ON public.inbox_accounts USING btree (email);

CREATE UNIQUE INDEX inbox_accounts_external_id_key ON public.inbox_accounts USING btree (external_id);

CREATE UNIQUE INDEX inbox_accounts_pkey ON public.inbox_accounts USING btree (id);

CREATE UNIQUE INDEX inbox_blocklist_pkey ON public.inbox_blocklist USING btree (id);

CREATE UNIQUE INDEX inbox_blocklist_team_id_type_value_key ON public.inbox_blocklist USING btree (team_id, type, value);

CREATE UNIQUE INDEX inbox_embeddings_pkey ON public.inbox_embeddings USING btree (id);

CREATE UNIQUE INDEX inbox_embeddings_unique ON public.inbox_embeddings USING btree (inbox_id);

CREATE UNIQUE INDEX inbox_pkey ON public.inbox USING btree (id);

CREATE UNIQUE INDEX inbox_reference_id_key ON public.inbox USING btree (reference_id);

CREATE UNIQUE INDEX invoice_comments_pkey ON public.invoice_comments USING btree (id);

CREATE UNIQUE INDEX invoice_products_pkey ON public.invoice_products USING btree (id);

CREATE UNIQUE INDEX invoice_products_team_name_currency_price_unique ON public.invoice_products USING btree (team_id, name, currency, price);

CREATE UNIQUE INDEX invoice_recurring_pkey ON public.invoice_recurring USING btree (id);

CREATE UNIQUE INDEX invoice_templates_pkey ON public.invoice_templates USING btree (id);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX invoices_scheduled_job_id_key ON public.invoices USING btree (scheduled_job_id);

CREATE UNIQUE INDEX notification_settings_pkey ON public.notification_settings USING btree (id);

CREATE UNIQUE INDEX notification_settings_user_team_type_channel_key ON public.notification_settings USING btree (user_id, team_id, notification_type, channel);

CREATE UNIQUE INDEX oauth_access_tokens_pkey ON public.oauth_access_tokens USING btree (id);

CREATE UNIQUE INDEX oauth_access_tokens_refresh_token_unique ON public.oauth_access_tokens USING btree (refresh_token);

CREATE UNIQUE INDEX oauth_access_tokens_token_unique ON public.oauth_access_tokens USING btree (token);

CREATE UNIQUE INDEX oauth_applications_client_id_unique ON public.oauth_applications USING btree (client_id);

CREATE UNIQUE INDEX oauth_applications_pkey ON public.oauth_applications USING btree (id);

CREATE UNIQUE INDEX oauth_applications_slug_unique ON public.oauth_applications USING btree (slug);

CREATE UNIQUE INDEX oauth_authorization_codes_code_unique ON public.oauth_authorization_codes USING btree (code);

CREATE UNIQUE INDEX oauth_authorization_codes_pkey ON public.oauth_authorization_codes USING btree (id);

CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id);

CREATE UNIQUE INDEX short_links_pkey ON public.short_links USING btree (id);

CREATE UNIQUE INDEX short_links_short_id_unique ON public.short_links USING btree (short_id);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX teams_inbox_id_key ON public.teams USING btree (inbox_id);

CREATE UNIQUE INDEX teams_pkey ON public.teams USING btree (id);

CREATE UNIQUE INDEX tracker_entries_pkey ON public.tracker_entries USING btree (id);

CREATE UNIQUE INDEX tracker_project_tags_pkey ON public.tracker_project_tags USING btree (id);

CREATE UNIQUE INDEX tracker_projects_pkey ON public.tracker_projects USING btree (id);

CREATE UNIQUE INDEX tracker_reports_pkey ON public.tracker_reports USING btree (id);

CREATE UNIQUE INDEX transaction_attachments_pkey ON public.transaction_attachments USING btree (id);

CREATE UNIQUE INDEX transaction_categories_pkey ON public.transaction_categories USING btree (team_id, slug);

CREATE UNIQUE INDEX transaction_category_embeddings_pkey ON public.transaction_category_embeddings USING btree (name);

CREATE UNIQUE INDEX transaction_embeddings_pkey ON public.transaction_embeddings USING btree (id);

CREATE UNIQUE INDEX transaction_embeddings_unique ON public.transaction_embeddings USING btree (transaction_id);

CREATE UNIQUE INDEX transaction_enrichments_pkey ON public.transaction_enrichments USING btree (id);

CREATE UNIQUE INDEX transaction_match_suggestions_pkey ON public.transaction_match_suggestions USING btree (id);

CREATE UNIQUE INDEX transaction_match_suggestions_unique ON public.transaction_match_suggestions USING btree (inbox_id, transaction_id);

CREATE UNIQUE INDEX transaction_tags_pkey ON public.transaction_tags USING btree (id);

CREATE UNIQUE INDEX transactions_internal_id_key ON public.transactions USING btree (internal_id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX unique_app_id_team_id ON public.apps USING btree (team_id, app_id);

CREATE UNIQUE INDEX unique_bank_connections ON public.bank_connections USING btree (institution_id, team_id);

CREATE UNIQUE INDEX unique_customer_tag ON public.customer_tags USING btree (customer_id, tag_id);

CREATE UNIQUE INDEX unique_project_tag ON public.tracker_project_tags USING btree (tracker_project_id, tag_id);

CREATE UNIQUE INDEX unique_rate ON public.exchange_rates USING btree (base, target);

CREATE UNIQUE INDEX unique_slug_per_team ON public.document_tags USING btree (slug, team_id);

CREATE UNIQUE INDEX unique_tag ON public.transaction_tags USING btree (tag_id, transaction_id);

CREATE UNIQUE INDEX unique_tag_name ON public.tags USING btree (team_id, name);

CREATE UNIQUE INDEX unique_team_invite ON public.user_invites USING btree (team_id, email);

CREATE UNIQUE INDEX unique_team_name ON public.transaction_enrichments USING btree (name, team_id);

CREATE UNIQUE INDEX user_invites_code_key ON public.user_invites USING btree (code);

CREATE UNIQUE INDEX user_invites_pkey ON public.user_invites USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."accounting_sync_records" add constraint "accounting_sync_records_pkey" PRIMARY KEY using index "accounting_sync_records_pkey";

alter table "public"."activities" add constraint "activities_pkey" PRIMARY KEY using index "activities_pkey";

alter table "public"."api_keys" add constraint "api_keys_pkey" PRIMARY KEY using index "api_keys_pkey";

alter table "public"."apps" add constraint "apps_pkey" PRIMARY KEY using index "apps_pkey";

alter table "public"."bank_accounts" add constraint "bank_accounts_pkey" PRIMARY KEY using index "bank_accounts_pkey";

alter table "public"."bank_connections" add constraint "bank_connections_pkey" PRIMARY KEY using index "bank_connections_pkey";

alter table "public"."customer_tags" add constraint "customer_tags_pkey" PRIMARY KEY using index "customer_tags_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."document_tag_assignments" add constraint "document_tag_assignments_pkey" PRIMARY KEY using index "document_tag_assignments_pkey";

alter table "public"."document_tag_embeddings" add constraint "document_tag_embeddings_pkey" PRIMARY KEY using index "document_tag_embeddings_pkey";

alter table "public"."document_tags" add constraint "document_tags_pkey" PRIMARY KEY using index "document_tags_pkey";

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."exchange_rates" add constraint "exchange_rates_pkey" PRIMARY KEY using index "exchange_rates_pkey";

alter table "public"."inbox" add constraint "inbox_pkey" PRIMARY KEY using index "inbox_pkey";

alter table "public"."inbox_accounts" add constraint "inbox_accounts_pkey" PRIMARY KEY using index "inbox_accounts_pkey";

alter table "public"."inbox_blocklist" add constraint "inbox_blocklist_pkey" PRIMARY KEY using index "inbox_blocklist_pkey";

alter table "public"."inbox_embeddings" add constraint "inbox_embeddings_pkey" PRIMARY KEY using index "inbox_embeddings_pkey";

alter table "public"."invoice_comments" add constraint "invoice_comments_pkey" PRIMARY KEY using index "invoice_comments_pkey";

alter table "public"."invoice_products" add constraint "invoice_products_pkey" PRIMARY KEY using index "invoice_products_pkey";

alter table "public"."invoice_recurring" add constraint "invoice_recurring_pkey" PRIMARY KEY using index "invoice_recurring_pkey";

alter table "public"."invoice_templates" add constraint "invoice_templates_pkey" PRIMARY KEY using index "invoice_templates_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."notification_settings" add constraint "notification_settings_pkey" PRIMARY KEY using index "notification_settings_pkey";

alter table "public"."oauth_access_tokens" add constraint "oauth_access_tokens_pkey" PRIMARY KEY using index "oauth_access_tokens_pkey";

alter table "public"."oauth_applications" add constraint "oauth_applications_pkey" PRIMARY KEY using index "oauth_applications_pkey";

alter table "public"."oauth_authorization_codes" add constraint "oauth_authorization_codes_pkey" PRIMARY KEY using index "oauth_authorization_codes_pkey";

alter table "public"."reports" add constraint "reports_pkey" PRIMARY KEY using index "reports_pkey";

alter table "public"."short_links" add constraint "short_links_pkey" PRIMARY KEY using index "short_links_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."teams" add constraint "teams_pkey" PRIMARY KEY using index "teams_pkey";

alter table "public"."tracker_entries" add constraint "tracker_entries_pkey" PRIMARY KEY using index "tracker_entries_pkey";

alter table "public"."tracker_project_tags" add constraint "tracker_project_tags_pkey" PRIMARY KEY using index "tracker_project_tags_pkey";

alter table "public"."tracker_projects" add constraint "tracker_projects_pkey" PRIMARY KEY using index "tracker_projects_pkey";

alter table "public"."tracker_reports" add constraint "tracker_reports_pkey" PRIMARY KEY using index "tracker_reports_pkey";

alter table "public"."transaction_attachments" add constraint "transaction_attachments_pkey" PRIMARY KEY using index "transaction_attachments_pkey";

alter table "public"."transaction_categories" add constraint "transaction_categories_pkey" PRIMARY KEY using index "transaction_categories_pkey";

alter table "public"."transaction_category_embeddings" add constraint "transaction_category_embeddings_pkey" PRIMARY KEY using index "transaction_category_embeddings_pkey";

alter table "public"."transaction_embeddings" add constraint "transaction_embeddings_pkey" PRIMARY KEY using index "transaction_embeddings_pkey";

alter table "public"."transaction_enrichments" add constraint "transaction_enrichments_pkey" PRIMARY KEY using index "transaction_enrichments_pkey";

alter table "public"."transaction_match_suggestions" add constraint "transaction_match_suggestions_pkey" PRIMARY KEY using index "transaction_match_suggestions_pkey";

alter table "public"."transaction_tags" add constraint "transaction_tags_pkey" PRIMARY KEY using index "transaction_tags_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."user_invites" add constraint "user_invites_pkey" PRIMARY KEY using index "user_invites_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."accounting_sync_records" add constraint "accounting_sync_records_transaction_provider_key" UNIQUE using index "accounting_sync_records_transaction_provider_key";

alter table "public"."api_keys" add constraint "api_keys_key_unique" UNIQUE using index "api_keys_key_unique";

alter table "public"."apps" add constraint "unique_app_id_team_id" UNIQUE using index "unique_app_id_team_id";

alter table "public"."bank_connections" add constraint "unique_bank_connections" UNIQUE using index "unique_bank_connections";

alter table "public"."customer_tags" add constraint "unique_customer_tag" UNIQUE using index "unique_customer_tag";

alter table "public"."document_tags" add constraint "unique_slug_per_team" UNIQUE using index "unique_slug_per_team";

alter table "public"."exchange_rates" add constraint "unique_rate" UNIQUE using index "unique_rate";

alter table "public"."inbox" add constraint "inbox_reference_id_key" UNIQUE using index "inbox_reference_id_key";

alter table "public"."inbox_accounts" add constraint "inbox_accounts_email_key" UNIQUE using index "inbox_accounts_email_key";

alter table "public"."inbox_accounts" add constraint "inbox_accounts_external_id_key" UNIQUE using index "inbox_accounts_external_id_key";

alter table "public"."inbox_blocklist" add constraint "inbox_blocklist_team_id_type_value_key" UNIQUE using index "inbox_blocklist_team_id_type_value_key";

alter table "public"."inbox_embeddings" add constraint "inbox_embeddings_unique" UNIQUE using index "inbox_embeddings_unique";

alter table "public"."invoice_products" add constraint "invoice_products_team_name_currency_price_unique" UNIQUE using index "invoice_products_team_name_currency_price_unique";

alter table "public"."invoices" add constraint "invoices_scheduled_job_id_key" UNIQUE using index "invoices_scheduled_job_id_key";

alter table "public"."notification_settings" add constraint "notification_settings_user_team_type_channel_key" UNIQUE using index "notification_settings_user_team_type_channel_key";

alter table "public"."oauth_access_tokens" add constraint "oauth_access_tokens_refresh_token_unique" UNIQUE using index "oauth_access_tokens_refresh_token_unique";

alter table "public"."oauth_access_tokens" add constraint "oauth_access_tokens_token_unique" UNIQUE using index "oauth_access_tokens_token_unique";

alter table "public"."oauth_applications" add constraint "oauth_applications_client_id_unique" UNIQUE using index "oauth_applications_client_id_unique";

alter table "public"."oauth_applications" add constraint "oauth_applications_slug_unique" UNIQUE using index "oauth_applications_slug_unique";

alter table "public"."oauth_authorization_codes" add constraint "oauth_authorization_codes_code_unique" UNIQUE using index "oauth_authorization_codes_code_unique";

alter table "public"."short_links" add constraint "short_links_short_id_unique" UNIQUE using index "short_links_short_id_unique";

alter table "public"."tags" add constraint "unique_tag_name" UNIQUE using index "unique_tag_name";

alter table "public"."teams" add constraint "teams_inbox_id_key" UNIQUE using index "teams_inbox_id_key";

alter table "public"."tracker_project_tags" add constraint "unique_project_tag" UNIQUE using index "unique_project_tag";

alter table "public"."transaction_embeddings" add constraint "transaction_embeddings_unique" UNIQUE using index "transaction_embeddings_unique";

alter table "public"."transaction_enrichments" add constraint "unique_team_name" UNIQUE using index "unique_team_name";

alter table "public"."transaction_match_suggestions" add constraint "transaction_match_suggestions_unique" UNIQUE using index "transaction_match_suggestions_unique";

alter table "public"."transaction_tags" add constraint "unique_tag" UNIQUE using index "unique_tag";

alter table "public"."transactions" add constraint "transactions_internal_id_key" UNIQUE using index "transactions_internal_id_key";

alter table "public"."user_invites" add constraint "unique_team_invite" UNIQUE using index "unique_team_invite";

alter table "public"."user_invites" add constraint "user_invites_code_key" UNIQUE using index "user_invites_code_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.extract_product_names(products_json json)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result text := '';
  product json;
BEGIN
  IF products_json IS NULL THEN
    RETURN '';
  END IF;
  FOR product IN SELECT * FROM json_array_elements(products_json)
  LOOP
    IF result != '' THEN
      result := result || ' ';
    END IF;
    result := result || COALESCE(product->>'name', '');
  END LOOP;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN '';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_id(size integer)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  characters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..size LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_inbox(size integer)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.generate_id(size);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_inbox_fts(display_name_text text, product_names text)
 RETURNS tsvector
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN to_tsvector('english', COALESCE(display_name_text, '') || ' ' || COALESCE(product_names, ''));
END;
$function$
;

grant delete on table "public"."accounting_sync_records" to "anon";

grant insert on table "public"."accounting_sync_records" to "anon";

grant references on table "public"."accounting_sync_records" to "anon";

grant select on table "public"."accounting_sync_records" to "anon";

grant trigger on table "public"."accounting_sync_records" to "anon";

grant truncate on table "public"."accounting_sync_records" to "anon";

grant update on table "public"."accounting_sync_records" to "anon";

grant delete on table "public"."accounting_sync_records" to "authenticated";

grant insert on table "public"."accounting_sync_records" to "authenticated";

grant references on table "public"."accounting_sync_records" to "authenticated";

grant select on table "public"."accounting_sync_records" to "authenticated";

grant trigger on table "public"."accounting_sync_records" to "authenticated";

grant truncate on table "public"."accounting_sync_records" to "authenticated";

grant update on table "public"."accounting_sync_records" to "authenticated";

grant delete on table "public"."accounting_sync_records" to "service_role";

grant insert on table "public"."accounting_sync_records" to "service_role";

grant references on table "public"."accounting_sync_records" to "service_role";

grant select on table "public"."accounting_sync_records" to "service_role";

grant trigger on table "public"."accounting_sync_records" to "service_role";

grant truncate on table "public"."accounting_sync_records" to "service_role";

grant update on table "public"."accounting_sync_records" to "service_role";

grant delete on table "public"."activities" to "anon";

grant insert on table "public"."activities" to "anon";

grant references on table "public"."activities" to "anon";

grant select on table "public"."activities" to "anon";

grant trigger on table "public"."activities" to "anon";

grant truncate on table "public"."activities" to "anon";

grant update on table "public"."activities" to "anon";

grant delete on table "public"."activities" to "authenticated";

grant insert on table "public"."activities" to "authenticated";

grant references on table "public"."activities" to "authenticated";

grant select on table "public"."activities" to "authenticated";

grant trigger on table "public"."activities" to "authenticated";

grant truncate on table "public"."activities" to "authenticated";

grant update on table "public"."activities" to "authenticated";

grant delete on table "public"."activities" to "service_role";

grant insert on table "public"."activities" to "service_role";

grant references on table "public"."activities" to "service_role";

grant select on table "public"."activities" to "service_role";

grant trigger on table "public"."activities" to "service_role";

grant truncate on table "public"."activities" to "service_role";

grant update on table "public"."activities" to "service_role";

grant delete on table "public"."api_keys" to "anon";

grant insert on table "public"."api_keys" to "anon";

grant references on table "public"."api_keys" to "anon";

grant select on table "public"."api_keys" to "anon";

grant trigger on table "public"."api_keys" to "anon";

grant truncate on table "public"."api_keys" to "anon";

grant update on table "public"."api_keys" to "anon";

grant delete on table "public"."api_keys" to "authenticated";

grant insert on table "public"."api_keys" to "authenticated";

grant references on table "public"."api_keys" to "authenticated";

grant select on table "public"."api_keys" to "authenticated";

grant trigger on table "public"."api_keys" to "authenticated";

grant truncate on table "public"."api_keys" to "authenticated";

grant update on table "public"."api_keys" to "authenticated";

grant delete on table "public"."api_keys" to "service_role";

grant insert on table "public"."api_keys" to "service_role";

grant references on table "public"."api_keys" to "service_role";

grant select on table "public"."api_keys" to "service_role";

grant trigger on table "public"."api_keys" to "service_role";

grant truncate on table "public"."api_keys" to "service_role";

grant update on table "public"."api_keys" to "service_role";

grant delete on table "public"."apps" to "anon";

grant insert on table "public"."apps" to "anon";

grant references on table "public"."apps" to "anon";

grant select on table "public"."apps" to "anon";

grant trigger on table "public"."apps" to "anon";

grant truncate on table "public"."apps" to "anon";

grant update on table "public"."apps" to "anon";

grant delete on table "public"."apps" to "authenticated";

grant insert on table "public"."apps" to "authenticated";

grant references on table "public"."apps" to "authenticated";

grant select on table "public"."apps" to "authenticated";

grant trigger on table "public"."apps" to "authenticated";

grant truncate on table "public"."apps" to "authenticated";

grant update on table "public"."apps" to "authenticated";

grant delete on table "public"."apps" to "service_role";

grant insert on table "public"."apps" to "service_role";

grant references on table "public"."apps" to "service_role";

grant select on table "public"."apps" to "service_role";

grant trigger on table "public"."apps" to "service_role";

grant truncate on table "public"."apps" to "service_role";

grant update on table "public"."apps" to "service_role";

grant delete on table "public"."bank_accounts" to "anon";

grant insert on table "public"."bank_accounts" to "anon";

grant references on table "public"."bank_accounts" to "anon";

grant select on table "public"."bank_accounts" to "anon";

grant trigger on table "public"."bank_accounts" to "anon";

grant truncate on table "public"."bank_accounts" to "anon";

grant update on table "public"."bank_accounts" to "anon";

grant delete on table "public"."bank_accounts" to "authenticated";

grant insert on table "public"."bank_accounts" to "authenticated";

grant references on table "public"."bank_accounts" to "authenticated";

grant select on table "public"."bank_accounts" to "authenticated";

grant trigger on table "public"."bank_accounts" to "authenticated";

grant truncate on table "public"."bank_accounts" to "authenticated";

grant update on table "public"."bank_accounts" to "authenticated";

grant delete on table "public"."bank_accounts" to "service_role";

grant insert on table "public"."bank_accounts" to "service_role";

grant references on table "public"."bank_accounts" to "service_role";

grant select on table "public"."bank_accounts" to "service_role";

grant trigger on table "public"."bank_accounts" to "service_role";

grant truncate on table "public"."bank_accounts" to "service_role";

grant update on table "public"."bank_accounts" to "service_role";

grant delete on table "public"."bank_connections" to "anon";

grant insert on table "public"."bank_connections" to "anon";

grant references on table "public"."bank_connections" to "anon";

grant select on table "public"."bank_connections" to "anon";

grant trigger on table "public"."bank_connections" to "anon";

grant truncate on table "public"."bank_connections" to "anon";

grant update on table "public"."bank_connections" to "anon";

grant delete on table "public"."bank_connections" to "authenticated";

grant insert on table "public"."bank_connections" to "authenticated";

grant references on table "public"."bank_connections" to "authenticated";

grant select on table "public"."bank_connections" to "authenticated";

grant trigger on table "public"."bank_connections" to "authenticated";

grant truncate on table "public"."bank_connections" to "authenticated";

grant update on table "public"."bank_connections" to "authenticated";

grant delete on table "public"."bank_connections" to "service_role";

grant insert on table "public"."bank_connections" to "service_role";

grant references on table "public"."bank_connections" to "service_role";

grant select on table "public"."bank_connections" to "service_role";

grant trigger on table "public"."bank_connections" to "service_role";

grant truncate on table "public"."bank_connections" to "service_role";

grant update on table "public"."bank_connections" to "service_role";

grant delete on table "public"."customer_tags" to "anon";

grant insert on table "public"."customer_tags" to "anon";

grant references on table "public"."customer_tags" to "anon";

grant select on table "public"."customer_tags" to "anon";

grant trigger on table "public"."customer_tags" to "anon";

grant truncate on table "public"."customer_tags" to "anon";

grant update on table "public"."customer_tags" to "anon";

grant delete on table "public"."customer_tags" to "authenticated";

grant insert on table "public"."customer_tags" to "authenticated";

grant references on table "public"."customer_tags" to "authenticated";

grant select on table "public"."customer_tags" to "authenticated";

grant trigger on table "public"."customer_tags" to "authenticated";

grant truncate on table "public"."customer_tags" to "authenticated";

grant update on table "public"."customer_tags" to "authenticated";

grant delete on table "public"."customer_tags" to "service_role";

grant insert on table "public"."customer_tags" to "service_role";

grant references on table "public"."customer_tags" to "service_role";

grant select on table "public"."customer_tags" to "service_role";

grant trigger on table "public"."customer_tags" to "service_role";

grant truncate on table "public"."customer_tags" to "service_role";

grant update on table "public"."customer_tags" to "service_role";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."document_tag_assignments" to "anon";

grant insert on table "public"."document_tag_assignments" to "anon";

grant references on table "public"."document_tag_assignments" to "anon";

grant select on table "public"."document_tag_assignments" to "anon";

grant trigger on table "public"."document_tag_assignments" to "anon";

grant truncate on table "public"."document_tag_assignments" to "anon";

grant update on table "public"."document_tag_assignments" to "anon";

grant delete on table "public"."document_tag_assignments" to "authenticated";

grant insert on table "public"."document_tag_assignments" to "authenticated";

grant references on table "public"."document_tag_assignments" to "authenticated";

grant select on table "public"."document_tag_assignments" to "authenticated";

grant trigger on table "public"."document_tag_assignments" to "authenticated";

grant truncate on table "public"."document_tag_assignments" to "authenticated";

grant update on table "public"."document_tag_assignments" to "authenticated";

grant delete on table "public"."document_tag_assignments" to "service_role";

grant insert on table "public"."document_tag_assignments" to "service_role";

grant references on table "public"."document_tag_assignments" to "service_role";

grant select on table "public"."document_tag_assignments" to "service_role";

grant trigger on table "public"."document_tag_assignments" to "service_role";

grant truncate on table "public"."document_tag_assignments" to "service_role";

grant update on table "public"."document_tag_assignments" to "service_role";

grant delete on table "public"."document_tag_embeddings" to "anon";

grant insert on table "public"."document_tag_embeddings" to "anon";

grant references on table "public"."document_tag_embeddings" to "anon";

grant select on table "public"."document_tag_embeddings" to "anon";

grant trigger on table "public"."document_tag_embeddings" to "anon";

grant truncate on table "public"."document_tag_embeddings" to "anon";

grant update on table "public"."document_tag_embeddings" to "anon";

grant delete on table "public"."document_tag_embeddings" to "authenticated";

grant insert on table "public"."document_tag_embeddings" to "authenticated";

grant references on table "public"."document_tag_embeddings" to "authenticated";

grant select on table "public"."document_tag_embeddings" to "authenticated";

grant trigger on table "public"."document_tag_embeddings" to "authenticated";

grant truncate on table "public"."document_tag_embeddings" to "authenticated";

grant update on table "public"."document_tag_embeddings" to "authenticated";

grant delete on table "public"."document_tag_embeddings" to "service_role";

grant insert on table "public"."document_tag_embeddings" to "service_role";

grant references on table "public"."document_tag_embeddings" to "service_role";

grant select on table "public"."document_tag_embeddings" to "service_role";

grant trigger on table "public"."document_tag_embeddings" to "service_role";

grant truncate on table "public"."document_tag_embeddings" to "service_role";

grant update on table "public"."document_tag_embeddings" to "service_role";

grant delete on table "public"."document_tags" to "anon";

grant insert on table "public"."document_tags" to "anon";

grant references on table "public"."document_tags" to "anon";

grant select on table "public"."document_tags" to "anon";

grant trigger on table "public"."document_tags" to "anon";

grant truncate on table "public"."document_tags" to "anon";

grant update on table "public"."document_tags" to "anon";

grant delete on table "public"."document_tags" to "authenticated";

grant insert on table "public"."document_tags" to "authenticated";

grant references on table "public"."document_tags" to "authenticated";

grant select on table "public"."document_tags" to "authenticated";

grant trigger on table "public"."document_tags" to "authenticated";

grant truncate on table "public"."document_tags" to "authenticated";

grant update on table "public"."document_tags" to "authenticated";

grant delete on table "public"."document_tags" to "service_role";

grant insert on table "public"."document_tags" to "service_role";

grant references on table "public"."document_tags" to "service_role";

grant select on table "public"."document_tags" to "service_role";

grant trigger on table "public"."document_tags" to "service_role";

grant truncate on table "public"."document_tags" to "service_role";

grant update on table "public"."document_tags" to "service_role";

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."exchange_rates" to "anon";

grant insert on table "public"."exchange_rates" to "anon";

grant references on table "public"."exchange_rates" to "anon";

grant select on table "public"."exchange_rates" to "anon";

grant trigger on table "public"."exchange_rates" to "anon";

grant truncate on table "public"."exchange_rates" to "anon";

grant update on table "public"."exchange_rates" to "anon";

grant delete on table "public"."exchange_rates" to "authenticated";

grant insert on table "public"."exchange_rates" to "authenticated";

grant references on table "public"."exchange_rates" to "authenticated";

grant select on table "public"."exchange_rates" to "authenticated";

grant trigger on table "public"."exchange_rates" to "authenticated";

grant truncate on table "public"."exchange_rates" to "authenticated";

grant update on table "public"."exchange_rates" to "authenticated";

grant delete on table "public"."exchange_rates" to "service_role";

grant insert on table "public"."exchange_rates" to "service_role";

grant references on table "public"."exchange_rates" to "service_role";

grant select on table "public"."exchange_rates" to "service_role";

grant trigger on table "public"."exchange_rates" to "service_role";

grant truncate on table "public"."exchange_rates" to "service_role";

grant update on table "public"."exchange_rates" to "service_role";

grant delete on table "public"."inbox" to "anon";

grant insert on table "public"."inbox" to "anon";

grant references on table "public"."inbox" to "anon";

grant select on table "public"."inbox" to "anon";

grant trigger on table "public"."inbox" to "anon";

grant truncate on table "public"."inbox" to "anon";

grant update on table "public"."inbox" to "anon";

grant delete on table "public"."inbox" to "authenticated";

grant insert on table "public"."inbox" to "authenticated";

grant references on table "public"."inbox" to "authenticated";

grant select on table "public"."inbox" to "authenticated";

grant trigger on table "public"."inbox" to "authenticated";

grant truncate on table "public"."inbox" to "authenticated";

grant update on table "public"."inbox" to "authenticated";

grant delete on table "public"."inbox" to "service_role";

grant insert on table "public"."inbox" to "service_role";

grant references on table "public"."inbox" to "service_role";

grant select on table "public"."inbox" to "service_role";

grant trigger on table "public"."inbox" to "service_role";

grant truncate on table "public"."inbox" to "service_role";

grant update on table "public"."inbox" to "service_role";

grant delete on table "public"."inbox_accounts" to "anon";

grant insert on table "public"."inbox_accounts" to "anon";

grant references on table "public"."inbox_accounts" to "anon";

grant select on table "public"."inbox_accounts" to "anon";

grant trigger on table "public"."inbox_accounts" to "anon";

grant truncate on table "public"."inbox_accounts" to "anon";

grant update on table "public"."inbox_accounts" to "anon";

grant delete on table "public"."inbox_accounts" to "authenticated";

grant insert on table "public"."inbox_accounts" to "authenticated";

grant references on table "public"."inbox_accounts" to "authenticated";

grant select on table "public"."inbox_accounts" to "authenticated";

grant trigger on table "public"."inbox_accounts" to "authenticated";

grant truncate on table "public"."inbox_accounts" to "authenticated";

grant update on table "public"."inbox_accounts" to "authenticated";

grant delete on table "public"."inbox_accounts" to "service_role";

grant insert on table "public"."inbox_accounts" to "service_role";

grant references on table "public"."inbox_accounts" to "service_role";

grant select on table "public"."inbox_accounts" to "service_role";

grant trigger on table "public"."inbox_accounts" to "service_role";

grant truncate on table "public"."inbox_accounts" to "service_role";

grant update on table "public"."inbox_accounts" to "service_role";

grant delete on table "public"."inbox_blocklist" to "anon";

grant insert on table "public"."inbox_blocklist" to "anon";

grant references on table "public"."inbox_blocklist" to "anon";

grant select on table "public"."inbox_blocklist" to "anon";

grant trigger on table "public"."inbox_blocklist" to "anon";

grant truncate on table "public"."inbox_blocklist" to "anon";

grant update on table "public"."inbox_blocklist" to "anon";

grant delete on table "public"."inbox_blocklist" to "authenticated";

grant insert on table "public"."inbox_blocklist" to "authenticated";

grant references on table "public"."inbox_blocklist" to "authenticated";

grant select on table "public"."inbox_blocklist" to "authenticated";

grant trigger on table "public"."inbox_blocklist" to "authenticated";

grant truncate on table "public"."inbox_blocklist" to "authenticated";

grant update on table "public"."inbox_blocklist" to "authenticated";

grant delete on table "public"."inbox_blocklist" to "service_role";

grant insert on table "public"."inbox_blocklist" to "service_role";

grant references on table "public"."inbox_blocklist" to "service_role";

grant select on table "public"."inbox_blocklist" to "service_role";

grant trigger on table "public"."inbox_blocklist" to "service_role";

grant truncate on table "public"."inbox_blocklist" to "service_role";

grant update on table "public"."inbox_blocklist" to "service_role";

grant delete on table "public"."inbox_embeddings" to "anon";

grant insert on table "public"."inbox_embeddings" to "anon";

grant references on table "public"."inbox_embeddings" to "anon";

grant select on table "public"."inbox_embeddings" to "anon";

grant trigger on table "public"."inbox_embeddings" to "anon";

grant truncate on table "public"."inbox_embeddings" to "anon";

grant update on table "public"."inbox_embeddings" to "anon";

grant delete on table "public"."inbox_embeddings" to "authenticated";

grant insert on table "public"."inbox_embeddings" to "authenticated";

grant references on table "public"."inbox_embeddings" to "authenticated";

grant select on table "public"."inbox_embeddings" to "authenticated";

grant trigger on table "public"."inbox_embeddings" to "authenticated";

grant truncate on table "public"."inbox_embeddings" to "authenticated";

grant update on table "public"."inbox_embeddings" to "authenticated";

grant delete on table "public"."inbox_embeddings" to "service_role";

grant insert on table "public"."inbox_embeddings" to "service_role";

grant references on table "public"."inbox_embeddings" to "service_role";

grant select on table "public"."inbox_embeddings" to "service_role";

grant trigger on table "public"."inbox_embeddings" to "service_role";

grant truncate on table "public"."inbox_embeddings" to "service_role";

grant update on table "public"."inbox_embeddings" to "service_role";

grant delete on table "public"."invoice_comments" to "anon";

grant insert on table "public"."invoice_comments" to "anon";

grant references on table "public"."invoice_comments" to "anon";

grant select on table "public"."invoice_comments" to "anon";

grant trigger on table "public"."invoice_comments" to "anon";

grant truncate on table "public"."invoice_comments" to "anon";

grant update on table "public"."invoice_comments" to "anon";

grant delete on table "public"."invoice_comments" to "authenticated";

grant insert on table "public"."invoice_comments" to "authenticated";

grant references on table "public"."invoice_comments" to "authenticated";

grant select on table "public"."invoice_comments" to "authenticated";

grant trigger on table "public"."invoice_comments" to "authenticated";

grant truncate on table "public"."invoice_comments" to "authenticated";

grant update on table "public"."invoice_comments" to "authenticated";

grant delete on table "public"."invoice_comments" to "service_role";

grant insert on table "public"."invoice_comments" to "service_role";

grant references on table "public"."invoice_comments" to "service_role";

grant select on table "public"."invoice_comments" to "service_role";

grant trigger on table "public"."invoice_comments" to "service_role";

grant truncate on table "public"."invoice_comments" to "service_role";

grant update on table "public"."invoice_comments" to "service_role";

grant delete on table "public"."invoice_products" to "anon";

grant insert on table "public"."invoice_products" to "anon";

grant references on table "public"."invoice_products" to "anon";

grant select on table "public"."invoice_products" to "anon";

grant trigger on table "public"."invoice_products" to "anon";

grant truncate on table "public"."invoice_products" to "anon";

grant update on table "public"."invoice_products" to "anon";

grant delete on table "public"."invoice_products" to "authenticated";

grant insert on table "public"."invoice_products" to "authenticated";

grant references on table "public"."invoice_products" to "authenticated";

grant select on table "public"."invoice_products" to "authenticated";

grant trigger on table "public"."invoice_products" to "authenticated";

grant truncate on table "public"."invoice_products" to "authenticated";

grant update on table "public"."invoice_products" to "authenticated";

grant delete on table "public"."invoice_products" to "service_role";

grant insert on table "public"."invoice_products" to "service_role";

grant references on table "public"."invoice_products" to "service_role";

grant select on table "public"."invoice_products" to "service_role";

grant trigger on table "public"."invoice_products" to "service_role";

grant truncate on table "public"."invoice_products" to "service_role";

grant update on table "public"."invoice_products" to "service_role";

grant delete on table "public"."invoice_recurring" to "anon";

grant insert on table "public"."invoice_recurring" to "anon";

grant references on table "public"."invoice_recurring" to "anon";

grant select on table "public"."invoice_recurring" to "anon";

grant trigger on table "public"."invoice_recurring" to "anon";

grant truncate on table "public"."invoice_recurring" to "anon";

grant update on table "public"."invoice_recurring" to "anon";

grant delete on table "public"."invoice_recurring" to "authenticated";

grant insert on table "public"."invoice_recurring" to "authenticated";

grant references on table "public"."invoice_recurring" to "authenticated";

grant select on table "public"."invoice_recurring" to "authenticated";

grant trigger on table "public"."invoice_recurring" to "authenticated";

grant truncate on table "public"."invoice_recurring" to "authenticated";

grant update on table "public"."invoice_recurring" to "authenticated";

grant delete on table "public"."invoice_recurring" to "service_role";

grant insert on table "public"."invoice_recurring" to "service_role";

grant references on table "public"."invoice_recurring" to "service_role";

grant select on table "public"."invoice_recurring" to "service_role";

grant trigger on table "public"."invoice_recurring" to "service_role";

grant truncate on table "public"."invoice_recurring" to "service_role";

grant update on table "public"."invoice_recurring" to "service_role";

grant delete on table "public"."invoice_templates" to "anon";

grant insert on table "public"."invoice_templates" to "anon";

grant references on table "public"."invoice_templates" to "anon";

grant select on table "public"."invoice_templates" to "anon";

grant trigger on table "public"."invoice_templates" to "anon";

grant truncate on table "public"."invoice_templates" to "anon";

grant update on table "public"."invoice_templates" to "anon";

grant delete on table "public"."invoice_templates" to "authenticated";

grant insert on table "public"."invoice_templates" to "authenticated";

grant references on table "public"."invoice_templates" to "authenticated";

grant select on table "public"."invoice_templates" to "authenticated";

grant trigger on table "public"."invoice_templates" to "authenticated";

grant truncate on table "public"."invoice_templates" to "authenticated";

grant update on table "public"."invoice_templates" to "authenticated";

grant delete on table "public"."invoice_templates" to "service_role";

grant insert on table "public"."invoice_templates" to "service_role";

grant references on table "public"."invoice_templates" to "service_role";

grant select on table "public"."invoice_templates" to "service_role";

grant trigger on table "public"."invoice_templates" to "service_role";

grant truncate on table "public"."invoice_templates" to "service_role";

grant update on table "public"."invoice_templates" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."notification_settings" to "anon";

grant insert on table "public"."notification_settings" to "anon";

grant references on table "public"."notification_settings" to "anon";

grant select on table "public"."notification_settings" to "anon";

grant trigger on table "public"."notification_settings" to "anon";

grant truncate on table "public"."notification_settings" to "anon";

grant update on table "public"."notification_settings" to "anon";

grant delete on table "public"."notification_settings" to "authenticated";

grant insert on table "public"."notification_settings" to "authenticated";

grant references on table "public"."notification_settings" to "authenticated";

grant select on table "public"."notification_settings" to "authenticated";

grant trigger on table "public"."notification_settings" to "authenticated";

grant truncate on table "public"."notification_settings" to "authenticated";

grant update on table "public"."notification_settings" to "authenticated";

grant delete on table "public"."notification_settings" to "service_role";

grant insert on table "public"."notification_settings" to "service_role";

grant references on table "public"."notification_settings" to "service_role";

grant select on table "public"."notification_settings" to "service_role";

grant trigger on table "public"."notification_settings" to "service_role";

grant truncate on table "public"."notification_settings" to "service_role";

grant update on table "public"."notification_settings" to "service_role";

grant delete on table "public"."oauth_access_tokens" to "anon";

grant insert on table "public"."oauth_access_tokens" to "anon";

grant references on table "public"."oauth_access_tokens" to "anon";

grant select on table "public"."oauth_access_tokens" to "anon";

grant trigger on table "public"."oauth_access_tokens" to "anon";

grant truncate on table "public"."oauth_access_tokens" to "anon";

grant update on table "public"."oauth_access_tokens" to "anon";

grant delete on table "public"."oauth_access_tokens" to "authenticated";

grant insert on table "public"."oauth_access_tokens" to "authenticated";

grant references on table "public"."oauth_access_tokens" to "authenticated";

grant select on table "public"."oauth_access_tokens" to "authenticated";

grant trigger on table "public"."oauth_access_tokens" to "authenticated";

grant truncate on table "public"."oauth_access_tokens" to "authenticated";

grant update on table "public"."oauth_access_tokens" to "authenticated";

grant delete on table "public"."oauth_access_tokens" to "service_role";

grant insert on table "public"."oauth_access_tokens" to "service_role";

grant references on table "public"."oauth_access_tokens" to "service_role";

grant select on table "public"."oauth_access_tokens" to "service_role";

grant trigger on table "public"."oauth_access_tokens" to "service_role";

grant truncate on table "public"."oauth_access_tokens" to "service_role";

grant update on table "public"."oauth_access_tokens" to "service_role";

grant delete on table "public"."oauth_applications" to "anon";

grant insert on table "public"."oauth_applications" to "anon";

grant references on table "public"."oauth_applications" to "anon";

grant select on table "public"."oauth_applications" to "anon";

grant trigger on table "public"."oauth_applications" to "anon";

grant truncate on table "public"."oauth_applications" to "anon";

grant update on table "public"."oauth_applications" to "anon";

grant delete on table "public"."oauth_applications" to "authenticated";

grant insert on table "public"."oauth_applications" to "authenticated";

grant references on table "public"."oauth_applications" to "authenticated";

grant select on table "public"."oauth_applications" to "authenticated";

grant trigger on table "public"."oauth_applications" to "authenticated";

grant truncate on table "public"."oauth_applications" to "authenticated";

grant update on table "public"."oauth_applications" to "authenticated";

grant delete on table "public"."oauth_applications" to "service_role";

grant insert on table "public"."oauth_applications" to "service_role";

grant references on table "public"."oauth_applications" to "service_role";

grant select on table "public"."oauth_applications" to "service_role";

grant trigger on table "public"."oauth_applications" to "service_role";

grant truncate on table "public"."oauth_applications" to "service_role";

grant update on table "public"."oauth_applications" to "service_role";

grant delete on table "public"."oauth_authorization_codes" to "anon";

grant insert on table "public"."oauth_authorization_codes" to "anon";

grant references on table "public"."oauth_authorization_codes" to "anon";

grant select on table "public"."oauth_authorization_codes" to "anon";

grant trigger on table "public"."oauth_authorization_codes" to "anon";

grant truncate on table "public"."oauth_authorization_codes" to "anon";

grant update on table "public"."oauth_authorization_codes" to "anon";

grant delete on table "public"."oauth_authorization_codes" to "authenticated";

grant insert on table "public"."oauth_authorization_codes" to "authenticated";

grant references on table "public"."oauth_authorization_codes" to "authenticated";

grant select on table "public"."oauth_authorization_codes" to "authenticated";

grant trigger on table "public"."oauth_authorization_codes" to "authenticated";

grant truncate on table "public"."oauth_authorization_codes" to "authenticated";

grant update on table "public"."oauth_authorization_codes" to "authenticated";

grant delete on table "public"."oauth_authorization_codes" to "service_role";

grant insert on table "public"."oauth_authorization_codes" to "service_role";

grant references on table "public"."oauth_authorization_codes" to "service_role";

grant select on table "public"."oauth_authorization_codes" to "service_role";

grant trigger on table "public"."oauth_authorization_codes" to "service_role";

grant truncate on table "public"."oauth_authorization_codes" to "service_role";

grant update on table "public"."oauth_authorization_codes" to "service_role";

grant delete on table "public"."reports" to "anon";

grant insert on table "public"."reports" to "anon";

grant references on table "public"."reports" to "anon";

grant select on table "public"."reports" to "anon";

grant trigger on table "public"."reports" to "anon";

grant truncate on table "public"."reports" to "anon";

grant update on table "public"."reports" to "anon";

grant delete on table "public"."reports" to "authenticated";

grant insert on table "public"."reports" to "authenticated";

grant references on table "public"."reports" to "authenticated";

grant select on table "public"."reports" to "authenticated";

grant trigger on table "public"."reports" to "authenticated";

grant truncate on table "public"."reports" to "authenticated";

grant update on table "public"."reports" to "authenticated";

grant delete on table "public"."reports" to "service_role";

grant insert on table "public"."reports" to "service_role";

grant references on table "public"."reports" to "service_role";

grant select on table "public"."reports" to "service_role";

grant trigger on table "public"."reports" to "service_role";

grant truncate on table "public"."reports" to "service_role";

grant update on table "public"."reports" to "service_role";

grant delete on table "public"."short_links" to "anon";

grant insert on table "public"."short_links" to "anon";

grant references on table "public"."short_links" to "anon";

grant select on table "public"."short_links" to "anon";

grant trigger on table "public"."short_links" to "anon";

grant truncate on table "public"."short_links" to "anon";

grant update on table "public"."short_links" to "anon";

grant delete on table "public"."short_links" to "authenticated";

grant insert on table "public"."short_links" to "authenticated";

grant references on table "public"."short_links" to "authenticated";

grant select on table "public"."short_links" to "authenticated";

grant trigger on table "public"."short_links" to "authenticated";

grant truncate on table "public"."short_links" to "authenticated";

grant update on table "public"."short_links" to "authenticated";

grant delete on table "public"."short_links" to "service_role";

grant insert on table "public"."short_links" to "service_role";

grant references on table "public"."short_links" to "service_role";

grant select on table "public"."short_links" to "service_role";

grant trigger on table "public"."short_links" to "service_role";

grant truncate on table "public"."short_links" to "service_role";

grant update on table "public"."short_links" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."teams" to "anon";

grant insert on table "public"."teams" to "anon";

grant references on table "public"."teams" to "anon";

grant select on table "public"."teams" to "anon";

grant trigger on table "public"."teams" to "anon";

grant truncate on table "public"."teams" to "anon";

grant update on table "public"."teams" to "anon";

grant delete on table "public"."teams" to "authenticated";

grant insert on table "public"."teams" to "authenticated";

grant references on table "public"."teams" to "authenticated";

grant select on table "public"."teams" to "authenticated";

grant trigger on table "public"."teams" to "authenticated";

grant truncate on table "public"."teams" to "authenticated";

grant update on table "public"."teams" to "authenticated";

grant delete on table "public"."teams" to "service_role";

grant insert on table "public"."teams" to "service_role";

grant references on table "public"."teams" to "service_role";

grant select on table "public"."teams" to "service_role";

grant trigger on table "public"."teams" to "service_role";

grant truncate on table "public"."teams" to "service_role";

grant update on table "public"."teams" to "service_role";

grant delete on table "public"."tracker_entries" to "anon";

grant insert on table "public"."tracker_entries" to "anon";

grant references on table "public"."tracker_entries" to "anon";

grant select on table "public"."tracker_entries" to "anon";

grant trigger on table "public"."tracker_entries" to "anon";

grant truncate on table "public"."tracker_entries" to "anon";

grant update on table "public"."tracker_entries" to "anon";

grant delete on table "public"."tracker_entries" to "authenticated";

grant insert on table "public"."tracker_entries" to "authenticated";

grant references on table "public"."tracker_entries" to "authenticated";

grant select on table "public"."tracker_entries" to "authenticated";

grant trigger on table "public"."tracker_entries" to "authenticated";

grant truncate on table "public"."tracker_entries" to "authenticated";

grant update on table "public"."tracker_entries" to "authenticated";

grant delete on table "public"."tracker_entries" to "service_role";

grant insert on table "public"."tracker_entries" to "service_role";

grant references on table "public"."tracker_entries" to "service_role";

grant select on table "public"."tracker_entries" to "service_role";

grant trigger on table "public"."tracker_entries" to "service_role";

grant truncate on table "public"."tracker_entries" to "service_role";

grant update on table "public"."tracker_entries" to "service_role";

grant delete on table "public"."tracker_project_tags" to "anon";

grant insert on table "public"."tracker_project_tags" to "anon";

grant references on table "public"."tracker_project_tags" to "anon";

grant select on table "public"."tracker_project_tags" to "anon";

grant trigger on table "public"."tracker_project_tags" to "anon";

grant truncate on table "public"."tracker_project_tags" to "anon";

grant update on table "public"."tracker_project_tags" to "anon";

grant delete on table "public"."tracker_project_tags" to "authenticated";

grant insert on table "public"."tracker_project_tags" to "authenticated";

grant references on table "public"."tracker_project_tags" to "authenticated";

grant select on table "public"."tracker_project_tags" to "authenticated";

grant trigger on table "public"."tracker_project_tags" to "authenticated";

grant truncate on table "public"."tracker_project_tags" to "authenticated";

grant update on table "public"."tracker_project_tags" to "authenticated";

grant delete on table "public"."tracker_project_tags" to "service_role";

grant insert on table "public"."tracker_project_tags" to "service_role";

grant references on table "public"."tracker_project_tags" to "service_role";

grant select on table "public"."tracker_project_tags" to "service_role";

grant trigger on table "public"."tracker_project_tags" to "service_role";

grant truncate on table "public"."tracker_project_tags" to "service_role";

grant update on table "public"."tracker_project_tags" to "service_role";

grant delete on table "public"."tracker_projects" to "anon";

grant insert on table "public"."tracker_projects" to "anon";

grant references on table "public"."tracker_projects" to "anon";

grant select on table "public"."tracker_projects" to "anon";

grant trigger on table "public"."tracker_projects" to "anon";

grant truncate on table "public"."tracker_projects" to "anon";

grant update on table "public"."tracker_projects" to "anon";

grant delete on table "public"."tracker_projects" to "authenticated";

grant insert on table "public"."tracker_projects" to "authenticated";

grant references on table "public"."tracker_projects" to "authenticated";

grant select on table "public"."tracker_projects" to "authenticated";

grant trigger on table "public"."tracker_projects" to "authenticated";

grant truncate on table "public"."tracker_projects" to "authenticated";

grant update on table "public"."tracker_projects" to "authenticated";

grant delete on table "public"."tracker_projects" to "service_role";

grant insert on table "public"."tracker_projects" to "service_role";

grant references on table "public"."tracker_projects" to "service_role";

grant select on table "public"."tracker_projects" to "service_role";

grant trigger on table "public"."tracker_projects" to "service_role";

grant truncate on table "public"."tracker_projects" to "service_role";

grant update on table "public"."tracker_projects" to "service_role";

grant delete on table "public"."tracker_reports" to "anon";

grant insert on table "public"."tracker_reports" to "anon";

grant references on table "public"."tracker_reports" to "anon";

grant select on table "public"."tracker_reports" to "anon";

grant trigger on table "public"."tracker_reports" to "anon";

grant truncate on table "public"."tracker_reports" to "anon";

grant update on table "public"."tracker_reports" to "anon";

grant delete on table "public"."tracker_reports" to "authenticated";

grant insert on table "public"."tracker_reports" to "authenticated";

grant references on table "public"."tracker_reports" to "authenticated";

grant select on table "public"."tracker_reports" to "authenticated";

grant trigger on table "public"."tracker_reports" to "authenticated";

grant truncate on table "public"."tracker_reports" to "authenticated";

grant update on table "public"."tracker_reports" to "authenticated";

grant delete on table "public"."tracker_reports" to "service_role";

grant insert on table "public"."tracker_reports" to "service_role";

grant references on table "public"."tracker_reports" to "service_role";

grant select on table "public"."tracker_reports" to "service_role";

grant trigger on table "public"."tracker_reports" to "service_role";

grant truncate on table "public"."tracker_reports" to "service_role";

grant update on table "public"."tracker_reports" to "service_role";

grant delete on table "public"."transaction_attachments" to "anon";

grant insert on table "public"."transaction_attachments" to "anon";

grant references on table "public"."transaction_attachments" to "anon";

grant select on table "public"."transaction_attachments" to "anon";

grant trigger on table "public"."transaction_attachments" to "anon";

grant truncate on table "public"."transaction_attachments" to "anon";

grant update on table "public"."transaction_attachments" to "anon";

grant delete on table "public"."transaction_attachments" to "authenticated";

grant insert on table "public"."transaction_attachments" to "authenticated";

grant references on table "public"."transaction_attachments" to "authenticated";

grant select on table "public"."transaction_attachments" to "authenticated";

grant trigger on table "public"."transaction_attachments" to "authenticated";

grant truncate on table "public"."transaction_attachments" to "authenticated";

grant update on table "public"."transaction_attachments" to "authenticated";

grant delete on table "public"."transaction_attachments" to "service_role";

grant insert on table "public"."transaction_attachments" to "service_role";

grant references on table "public"."transaction_attachments" to "service_role";

grant select on table "public"."transaction_attachments" to "service_role";

grant trigger on table "public"."transaction_attachments" to "service_role";

grant truncate on table "public"."transaction_attachments" to "service_role";

grant update on table "public"."transaction_attachments" to "service_role";

grant delete on table "public"."transaction_categories" to "anon";

grant insert on table "public"."transaction_categories" to "anon";

grant references on table "public"."transaction_categories" to "anon";

grant select on table "public"."transaction_categories" to "anon";

grant trigger on table "public"."transaction_categories" to "anon";

grant truncate on table "public"."transaction_categories" to "anon";

grant update on table "public"."transaction_categories" to "anon";

grant delete on table "public"."transaction_categories" to "authenticated";

grant insert on table "public"."transaction_categories" to "authenticated";

grant references on table "public"."transaction_categories" to "authenticated";

grant select on table "public"."transaction_categories" to "authenticated";

grant trigger on table "public"."transaction_categories" to "authenticated";

grant truncate on table "public"."transaction_categories" to "authenticated";

grant update on table "public"."transaction_categories" to "authenticated";

grant delete on table "public"."transaction_categories" to "service_role";

grant insert on table "public"."transaction_categories" to "service_role";

grant references on table "public"."transaction_categories" to "service_role";

grant select on table "public"."transaction_categories" to "service_role";

grant trigger on table "public"."transaction_categories" to "service_role";

grant truncate on table "public"."transaction_categories" to "service_role";

grant update on table "public"."transaction_categories" to "service_role";

grant delete on table "public"."transaction_category_embeddings" to "anon";

grant insert on table "public"."transaction_category_embeddings" to "anon";

grant references on table "public"."transaction_category_embeddings" to "anon";

grant select on table "public"."transaction_category_embeddings" to "anon";

grant trigger on table "public"."transaction_category_embeddings" to "anon";

grant truncate on table "public"."transaction_category_embeddings" to "anon";

grant update on table "public"."transaction_category_embeddings" to "anon";

grant delete on table "public"."transaction_category_embeddings" to "authenticated";

grant insert on table "public"."transaction_category_embeddings" to "authenticated";

grant references on table "public"."transaction_category_embeddings" to "authenticated";

grant select on table "public"."transaction_category_embeddings" to "authenticated";

grant trigger on table "public"."transaction_category_embeddings" to "authenticated";

grant truncate on table "public"."transaction_category_embeddings" to "authenticated";

grant update on table "public"."transaction_category_embeddings" to "authenticated";

grant delete on table "public"."transaction_category_embeddings" to "service_role";

grant insert on table "public"."transaction_category_embeddings" to "service_role";

grant references on table "public"."transaction_category_embeddings" to "service_role";

grant select on table "public"."transaction_category_embeddings" to "service_role";

grant trigger on table "public"."transaction_category_embeddings" to "service_role";

grant truncate on table "public"."transaction_category_embeddings" to "service_role";

grant update on table "public"."transaction_category_embeddings" to "service_role";

grant delete on table "public"."transaction_embeddings" to "anon";

grant insert on table "public"."transaction_embeddings" to "anon";

grant references on table "public"."transaction_embeddings" to "anon";

grant select on table "public"."transaction_embeddings" to "anon";

grant trigger on table "public"."transaction_embeddings" to "anon";

grant truncate on table "public"."transaction_embeddings" to "anon";

grant update on table "public"."transaction_embeddings" to "anon";

grant delete on table "public"."transaction_embeddings" to "authenticated";

grant insert on table "public"."transaction_embeddings" to "authenticated";

grant references on table "public"."transaction_embeddings" to "authenticated";

grant select on table "public"."transaction_embeddings" to "authenticated";

grant trigger on table "public"."transaction_embeddings" to "authenticated";

grant truncate on table "public"."transaction_embeddings" to "authenticated";

grant update on table "public"."transaction_embeddings" to "authenticated";

grant delete on table "public"."transaction_embeddings" to "service_role";

grant insert on table "public"."transaction_embeddings" to "service_role";

grant references on table "public"."transaction_embeddings" to "service_role";

grant select on table "public"."transaction_embeddings" to "service_role";

grant trigger on table "public"."transaction_embeddings" to "service_role";

grant truncate on table "public"."transaction_embeddings" to "service_role";

grant update on table "public"."transaction_embeddings" to "service_role";

grant delete on table "public"."transaction_enrichments" to "anon";

grant insert on table "public"."transaction_enrichments" to "anon";

grant references on table "public"."transaction_enrichments" to "anon";

grant select on table "public"."transaction_enrichments" to "anon";

grant trigger on table "public"."transaction_enrichments" to "anon";

grant truncate on table "public"."transaction_enrichments" to "anon";

grant update on table "public"."transaction_enrichments" to "anon";

grant delete on table "public"."transaction_enrichments" to "authenticated";

grant insert on table "public"."transaction_enrichments" to "authenticated";

grant references on table "public"."transaction_enrichments" to "authenticated";

grant select on table "public"."transaction_enrichments" to "authenticated";

grant trigger on table "public"."transaction_enrichments" to "authenticated";

grant truncate on table "public"."transaction_enrichments" to "authenticated";

grant update on table "public"."transaction_enrichments" to "authenticated";

grant delete on table "public"."transaction_enrichments" to "service_role";

grant insert on table "public"."transaction_enrichments" to "service_role";

grant references on table "public"."transaction_enrichments" to "service_role";

grant select on table "public"."transaction_enrichments" to "service_role";

grant trigger on table "public"."transaction_enrichments" to "service_role";

grant truncate on table "public"."transaction_enrichments" to "service_role";

grant update on table "public"."transaction_enrichments" to "service_role";

grant delete on table "public"."transaction_match_suggestions" to "anon";

grant insert on table "public"."transaction_match_suggestions" to "anon";

grant references on table "public"."transaction_match_suggestions" to "anon";

grant select on table "public"."transaction_match_suggestions" to "anon";

grant trigger on table "public"."transaction_match_suggestions" to "anon";

grant truncate on table "public"."transaction_match_suggestions" to "anon";

grant update on table "public"."transaction_match_suggestions" to "anon";

grant delete on table "public"."transaction_match_suggestions" to "authenticated";

grant insert on table "public"."transaction_match_suggestions" to "authenticated";

grant references on table "public"."transaction_match_suggestions" to "authenticated";

grant select on table "public"."transaction_match_suggestions" to "authenticated";

grant trigger on table "public"."transaction_match_suggestions" to "authenticated";

grant truncate on table "public"."transaction_match_suggestions" to "authenticated";

grant update on table "public"."transaction_match_suggestions" to "authenticated";

grant delete on table "public"."transaction_match_suggestions" to "service_role";

grant insert on table "public"."transaction_match_suggestions" to "service_role";

grant references on table "public"."transaction_match_suggestions" to "service_role";

grant select on table "public"."transaction_match_suggestions" to "service_role";

grant trigger on table "public"."transaction_match_suggestions" to "service_role";

grant truncate on table "public"."transaction_match_suggestions" to "service_role";

grant update on table "public"."transaction_match_suggestions" to "service_role";

grant delete on table "public"."transaction_tags" to "anon";

grant insert on table "public"."transaction_tags" to "anon";

grant references on table "public"."transaction_tags" to "anon";

grant select on table "public"."transaction_tags" to "anon";

grant trigger on table "public"."transaction_tags" to "anon";

grant truncate on table "public"."transaction_tags" to "anon";

grant update on table "public"."transaction_tags" to "anon";

grant delete on table "public"."transaction_tags" to "authenticated";

grant insert on table "public"."transaction_tags" to "authenticated";

grant references on table "public"."transaction_tags" to "authenticated";

grant select on table "public"."transaction_tags" to "authenticated";

grant trigger on table "public"."transaction_tags" to "authenticated";

grant truncate on table "public"."transaction_tags" to "authenticated";

grant update on table "public"."transaction_tags" to "authenticated";

grant delete on table "public"."transaction_tags" to "service_role";

grant insert on table "public"."transaction_tags" to "service_role";

grant references on table "public"."transaction_tags" to "service_role";

grant select on table "public"."transaction_tags" to "service_role";

grant trigger on table "public"."transaction_tags" to "service_role";

grant truncate on table "public"."transaction_tags" to "service_role";

grant update on table "public"."transaction_tags" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."user_invites" to "anon";

grant insert on table "public"."user_invites" to "anon";

grant references on table "public"."user_invites" to "anon";

grant select on table "public"."user_invites" to "anon";

grant trigger on table "public"."user_invites" to "anon";

grant truncate on table "public"."user_invites" to "anon";

grant update on table "public"."user_invites" to "anon";

grant delete on table "public"."user_invites" to "authenticated";

grant insert on table "public"."user_invites" to "authenticated";

grant references on table "public"."user_invites" to "authenticated";

grant select on table "public"."user_invites" to "authenticated";

grant trigger on table "public"."user_invites" to "authenticated";

grant truncate on table "public"."user_invites" to "authenticated";

grant update on table "public"."user_invites" to "authenticated";

grant delete on table "public"."user_invites" to "service_role";

grant insert on table "public"."user_invites" to "service_role";

grant references on table "public"."user_invites" to "service_role";

grant select on table "public"."user_invites" to "service_role";

grant trigger on table "public"."user_invites" to "service_role";

grant truncate on table "public"."user_invites" to "service_role";

grant update on table "public"."user_invites" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


