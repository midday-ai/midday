-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."account_type" AS ENUM('depository', 'credit', 'other_asset', 'loan', 'other_liability');--> statement-breakpoint
CREATE TYPE "public"."bankProviders" AS ENUM('gocardless', 'plaid', 'teller');--> statement-breakpoint
CREATE TYPE "public"."bank_providers" AS ENUM('gocardless', 'plaid', 'teller', 'enablebanking', 'pluggy');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('disconnected', 'connected', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."document_processing_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."inbox_account_providers" AS ENUM('gmail');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('processing', 'pending', 'archived', 'new', 'deleted', 'done');--> statement-breakpoint
CREATE TYPE "public"."inbox_type" AS ENUM('invoice', 'expense');--> statement-breakpoint
CREATE TYPE "public"."invoice_delivery_type" AS ENUM('create', 'create_and_send', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."invoice_size" AS ENUM('a4', 'letter');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'overdue', 'paid', 'unpaid', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."plans" AS ENUM('trial', 'starter', 'pro');--> statement-breakpoint
CREATE TYPE "public"."reportTypes" AS ENUM('profit', 'revenue', 'burn_rate', 'expense');--> statement-breakpoint
CREATE TYPE "public"."teamRoles" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."trackerStatus" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."transactionCategories" AS ENUM('travel', 'office_supplies', 'meals', 'software', 'rent', 'income', 'equipment', 'transfer', 'internet_and_telephone', 'facilities_expenses', 'activity', 'uncategorized', 'taxes', 'other', 'salary', 'fees');--> statement-breakpoint
CREATE TYPE "public"."transactionMethods" AS ENUM('payment', 'card_purchase', 'card_atm', 'transfer', 'other', 'unknown', 'ach', 'interest', 'deposit', 'wire', 'fee');--> statement-breakpoint
CREATE TYPE "public"."transactionStatus" AS ENUM('posted', 'pending', 'excluded', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."transaction_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'semi_monthly', 'annually', 'irregular', 'unknown');--> statement-breakpoint
CREATE TABLE "document_tag_embeddings" (
	"slug" text PRIMARY KEY NOT NULL,
	"embedding" vector(1024),
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_tag_embeddings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transactions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"date" date NOT NULL,
	"name" text NOT NULL,
	"method" "transactionMethods" NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text NOT NULL,
	"team_id" uuid NOT NULL,
	"assigned_id" uuid,
	"note" varchar,
	"bank_account_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internal_id" text NOT NULL,
	"status" "transactionStatus" DEFAULT 'posted',
	"category" "transactionCategories",
	"balance" numeric,
	"manual" boolean DEFAULT false,
	"description" text,
	"category_slug" text,
	"base_amount" numeric,
	"base_currency" text,
	"recurring" boolean,
	"frequency" "transaction_frequency",
	"fts_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)))) STORED,
	"notified" boolean DEFAULT false,
	"internal" boolean DEFAULT false,
	CONSTRAINT "transactions_internal_id_key" UNIQUE("internal_id")
);
--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tracker_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration" bigint,
	"project_id" uuid,
	"start" timestamp with time zone,
	"stop" timestamp with time zone,
	"assigned_id" uuid,
	"team_id" uuid,
	"description" text,
	"rate" numeric,
	"currency" text,
	"billed" boolean DEFAULT false,
	"date" date DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tracker_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customer_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "unique_customer_tag" UNIQUE("customer_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "customer_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inbox_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"team_id" uuid NOT NULL,
	"last_accessed" timestamp with time zone NOT NULL,
	"provider" "inbox_account_providers" NOT NULL,
	"external_id" text NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"schedule_id" text,
	CONSTRAINT "inbox_accounts_email_key" UNIQUE("email"),
	CONSTRAINT "inbox_accounts_external_id_key" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "inbox_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text,
	"currency" text,
	"bank_connection_id" uuid,
	"enabled" boolean DEFAULT true NOT NULL,
	"account_id" text NOT NULL,
	"balance" numeric DEFAULT '0',
	"manual" boolean DEFAULT false,
	"type" "account_type",
	"base_currency" text,
	"base_balance" numeric,
	"error_details" text,
	"error_retries" smallint,
	"account_reference" text
);
--> statement-breakpoint
ALTER TABLE "bank_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"due_date" timestamp with time zone,
	"invoice_number" text,
	"customer_id" uuid,
	"amount" numeric,
	"currency" text,
	"line_items" jsonb,
	"payment_details" jsonb,
	"customer_details" jsonb,
	"company_datails" jsonb,
	"note" text,
	"internal_note" text,
	"team_id" uuid NOT NULL,
	"paid_at" timestamp with time zone,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('english'::regconfig, ((COALESCE((amount)::text, ''::text) || ' '::text) || COALESCE(invoice_number, ''::text)))) STORED,
	"vat" numeric,
	"tax" numeric,
	"url" text,
	"file_path" text[],
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"viewed_at" timestamp with time zone,
	"from_details" jsonb,
	"issue_date" timestamp with time zone,
	"template" jsonb,
	"note_details" jsonb,
	"customer_name" text,
	"token" text DEFAULT '' NOT NULL,
	"sent_to" text,
	"reminder_sent_at" timestamp with time zone,
	"discount" numeric,
	"file_size" bigint,
	"user_id" uuid,
	"subtotal" numeric,
	"top_block" jsonb,
	"bottom_block" jsonb,
	"sent_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"scheduled_job_id" text,
	CONSTRAINT "invoices_scheduled_job_id_key" UNIQUE("scheduled_job_id")
);
--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"country" text,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"state" text,
	"zip" text,
	"note" text,
	"team_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"website" text,
	"phone" text,
	"vat_number" text,
	"country_code" text,
	"token" text DEFAULT '' NOT NULL,
	"contact" text,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('english'::regconfig, ((((((((((((((((((COALESCE(name, ''::text) || ' '::text) || COALESCE(contact, ''::text)) || ' '::text) || COALESCE(phone, ''::text)) || ' '::text) || COALESCE(email, ''::text)) || ' '::text) || COALESCE(address_line_1, ''::text)) || ' '::text) || COALESCE(address_line_2, ''::text)) || ' '::text) || COALESCE(city, ''::text)) || ' '::text) || COALESCE(state, ''::text)) || ' '::text) || COALESCE(zip, ''::text)) || ' '::text) || COALESCE(country, ''::text)))) STORED
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base" text,
	"rate" numeric,
	"target" text,
	"updated_at" timestamp with time zone,
	CONSTRAINT "unique_rate" UNIQUE("base","target")
);
--> statement-breakpoint
ALTER TABLE "exchange_rates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "unique_tag_name" UNIQUE("team_id","name")
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tracker_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"link_id" text,
	"short_link" text,
	"team_id" uuid DEFAULT gen_random_uuid(),
	"project_id" uuid DEFAULT gen_random_uuid(),
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "tracker_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invoice_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tracker_project_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tracker_project_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	CONSTRAINT "unique_project_tag" UNIQUE("tracker_project_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "tracker_project_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"link_id" text,
	"team_id" uuid,
	"short_link" text,
	"from" timestamp with time zone,
	"to" timestamp with time zone,
	"type" "reportTypes",
	"expire_at" timestamp with time zone,
	"currency" text,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bank_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"institution_id" text NOT NULL,
	"expires_at" timestamp with time zone,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"access_token" text,
	"enrollment_id" text,
	"provider" "bank_providers",
	"last_accessed" timestamp with time zone,
	"reference_id" text,
	"status" "connection_status" DEFAULT 'connected',
	"error_details" text,
	"error_retries" smallint DEFAULT '0',
	CONSTRAINT "unique_bank_connections" UNIQUE("institution_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "bank_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid,
	"email" text,
	"role" "teamRoles",
	"code" text DEFAULT nanoid(24),
	"invited_by" uuid,
	CONSTRAINT "unique_team_invite" UNIQUE("team_id","email"),
	CONSTRAINT "user_invites_code_key" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "user_invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"team_id" uuid NOT NULL,
	CONSTRAINT "unique_slug_per_team" UNIQUE("slug","team_id")
);
--> statement-breakpoint
ALTER TABLE "document_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transaction_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	CONSTRAINT "unique_tag" UNIQUE("tag_id","transaction_id")
);
--> statement-breakpoint
ALTER TABLE "transaction_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transaction_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text,
	"transaction_id" uuid,
	"team_id" uuid,
	"size" bigint,
	"name" text,
	"path" text[]
);
--> statement-breakpoint
ALTER TABLE "transaction_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	"logo_url" text,
	"inbox_id" text DEFAULT generate_inbox(10),
	"email" text,
	"inbox_email" text,
	"inbox_forwarding" boolean DEFAULT true,
	"base_currency" text,
	"document_classification" boolean DEFAULT false,
	"flags" text[],
	"canceled_at" timestamp with time zone,
	"plan" "plans" DEFAULT 'trial' NOT NULL,
	CONSTRAINT "teams_inbox_id_key" UNIQUE("inbox_id")
);
--> statement-breakpoint
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb,
	"path_tokens" text[],
	"team_id" uuid,
	"parent_id" text,
	"object_id" uuid,
	"owner_id" uuid,
	"tag" text,
	"title" text,
	"body" text,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('english'::regconfig, ((title || ' '::text) || body))) STORED,
	"summary" text,
	"content" text,
	"date" date,
	"language" text,
	"processing_status" "document_processing_status" DEFAULT 'pending',
	"fts_simple" "tsvector",
	"fts_english" "tsvector",
	"fts_language" "tsvector"
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid DEFAULT gen_random_uuid(),
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"app_id" text NOT NULL,
	"created_by" uuid DEFAULT gen_random_uuid(),
	"settings" jsonb,
	CONSTRAINT "unique_app_id_team_id" UNIQUE("team_id","app_id")
);
--> statement-breakpoint
ALTER TABLE "apps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invoice_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
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
	"size" "invoice_size" DEFAULT 'a4',
	"date_format" text,
	"include_vat" boolean,
	"include_tax" boolean,
	"tax_rate" numeric,
	"delivery_type" "invoice_delivery_type" DEFAULT 'create' NOT NULL,
	"discount_label" text,
	"include_discount" boolean,
	"include_decimals" boolean,
	"include_qr" boolean,
	"total_summary_label" text,
	"title" text,
	"vat_rate" numeric,
	"include_units" boolean,
	"subtotal_label" text,
	"include_pdf" boolean,
	CONSTRAINT "invoice_templates_team_id_key" UNIQUE("team_id")
);
--> statement-breakpoint
ALTER TABLE "invoice_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transaction_enrichments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	"team_id" uuid,
	"category_slug" text,
	"system" boolean DEFAULT false,
	CONSTRAINT "unique_team_name" UNIQUE("name","team_id")
);
--> statement-breakpoint
ALTER TABLE "transaction_enrichments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"email" text,
	"team_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"locale" text DEFAULT 'en',
	"week_starts_on_monday" boolean DEFAULT false,
	"timezone" text,
	"time_format" numeric DEFAULT '24',
	"date_format" text
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tracker_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid,
	"rate" numeric,
	"currency" text,
	"status" "trackerStatus" DEFAULT 'in_progress' NOT NULL,
	"description" text,
	"name" text NOT NULL,
	"billable" boolean DEFAULT false,
	"estimate" bigint,
	"customer_id" uuid,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('english'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)))) STORED
);
--> statement-breakpoint
ALTER TABLE "tracker_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid,
	"file_path" text[],
	"file_name" text,
	"transaction_id" uuid,
	"amount" numeric,
	"currency" text,
	"content_type" text,
	"size" bigint,
	"attachment_id" uuid,
	"date" date,
	"forwarded_to" text,
	"reference_id" text,
	"meta" json,
	"status" "inbox_status" DEFAULT 'new',
	"website" text,
	"display_name" text,
	"fts" "tsvector" GENERATED ALWAYS AS (generate_inbox_fts(display_name, extract_product_names((meta -> 'products'::text)))) STORED,
	"type" "inbox_type",
	"description" text,
	"base_amount" numeric,
	"base_currency" text,
	"tax_amount" numeric,
	"tax_rate" numeric,
	"tax_type" text,
	CONSTRAINT "inbox_reference_id_key" UNIQUE("reference_id")
);
--> statement-breakpoint
ALTER TABLE "inbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_tag_assignments" (
	"document_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	CONSTRAINT "document_tag_assignments_pkey" PRIMARY KEY("document_id","tag_id"),
	CONSTRAINT "document_tag_assignments_unique" UNIQUE("document_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users_on_team" (
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"role" "teamRoles",
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "members_pkey" PRIMARY KEY("user_id","team_id","id")
);
--> statement-breakpoint
ALTER TABLE "users_on_team" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transaction_categories" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"team_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"system" boolean DEFAULT false,
	"slug" text NOT NULL,
	"vat" numeric,
	"description" text,
	"embedding" vector(384),
	CONSTRAINT "transaction_categories_pkey" PRIMARY KEY("team_id","slug"),
	CONSTRAINT "unique_team_slug" UNIQUE("team_id","slug")
);
--> statement-breakpoint
ALTER TABLE "transaction_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "public_transactions_assigned_id_fkey" FOREIGN KEY ("assigned_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "public_transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_slug_team_id_fkey" FOREIGN KEY ("team_id","category_slug") REFERENCES "public"."transaction_categories"("team_id","slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_entries" ADD CONSTRAINT "tracker_entries_assigned_id_fkey" FOREIGN KEY ("assigned_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_entries" ADD CONSTRAINT "tracker_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."tracker_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_entries" ADD CONSTRAINT "tracker_entries_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_accounts" ADD CONSTRAINT "inbox_accounts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_bank_connection_id_fkey" FOREIGN KEY ("bank_connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "public_bank_accounts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_reports" ADD CONSTRAINT "public_tracker_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_reports" ADD CONSTRAINT "public_tracker_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."tracker_projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tracker_reports" ADD CONSTRAINT "tracker_reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tracker_project_tags" ADD CONSTRAINT "project_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_project_tags" ADD CONSTRAINT "project_tags_tracker_project_id_fkey" FOREIGN KEY ("tracker_project_id") REFERENCES "public"."tracker_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_project_tags" ADD CONSTRAINT "tracker_project_tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "public_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "public_user_invites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "public_transaction_attachments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "public_transaction_attachments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "storage_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "integrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_enrichments" ADD CONSTRAINT "transaction_enrichments_category_slug_team_id_fkey" FOREIGN KEY ("team_id","category_slug") REFERENCES "public"."transaction_categories"("team_id","slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_enrichments" ADD CONSTRAINT "transaction_enrichments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_projects" ADD CONSTRAINT "tracker_projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_projects" ADD CONSTRAINT "tracker_projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "public"."transaction_attachments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "public_inbox_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "public_inbox_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."document_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_tag_embeddings_idx" ON "document_tag_embeddings" USING ivfflat ("embedding" vector_l2_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "idx_transactions_date" ON "transactions" USING btree ("date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_fts" ON "transactions" USING gin ("fts_vector" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_fts_vector" ON "transactions" USING gin ("fts_vector" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_id" ON "transactions" USING btree ("id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_name" ON "transactions" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_name_trigram" ON "transactions" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_team_id_date_name" ON "transactions" USING btree ("team_id" date_ops,"date" date_ops,"name" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_team_id_name" ON "transactions" USING btree ("team_id" uuid_ops,"name" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_trgm_name" ON "transactions" USING gist ("name" gist_trgm_ops);--> statement-breakpoint
CREATE INDEX "transactions_assigned_id_idx" ON "transactions" USING btree ("assigned_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transactions_bank_account_id_idx" ON "transactions" USING btree ("bank_account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transactions_category_slug_idx" ON "transactions" USING btree ("category_slug" text_ops);--> statement-breakpoint
CREATE INDEX "transactions_team_id_date_currency_bank_account_id_category_idx" ON "transactions" USING btree ("team_id" enum_ops,"date" date_ops,"currency" text_ops,"bank_account_id" date_ops,"category" date_ops);--> statement-breakpoint
CREATE INDEX "transactions_team_id_idx" ON "transactions" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_entries_team_id_idx" ON "tracker_entries" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bank_accounts_bank_connection_id_idx" ON "bank_accounts" USING btree ("bank_connection_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bank_accounts_created_by_idx" ON "bank_accounts" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "bank_accounts_team_id_idx" ON "bank_accounts" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "invoices_fts" ON "invoices" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "invoices_team_id_idx" ON "invoices" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "customers_fts" ON "customers" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "exchange_rates_base_target_idx" ON "exchange_rates" USING btree ("base" text_ops,"target" text_ops);--> statement-breakpoint
CREATE INDEX "tags_team_id_idx" ON "tags" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_reports_team_id_idx" ON "tracker_reports" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_project_tags_team_id_idx" ON "tracker_project_tags" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_project_tags_tracker_project_id_tag_id_team_id_idx" ON "tracker_project_tags" USING btree ("tracker_project_id" uuid_ops,"tag_id" uuid_ops,"team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "reports_team_id_idx" ON "reports" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bank_connections_team_id_idx" ON "bank_connections" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "user_invites_team_id_idx" ON "user_invites" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_tags_tag_id_idx" ON "transaction_tags" USING btree ("tag_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_tags_team_id_idx" ON "transaction_tags" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_tags_transaction_id_tag_id_team_id_idx" ON "transaction_tags" USING btree ("transaction_id" uuid_ops,"tag_id" uuid_ops,"team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_attachments_team_id_idx" ON "transaction_attachments" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_attachments_transaction_id_idx" ON "transaction_attachments" USING btree ("transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "documents_name_idx" ON "documents" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "documents_team_id_idx" ON "documents" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "documents_team_id_parent_id_idx" ON "documents" USING btree ("team_id" text_ops,"parent_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_fts_english" ON "documents" USING gin ("fts_english" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_fts_language" ON "documents" USING gin ("fts_language" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_fts_simple" ON "documents" USING gin ("fts_simple" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_gin_documents_title" ON "documents" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "transaction_enrichments_category_slug_team_id_idx" ON "transaction_enrichments" USING btree ("category_slug" text_ops,"team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_team_id_idx" ON "users" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_projects_fts" ON "tracker_projects" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "tracker_projects_team_id_idx" ON "tracker_projects" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_attachment_id_idx" ON "inbox" USING btree ("attachment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_created_at_idx" ON "inbox" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "inbox_team_id_idx" ON "inbox" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_transaction_id_idx" ON "inbox" USING btree ("transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_document_tag_assignments_document_id" ON "document_tag_assignments" USING btree ("document_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_document_tag_assignments_tag_id" ON "document_tag_assignments" USING btree ("tag_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_on_team_team_id_idx" ON "users_on_team" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_on_team_user_id_idx" ON "users_on_team" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_categories_team_id_idx" ON "transaction_categories" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."team_limits_metrics" AS (SELECT t.id AS team_id, COALESCE(sum((d.metadata ->> 'size'::text)::bigint), 0::numeric) AS total_document_size, count(DISTINCT u.id) AS number_of_users, count(DISTINCT bc.id) AS number_of_bank_connections, count(DISTINCT i.id) FILTER (WHERE date_trunc('month'::text, i.created_at) = date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS invoices_created_this_month, count(DISTINCT inbox.id) FILTER (WHERE date_trunc('month'::text, inbox.created_at) = date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS inbox_created_this_month FROM teams t LEFT JOIN documents d ON d.team_id = t.id LEFT JOIN users u ON u.team_id = t.id LEFT JOIN bank_connections bc ON bc.team_id = t.id LEFT JOIN invoices i ON i.team_id = t.id LEFT JOIN inbox ON inbox.team_id = t.id GROUP BY t.id);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "document_tag_embeddings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Transactions can be created by a member of the team" ON "transactions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Transactions can be deleted by a member of the team" ON "transactions" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Transactions can be selected by a member of the team" ON "transactions" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Transactions can be updated by a member of the team" ON "transactions" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Entries can be created by a member of the team" ON "tracker_entries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Entries can be deleted by a member of the team" ON "tracker_entries" AS PERMISSIVE FOR DELETE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Entries can be selected by a member of the team" ON "tracker_entries" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Entries can be updated by a member of the team" ON "tracker_entries" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Tags can be handled by a member of the team" ON "customer_tags" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Inbox accounts can be deleted by a member of the team" ON "inbox_accounts" AS PERMISSIVE FOR DELETE TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Inbox accounts can be selected by a member of the team" ON "inbox_accounts" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Inbox accounts can be updated by a member of the team" ON "inbox_accounts" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Bank Accounts can be created by a member of the team" ON "bank_accounts" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Bank Accounts can be deleted by a member of the team" ON "bank_accounts" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Bank Accounts can be selected by a member of the team" ON "bank_accounts" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Bank Accounts can be updated by a member of the team" ON "bank_accounts" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Invoices can be handled by a member of the team" ON "invoices" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Customers can be handled by members of the team" ON "customers" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users" ON "exchange_rates" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Tags can be handled by a member of the team" ON "tags" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Reports can be handled by a member of the team" ON "tracker_reports" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Tags can be handled by a member of the team" ON "tracker_project_tags" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Reports can be created by a member of the team" ON "reports" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Reports can be deleted by a member of the team" ON "reports" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Reports can be selected by a member of the team" ON "reports" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Reports can be updated by member of team" ON "reports" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Bank Connections can be created by a member of the team" ON "bank_connections" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Bank Connections can be deleted by a member of the team" ON "bank_connections" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Bank Connections can be selected by a member of the team" ON "bank_connections" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Bank Connections can be updated by a member of the team" ON "bank_connections" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable select for users based on email" ON "user_invites" AS PERMISSIVE FOR SELECT TO public USING (((auth.jwt() ->> 'email'::text) = email));--> statement-breakpoint
CREATE POLICY "User Invites can be created by a member of the team" ON "user_invites" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "User Invites can be deleted by a member of the team" ON "user_invites" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "User Invites can be deleted by invited email" ON "user_invites" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "User Invites can be selected by a member of the team" ON "user_invites" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "User Invites can be updated by a member of the team" ON "user_invites" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Tags can be handled by a member of the team" ON "document_tags" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Transaction Tags can be handled by a member of the team" ON "transaction_tags" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Transaction Attachments can be created by a member of the team" ON "transaction_attachments" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Transaction Attachments can be deleted by a member of the team" ON "transaction_attachments" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Transaction Attachments can be selected by a member of the team" ON "transaction_attachments" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Transaction Attachments can be updated by a member of the team" ON "transaction_attachments" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "teams" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Invited users can select team if they are invited." ON "teams" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Teams can be deleted by a member of the team" ON "teams" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Teams can be selected by a member of the team" ON "teams" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Teams can be updated by a member of the team" ON "teams" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Documents can be deleted by a member of the team" ON "documents" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Documents can be selected by a member of the team" ON "documents" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Documents can be updated by a member of the team" ON "documents" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "documents" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Apps can be deleted by a member of the team" ON "apps" AS PERMISSIVE FOR DELETE TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Apps can be inserted by a member of the team" ON "apps" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Apps can be selected by a member of the team" ON "apps" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Apps can be updated by a member of the team" ON "apps" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Invoice templates can be handled by a member of the team" ON "invoice_templates" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "transaction_enrichments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable update for authenticated users only" ON "transaction_enrichments" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can insert their own profile." ON "users" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can select their own profile." ON "users" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can select users if they are in the same team" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can update own profile." ON "users" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Projects can be created by a member of the team" ON "tracker_projects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Projects can be deleted by a member of the team" ON "tracker_projects" AS PERMISSIVE FOR DELETE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Projects can be selected by a member of the team" ON "tracker_projects" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Projects can be updated by a member of the team" ON "tracker_projects" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Inbox can be deleted by a member of the team" ON "inbox" AS PERMISSIVE FOR DELETE TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Inbox can be selected by a member of the team" ON "inbox" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Inbox can be updated by a member of the team" ON "inbox" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Tags can be handled by a member of the team" ON "document_tag_assignments" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "users_on_team" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable updates for users on team" ON "users_on_team" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Select for current user teams" ON "users_on_team" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users on team can be deleted by a member of the team" ON "users_on_team" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users on team can manage categories" ON "transaction_categories" AS PERMISSIVE FOR ALL TO public USING ((team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)));
*/