CREATE TYPE "public"."account_type" AS ENUM('depository', 'credit', 'other_asset', 'loan', 'other_liability');--> statement-breakpoint
CREATE TYPE "public"."accounting_provider" AS ENUM('xero', 'quickbooks', 'fortnox');--> statement-breakpoint
CREATE TYPE "public"."accounting_sync_status" AS ENUM('synced', 'failed', 'pending', 'partial');--> statement-breakpoint
CREATE TYPE "public"."accounting_sync_type" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."activity_source" AS ENUM('system', 'user');--> statement-breakpoint
CREATE TYPE "public"."activity_status" AS ENUM('unread', 'read', 'archived');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('transactions_enriched', 'transactions_created', 'invoice_paid', 'inbox_new', 'inbox_auto_matched', 'inbox_needs_review', 'inbox_cross_currency_matched', 'invoice_overdue', 'invoice_sent', 'inbox_match_confirmed', 'invoice_refunded', 'recurring_series_started', 'recurring_series_completed', 'recurring_series_paused', 'recurring_invoice_upcoming', 'document_uploaded', 'document_processed', 'invoice_duplicated', 'invoice_scheduled', 'invoice_reminder_sent', 'invoice_cancelled', 'invoice_created', 'draft_invoice_created', 'tracker_entry_created', 'tracker_project_created', 'transactions_categorized', 'transactions_assigned', 'transaction_attachment_created', 'transaction_category_created', 'transactions_exported', 'customer_created', 'insight_ready');--> statement-breakpoint
CREATE TYPE "public"."bank_providers" AS ENUM('gocardless', 'plaid', 'teller', 'enablebanking');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('disconnected', 'connected', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."document_processing_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."inbox_account_providers" AS ENUM('gmail', 'outlook');--> statement-breakpoint
CREATE TYPE "public"."inbox_account_status" AS ENUM('connected', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."inbox_blocklist_type" AS ENUM('email', 'domain');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('processing', 'pending', 'archived', 'new', 'analyzing', 'suggested_match', 'no_match', 'done', 'deleted', 'other');--> statement-breakpoint
CREATE TYPE "public"."inbox_type" AS ENUM('invoice', 'expense', 'other');--> statement-breakpoint
CREATE TYPE "public"."insight_period_type" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."insight_status" AS ENUM('pending', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."institution_status" AS ENUM('active', 'removed');--> statement-breakpoint
CREATE TYPE "public"."invoice_delivery_type" AS ENUM('create', 'create_and_send', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."invoice_recurring_end_type" AS ENUM('never', 'on_date', 'after_count');--> statement-breakpoint
CREATE TYPE "public"."invoice_recurring_frequency" AS ENUM('weekly', 'biweekly', 'monthly_date', 'monthly_weekday', 'monthly_last_day', 'quarterly', 'semi_annual', 'annual', 'custom');--> statement-breakpoint
CREATE TYPE "public"."invoice_recurring_status" AS ENUM('active', 'paused', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."invoice_size" AS ENUM('a4', 'letter');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'overdue', 'paid', 'unpaid', 'canceled', 'scheduled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."plans" AS ENUM('trial', 'starter', 'pro');--> statement-breakpoint
CREATE TYPE "public"."platform_provider" AS ENUM('slack', 'telegram', 'whatsapp', 'sendblue');--> statement-breakpoint
CREATE TYPE "public"."reportTypes" AS ENUM('profit', 'revenue', 'burn_rate', 'expense', 'monthly_revenue', 'revenue_forecast', 'runway', 'category_expenses');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."teamRoles" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."trackerStatus" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."transaction_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'semi_monthly', 'annually', 'irregular', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."transactionMethods" AS ENUM('payment', 'card_purchase', 'card_atm', 'transfer', 'other', 'unknown', 'ach', 'interest', 'deposit', 'wire', 'fee');--> statement-breakpoint
CREATE TYPE "public"."transactionStatus" AS ENUM('posted', 'pending', 'excluded', 'completed', 'archived', 'exported');--> statement-breakpoint
CREATE TABLE "accounting_sync_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"provider" "accounting_provider" NOT NULL,
	"provider_tenant_id" text NOT NULL,
	"provider_transaction_id" text,
	"synced_attachment_mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sync_type" "accounting_sync_type",
	"status" "accounting_sync_status" DEFAULT 'synced' NOT NULL,
	"error_message" text,
	"error_code" text,
	"provider_entity_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounting_sync_records_transaction_provider_key" UNIQUE("transaction_id","provider")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid,
	"type" "activity_type" NOT NULL,
	"priority" smallint DEFAULT 5,
	"group_id" uuid,
	"source" "activity_source" NOT NULL,
	"metadata" jsonb NOT NULL,
	"status" "activity_status" DEFAULT 'unread' NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_encrypted" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"key_hash" text,
	"scopes" text[] DEFAULT '{}'::text[] NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
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
	"balance" numeric(10, 2) DEFAULT 0,
	"manual" boolean DEFAULT false,
	"type" "account_type",
	"base_currency" text,
	"base_balance" numeric(10, 2),
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
	"available_balance" numeric(10, 2),
	"credit_limit" numeric(10, 2)
);
--> statement-breakpoint
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
	"provider" "bank_providers" NOT NULL,
	"last_accessed" timestamp with time zone,
	"reference_id" text,
	"status" "connection_status" DEFAULT 'connected',
	"error_details" text,
	"error_retries" smallint DEFAULT '0',
	CONSTRAINT "unique_bank_connections" UNIQUE("institution_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "customer_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "unique_customer_tag" UNIQUE("customer_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"billing_email" text,
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
	"status" text DEFAULT 'active',
	"preferred_currency" text,
	"default_payment_terms" integer,
	"is_archived" boolean DEFAULT false,
	"source" text DEFAULT 'manual',
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
	"portal_enabled" boolean DEFAULT false,
	"portal_id" text,
	"fts" "tsvector" GENERATED ALWAYS AS (
				to_tsvector(
					'english'::regconfig,
					COALESCE(name, ''::text) || ' ' ||
					COALESCE(contact, ''::text) || ' ' ||
					COALESCE(phone, ''::text) || ' ' ||
					COALESCE(email, ''::text) || ' ' ||
					COALESCE(address_line_1, ''::text) || ' ' ||
					COALESCE(address_line_2, ''::text) || ' ' ||
					COALESCE(city, ''::text) || ' ' ||
					COALESCE(state, ''::text) || ' ' ||
					COALESCE(zip, ''::text) || ' ' ||
					COALESCE(country, ''::text)
				)
			) STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_tag_assignments" (
	"document_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	CONSTRAINT "document_tag_assignments_pkey" PRIMARY KEY("document_id","tag_id"),
	CONSTRAINT "document_tag_assignments_unique" UNIQUE("document_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "document_tag_embeddings" (
	"slug" text PRIMARY KEY NOT NULL,
	"embedding" vector(768),
	"name" text NOT NULL,
	"model" text DEFAULT 'gemini-embedding-001' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"team_id" uuid NOT NULL,
	CONSTRAINT "unique_slug_per_team" UNIQUE("slug","team_id")
);
--> statement-breakpoint
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
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base" text,
	"rate" numeric(10, 2),
	"target" text,
	"updated_at" timestamp with time zone,
	CONSTRAINT "unique_rate" UNIQUE("base","target")
);
--> statement-breakpoint
CREATE TABLE "inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid,
	"file_path" text[],
	"file_name" text,
	"transaction_id" uuid,
	"amount" numeric(10, 2),
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
	"sender_email" text,
	"display_name" text,
	"fts" "tsvector" GENERATED ALWAYS AS (generate_inbox_fts(display_name, extract_product_names((meta -> 'products'::text)))) STORED NOT NULL,
	"type" "inbox_type",
	"description" text,
	"base_amount" numeric(10, 2),
	"base_currency" text,
	"tax_amount" numeric(10, 2),
	"tax_rate" numeric(10, 2),
	"tax_type" text,
	"inbox_account_id" uuid,
	"invoice_number" text,
	"grouped_inbox_id" uuid,
	CONSTRAINT "inbox_reference_id_key" UNIQUE("reference_id")
);
--> statement-breakpoint
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
	"status" "inbox_account_status" DEFAULT 'connected' NOT NULL,
	"error_message" text,
	CONSTRAINT "inbox_accounts_email_key" UNIQUE("email"),
	CONSTRAINT "inbox_accounts_external_id_key" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "inbox_blocklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"type" "inbox_blocklist_type" NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "inbox_blocklist_team_id_type_value_key" UNIQUE("team_id","type","value")
);
--> statement-breakpoint
CREATE TABLE "insight_user_status" (
	"insight_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insight_user_status_insight_id_user_id_pk" PRIMARY KEY("insight_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"period_type" "insight_period_type" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"period_year" smallint NOT NULL,
	"period_number" smallint NOT NULL,
	"status" "insight_status" DEFAULT 'pending' NOT NULL,
	"selected_metrics" jsonb,
	"all_metrics" jsonb,
	"anomalies" jsonb,
	"expense_anomalies" jsonb,
	"milestones" jsonb,
	"activity" jsonb,
	"currency" varchar(3) NOT NULL,
	"title" text,
	"content" jsonb,
	"predictions" jsonb,
	"audio_path" text,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insights_team_period_unique" UNIQUE("team_id","period_type","period_year","period_number")
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"provider" "bank_providers" NOT NULL,
	"countries" text[] NOT NULL,
	"available_history" integer,
	"maximum_consent_validity" integer,
	"popularity" integer DEFAULT 0 NOT NULL,
	"type" text,
	"status" "institution_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"team_id" uuid NOT NULL,
	"created_by" uuid,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"currency" text,
	"unit" text,
	"tax_rate" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"fts" "tsvector" GENERATED ALWAYS AS (
          to_tsvector(
            'english',
            (
              (COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)
            )
          )
        ) STORED NOT NULL,
	CONSTRAINT "invoice_products_team_name_currency_price_unique" UNIQUE("team_id","name","currency","price")
);
--> statement-breakpoint
CREATE TABLE "invoice_recurring" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"customer_id" uuid,
	"frequency" "invoice_recurring_frequency" NOT NULL,
	"frequency_day" integer,
	"frequency_week" integer,
	"frequency_interval" integer,
	"end_type" "invoice_recurring_end_type" NOT NULL,
	"end_date" timestamp with time zone,
	"end_count" integer,
	"status" "invoice_recurring_status" DEFAULT 'active' NOT NULL,
	"invoices_generated" integer DEFAULT 0 NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"next_scheduled_at" timestamp with time zone,
	"last_generated_at" timestamp with time zone,
	"timezone" text NOT NULL,
	"due_date_offset" integer DEFAULT 30 NOT NULL,
	"amount" numeric(10, 2),
	"currency" text,
	"line_items" jsonb,
	"template" jsonb,
	"payment_details" jsonb,
	"from_details" jsonb,
	"note_details" jsonb,
	"customer_name" text,
	"vat" numeric(10, 2),
	"tax" numeric(10, 2),
	"discount" numeric(10, 2),
	"subtotal" numeric(10, 2),
	"top_block" jsonb,
	"bottom_block" jsonb,
	"template_id" uuid,
	"upcoming_notification_sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invoice_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text DEFAULT 'Default' NOT NULL,
	"is_default" boolean DEFAULT false,
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
	"size" "invoice_size" DEFAULT 'a4',
	"date_format" text,
	"include_vat" boolean,
	"include_tax" boolean,
	"tax_rate" numeric(10, 2),
	"delivery_type" "invoice_delivery_type" DEFAULT 'create' NOT NULL,
	"discount_label" text,
	"include_discount" boolean,
	"include_decimals" boolean,
	"include_qr" boolean,
	"total_summary_label" text,
	"title" text,
	"vat_rate" numeric(10, 2),
	"include_units" boolean,
	"subtotal_label" text,
	"include_pdf" boolean,
	"send_copy" boolean,
	"include_line_item_tax" boolean DEFAULT false,
	"line_item_tax_label" text,
	"payment_enabled" boolean DEFAULT false,
	"payment_terms_days" integer DEFAULT 30,
	"email_subject" text,
	"email_heading" text,
	"email_body" text,
	"email_button_text" text
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"due_date" timestamp with time zone,
	"invoice_number" text,
	"customer_id" uuid,
	"amount" numeric(10, 2),
	"currency" text,
	"line_items" jsonb,
	"payment_details" jsonb,
	"customer_details" jsonb,
	"company_datails" jsonb,
	"note" text,
	"internal_note" text,
	"team_id" uuid NOT NULL,
	"paid_at" timestamp with time zone,
	"fts" "tsvector" GENERATED ALWAYS AS (
        to_tsvector(
          'english',
          (
            (COALESCE((amount)::text, ''::text) || ' '::text) || COALESCE(invoice_number, ''::text)
          )
        )
      ) STORED NOT NULL,
	"vat" numeric(10, 2),
	"tax" numeric(10, 2),
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
	"discount" numeric(10, 2),
	"file_size" bigint,
	"user_id" uuid,
	"subtotal" numeric(10, 2),
	"top_block" jsonb,
	"bottom_block" jsonb,
	"sent_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"scheduled_job_id" text,
	"template_id" uuid,
	"payment_intent_id" text,
	"refunded_at" timestamp with time zone,
	"invoice_recurring_id" uuid,
	"recurring_sequence" integer,
	CONSTRAINT "invoices_scheduled_job_id_key" UNIQUE("scheduled_job_id")
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"notification_type" text NOT NULL,
	"channel" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_team_type_channel_key" UNIQUE("user_id","team_id","notification_type","channel")
);
--> statement-breakpoint
CREATE TABLE "oauth_access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"refresh_token" text,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"scopes" text[] NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"refresh_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked" boolean DEFAULT false,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "oauth_access_tokens_token_unique" UNIQUE("token"),
	CONSTRAINT "oauth_access_tokens_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "oauth_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"overview" text,
	"developer_name" text,
	"logo_url" text,
	"website" text,
	"install_url" text,
	"screenshots" text[] DEFAULT '{}'::text[],
	"redirect_uris" text[] NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text,
	"scopes" text[] DEFAULT '{}'::text[] NOT NULL,
	"team_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_public" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"status" text DEFAULT 'draft',
	CONSTRAINT "oauth_applications_slug_unique" UNIQUE("slug"),
	CONSTRAINT "oauth_applications_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_authorization_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"scopes" text[] NOT NULL,
	"redirect_uri" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used" boolean DEFAULT false,
	"code_challenge" text,
	"code_challenge_method" text,
	CONSTRAINT "oauth_authorization_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "platform_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "platform_provider" NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"external_user_id" text NOT NULL,
	"external_team_id" text DEFAULT '' NOT NULL,
	"external_channel_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "platform_identities_provider_external_unique" UNIQUE("provider","external_team_id","external_user_id")
);
--> statement-breakpoint
CREATE TABLE "platform_link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"provider" "platform_provider" NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "platform_link_tokens_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "provider_notification_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_key" text NOT NULL,
	"platform_identity_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "platform_provider" NOT NULL,
	"event_family" text NOT NULL,
	"payload" jsonb NOT NULL,
	"notification_context" jsonb,
	"window_ends_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "provider_notification_batches_batch_key_unique" UNIQUE("batch_key")
);
--> statement-breakpoint
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
CREATE TABLE "short_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_id" text NOT NULL,
	"url" text NOT NULL,
	"type" text,
	"size" numeric(10, 2),
	"mime_type" text,
	"file_name" text,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "short_links_short_id_unique" UNIQUE("short_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "unique_tag_name" UNIQUE("team_id","name")
);
--> statement-breakpoint
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
	"country_code" text,
	"fiscal_year_start_month" smallint,
	"document_classification" boolean DEFAULT false,
	"flags" text[],
	"canceled_at" timestamp with time zone,
	"plan" "plans" DEFAULT 'trial' NOT NULL,
	"subscription_status" "subscription_status",
	"export_settings" jsonb,
	"stripe_account_id" text,
	"stripe_connect_status" text,
	"company_type" text,
	"heard_about" text,
	CONSTRAINT "teams_inbox_id_key" UNIQUE("inbox_id")
);
--> statement-breakpoint
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
	"rate" numeric(10, 2),
	"currency" text,
	"billed" boolean DEFAULT false,
	"date" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracker_project_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tracker_project_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	CONSTRAINT "unique_project_tag" UNIQUE("tracker_project_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tracker_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid,
	"rate" numeric(10, 2),
	"currency" text,
	"status" "trackerStatus" DEFAULT 'in_progress' NOT NULL,
	"description" text,
	"name" text NOT NULL,
	"billable" boolean DEFAULT false,
	"estimate" bigint,
	"customer_id" uuid,
	"fts" "tsvector" GENERATED ALWAYS AS (
          to_tsvector(
            'english'::regconfig,
            (
              (COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)
            )
          )
        ) STORED NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "transaction_categories" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"team_id" uuid NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"system" boolean DEFAULT false,
	"slug" text,
	"tax_rate" numeric(10, 2),
	"tax_type" text,
	"tax_reporting_code" text,
	"excluded" boolean DEFAULT false,
	"description" text,
	"parent_id" uuid,
	CONSTRAINT "transaction_categories_pkey" PRIMARY KEY("team_id","slug"),
	CONSTRAINT "transaction_categories_id_unique" UNIQUE("id"),
	CONSTRAINT "unique_team_slug" UNIQUE("team_id","slug")
);
--> statement-breakpoint
CREATE TABLE "transaction_category_embeddings" (
	"name" text PRIMARY KEY NOT NULL,
	"embedding" vector(768),
	"model" text DEFAULT 'gemini-embedding-001' NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "transaction_match_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"inbox_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"confidence_score" numeric(4, 3) NOT NULL,
	"amount_score" numeric(4, 3),
	"currency_score" numeric(4, 3),
	"date_score" numeric(4, 3),
	"name_score" numeric(4, 3),
	"match_type" text NOT NULL,
	"match_details" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_action_at" timestamp with time zone,
	"user_id" uuid,
	CONSTRAINT "transaction_match_suggestions_unique" UNIQUE("inbox_id","transaction_id")
);
--> statement-breakpoint
CREATE TABLE "transaction_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	CONSTRAINT "unique_tag" UNIQUE("tag_id","transaction_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"date" date NOT NULL,
	"name" text NOT NULL,
	"method" "transactionMethods" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"team_id" uuid NOT NULL,
	"assigned_id" uuid,
	"note" varchar,
	"bank_account_id" uuid,
	"internal_id" text NOT NULL,
	"status" "transactionStatus" DEFAULT 'posted',
	"balance" numeric(10, 2),
	"manual" boolean DEFAULT false,
	"notified" boolean DEFAULT false,
	"internal" boolean DEFAULT false,
	"description" text,
	"category_slug" text,
	"base_amount" numeric(10, 2),
	"counterparty_name" text,
	"base_currency" text,
	"tax_amount" numeric(10, 2),
	"tax_rate" numeric(10, 2),
	"tax_type" text,
	"recurring" boolean,
	"frequency" "transaction_frequency",
	"merchant_name" text,
	"enrichment_completed" boolean DEFAULT false,
	"fts_vector" "tsvector" GENERATED ALWAYS AS (
				to_tsvector(
					'english',
					(
						(COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)
					)
				)
			) STORED NOT NULL,
	CONSTRAINT "transactions_internal_id_key" UNIQUE("internal_id")
);
--> statement-breakpoint
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
	"timezone_auto_sync" boolean DEFAULT true,
	"time_format" numeric DEFAULT 24,
	"date_format" text
);
--> statement-breakpoint
CREATE TABLE "users_on_team" (
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"role" "teamRoles",
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "members_pkey" PRIMARY KEY("user_id","team_id","id")
);
--> statement-breakpoint
ALTER TABLE "accounting_sync_records" ADD CONSTRAINT "accounting_sync_records_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_sync_records" ADD CONSTRAINT "accounting_sync_records_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "integrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_bank_connection_id_fkey" FOREIGN KEY ("bank_connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "public_bank_accounts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."document_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "storage_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "public"."transaction_attachments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "public_inbox_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "public_inbox_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_inbox_account_id_fkey" FOREIGN KEY ("inbox_account_id") REFERENCES "public"."inbox_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_accounts" ADD CONSTRAINT "inbox_accounts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_blocklist" ADD CONSTRAINT "inbox_blocklist_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_user_status" ADD CONSTRAINT "insight_user_status_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_user_status" ADD CONSTRAINT "insight_user_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_products" ADD CONSTRAINT "invoice_products_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_products" ADD CONSTRAINT "invoice_products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_recurring" ADD CONSTRAINT "invoice_recurring_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_recurring" ADD CONSTRAINT "invoice_recurring_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_recurring" ADD CONSTRAINT "invoice_recurring_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_recurring" ADD CONSTRAINT "invoice_recurring_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."invoice_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."invoice_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_recurring_id_fkey" FOREIGN KEY ("invoice_recurring_id") REFERENCES "public"."invoice_recurring"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."oauth_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_applications" ADD CONSTRAINT "oauth_applications_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_applications" ADD CONSTRAINT "oauth_applications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."oauth_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_identities" ADD CONSTRAINT "platform_identities_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_identities" ADD CONSTRAINT "platform_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_link_tokens" ADD CONSTRAINT "platform_link_tokens_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_link_tokens" ADD CONSTRAINT "platform_link_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_notification_batches" ADD CONSTRAINT "provider_notification_batches_identity_id_fkey" FOREIGN KEY ("platform_identity_id") REFERENCES "public"."platform_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_notification_batches" ADD CONSTRAINT "provider_notification_batches_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_notification_batches" ADD CONSTRAINT "provider_notification_batches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "public_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_entries" ADD CONSTRAINT "tracker_entries_assigned_id_fkey" FOREIGN KEY ("assigned_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_entries" ADD CONSTRAINT "tracker_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."tracker_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_entries" ADD CONSTRAINT "tracker_entries_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_project_tags" ADD CONSTRAINT "project_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_project_tags" ADD CONSTRAINT "project_tags_tracker_project_id_fkey" FOREIGN KEY ("tracker_project_id") REFERENCES "public"."tracker_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_project_tags" ADD CONSTRAINT "tracker_project_tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_projects" ADD CONSTRAINT "tracker_projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_projects" ADD CONSTRAINT "tracker_projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_reports" ADD CONSTRAINT "public_tracker_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_reports" ADD CONSTRAINT "public_tracker_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."tracker_projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tracker_reports" ADD CONSTRAINT "tracker_reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "public_transaction_attachments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "public_transaction_attachments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."transaction_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_enrichments" ADD CONSTRAINT "transaction_enrichments_category_slug_team_id_fkey" FOREIGN KEY ("team_id","category_slug") REFERENCES "public"."transaction_categories"("team_id","slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_enrichments" ADD CONSTRAINT "transaction_enrichments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "public"."inbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "public_transactions_assigned_id_fkey" FOREIGN KEY ("assigned_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "public_transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_slug_team_id_fkey" FOREIGN KEY ("team_id","category_slug") REFERENCES "public"."transaction_categories"("team_id","slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "public_user_invites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounting_sync_transaction" ON "accounting_sync_records" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_accounting_sync_team_provider" ON "accounting_sync_records" USING btree ("team_id","provider");--> statement-breakpoint
CREATE INDEX "idx_accounting_sync_status" ON "accounting_sync_records" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "activities_notifications_idx" ON "activities" USING btree ("team_id","priority","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_insights_idx" ON "activities" USING btree ("team_id","type","source","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_metadata_gin_idx" ON "activities" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "activities_group_id_idx" ON "activities" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "activities_insights_group_idx" ON "activities" USING btree ("team_id","group_id","type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "api_keys_key_idx" ON "api_keys" USING btree ("key_hash" text_ops);--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "api_keys_team_id_idx" ON "api_keys" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bank_accounts_bank_connection_id_idx" ON "bank_accounts" USING btree ("bank_connection_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bank_accounts_created_by_idx" ON "bank_accounts" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "bank_accounts_team_id_idx" ON "bank_accounts" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bank_connections_team_id_idx" ON "bank_connections" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "customers_fts" ON "customers" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_customers_status" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_customers_is_archived" ON "customers" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "idx_customers_enrichment_status" ON "customers" USING btree ("enrichment_status");--> statement-breakpoint
CREATE INDEX "idx_customers_website" ON "customers" USING btree ("website");--> statement-breakpoint
CREATE INDEX "idx_customers_industry" ON "customers" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "customers_team_id_idx" ON "customers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "customers_team_created_at_idx" ON "customers" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_document_tag_assignments_document_id" ON "document_tag_assignments" USING btree ("document_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_document_tag_assignments_tag_id" ON "document_tag_assignments" USING btree ("tag_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "documents_name_idx" ON "documents" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "documents_team_id_idx" ON "documents" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "documents_team_id_parent_id_idx" ON "documents" USING btree ("team_id","parent_id" text_ops);--> statement-breakpoint
CREATE INDEX "documents_team_id_created_at_idx" ON "documents" USING btree ("team_id" uuid_ops,"created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "documents_team_id_date_idx" ON "documents" USING btree ("team_id" uuid_ops,"date");--> statement-breakpoint
CREATE INDEX "documents_team_id_name_idx" ON "documents" USING btree ("team_id" uuid_ops,"name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_fts_english" ON "documents" USING gin ("fts_english" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_fts_language" ON "documents" USING gin ("fts_language" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_fts_simple" ON "documents" USING gin ("fts_simple" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_gin_documents_title" ON "documents" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_gin_documents_name" ON "documents" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "exchange_rates_base_target_idx" ON "exchange_rates" USING btree ("base" text_ops,"target" text_ops);--> statement-breakpoint
CREATE INDEX "inbox_attachment_id_idx" ON "inbox" USING btree ("attachment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_created_at_idx" ON "inbox" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "inbox_team_id_idx" ON "inbox" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_transaction_id_idx" ON "inbox" USING btree ("transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_inbox_account_id_idx" ON "inbox" USING btree ("inbox_account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inbox_invoice_number_idx" ON "inbox" USING btree ("invoice_number" text_ops);--> statement-breakpoint
CREATE INDEX "inbox_grouped_inbox_id_idx" ON "inbox" USING btree ("grouped_inbox_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_inbox_display_name_trgm" ON "inbox" USING gin ("display_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "inbox_team_status_created_at_idx" ON "inbox" USING btree ("team_id","status","created_at");--> statement-breakpoint
CREATE INDEX "insight_user_status_user_idx" ON "insight_user_status" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "insight_user_status_insight_idx" ON "insight_user_status" USING btree ("insight_id");--> statement-breakpoint
CREATE INDEX "insights_team_id_idx" ON "insights" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "insights_team_period_type_idx" ON "insights" USING btree ("team_id","period_type","generated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "institutions_country_idx" ON "institutions" USING gin ("countries");--> statement-breakpoint
CREATE INDEX "institutions_name_trgm_idx" ON "institutions" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "institutions_status_idx" ON "institutions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_products_team_id_idx" ON "invoice_products" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "invoice_products_created_by_idx" ON "invoice_products" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "invoice_products_fts_idx" ON "invoice_products" USING gin ("fts");--> statement-breakpoint
CREATE INDEX "invoice_products_name_idx" ON "invoice_products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "invoice_products_usage_count_idx" ON "invoice_products" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX "invoice_products_last_used_at_idx" ON "invoice_products" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "invoice_products_team_active_idx" ON "invoice_products" USING btree ("team_id","is_active");--> statement-breakpoint
CREATE INDEX "invoice_recurring_team_id_idx" ON "invoice_recurring" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "invoice_recurring_next_scheduled_at_idx" ON "invoice_recurring" USING btree ("next_scheduled_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "invoice_recurring_status_idx" ON "invoice_recurring" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_recurring_active_scheduled_idx" ON "invoice_recurring" USING btree ("next_scheduled_at" timestamptz_ops) WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_invoice_templates_team_id" ON "invoice_templates" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "invoices_fts" ON "invoices" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "invoices_team_id_idx" ON "invoices" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "invoices_template_id_idx" ON "invoices" USING btree ("template_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "invoices_team_sent_at_idx" ON "invoices" USING btree ("team_id","sent_at");--> statement-breakpoint
CREATE INDEX "invoices_team_status_paid_at_idx" ON "invoices" USING btree ("team_id","status","paid_at");--> statement-breakpoint
CREATE INDEX "invoices_invoice_recurring_id_idx" ON "invoices" USING btree ("invoice_recurring_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_recurring_sequence_unique_idx" ON "invoices" USING btree ("invoice_recurring_id","recurring_sequence") WHERE invoice_recurring_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "invoices_team_due_date_idx" ON "invoices" USING btree ("team_id","due_date" DESC NULLS LAST) WHERE due_date IS NOT NULL;--> statement-breakpoint
CREATE INDEX "invoices_team_status_due_date_idx" ON "invoices" USING btree ("team_id","status","due_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "invoices_team_customer_id_idx" ON "invoices" USING btree ("team_id","customer_id") WHERE customer_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "invoices_customer_id_idx" ON "invoices" USING btree ("customer_id") WHERE customer_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "invoices_team_created_at_idx" ON "invoices" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_settings_user_team_idx" ON "notification_settings" USING btree ("user_id","team_id");--> statement-breakpoint
CREATE INDEX "notification_settings_type_channel_idx" ON "notification_settings" USING btree ("notification_type","channel");--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_token_idx" ON "oauth_access_tokens" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_refresh_token_idx" ON "oauth_access_tokens" USING btree ("refresh_token" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_application_id_idx" ON "oauth_access_tokens" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "oauth_access_tokens_user_id_idx" ON "oauth_access_tokens" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "oauth_applications_team_id_idx" ON "oauth_applications" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "oauth_applications_client_id_idx" ON "oauth_applications" USING btree ("client_id" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_applications_slug_idx" ON "oauth_applications" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_authorization_codes_code_idx" ON "oauth_authorization_codes" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX "oauth_authorization_codes_application_id_idx" ON "oauth_authorization_codes" USING btree ("application_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "oauth_authorization_codes_user_id_idx" ON "oauth_authorization_codes" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "platform_identities_provider_external_idx" ON "platform_identities" USING btree ("provider","external_team_id","external_user_id");--> statement-breakpoint
CREATE INDEX "platform_identities_team_id_idx" ON "platform_identities" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "platform_identities_user_id_idx" ON "platform_identities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_link_tokens_code_idx" ON "platform_link_tokens" USING btree ("code");--> statement-breakpoint
CREATE INDEX "platform_link_tokens_team_id_idx" ON "platform_link_tokens" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "platform_link_tokens_user_id_idx" ON "platform_link_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "provider_notification_batches_due_idx" ON "provider_notification_batches" USING btree ("sent_at","window_ends_at");--> statement-breakpoint
CREATE INDEX "provider_notification_batches_identity_idx" ON "provider_notification_batches" USING btree ("platform_identity_id");--> statement-breakpoint
CREATE INDEX "provider_notification_batches_team_id_idx" ON "provider_notification_batches" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "reports_team_id_idx" ON "reports" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "short_links_short_id_idx" ON "short_links" USING btree ("short_id" text_ops);--> statement-breakpoint
CREATE INDEX "short_links_team_id_idx" ON "short_links" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "short_links_user_id_idx" ON "short_links" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tags_team_id_idx" ON "tags" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_entries_team_id_idx" ON "tracker_entries" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_entries_team_date_idx" ON "tracker_entries" USING btree ("team_id","date");--> statement-breakpoint
CREATE INDEX "tracker_project_tags_team_id_idx" ON "tracker_project_tags" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_project_tags_tracker_project_id_tag_id_team_id_idx" ON "tracker_project_tags" USING btree ("tracker_project_id" uuid_ops,"tag_id" uuid_ops,"team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_projects_fts" ON "tracker_projects" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "tracker_projects_team_id_idx" ON "tracker_projects" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "tracker_reports_team_id_idx" ON "tracker_reports" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_attachments_team_id_idx" ON "transaction_attachments" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_attachments_transaction_id_idx" ON "transaction_attachments" USING btree ("transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_categories_team_id_idx" ON "transaction_categories" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_categories_parent_id_idx" ON "transaction_categories" USING btree ("parent_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_category_embeddings_system_idx" ON "transaction_category_embeddings" USING btree ("system" bool_ops);--> statement-breakpoint
CREATE INDEX "transaction_enrichments_category_slug_team_id_idx" ON "transaction_enrichments" USING btree ("category_slug" text_ops,"team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_inbox_id_idx" ON "transaction_match_suggestions" USING btree ("inbox_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_transaction_id_idx" ON "transaction_match_suggestions" USING btree ("transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_team_id_idx" ON "transaction_match_suggestions" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_status_idx" ON "transaction_match_suggestions" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_confidence_idx" ON "transaction_match_suggestions" USING btree ("confidence_score" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_lookup_idx" ON "transaction_match_suggestions" USING btree ("transaction_id" uuid_ops,"team_id" uuid_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_team_status_created_idx" ON "transaction_match_suggestions" USING btree ("team_id" uuid_ops,"status" text_ops,"created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "transaction_tags_tag_id_idx" ON "transaction_tags" USING btree ("tag_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_tags_team_id_idx" ON "transaction_tags" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_tags_transaction_id_tag_id_team_id_idx" ON "transaction_tags" USING btree ("transaction_id" uuid_ops,"tag_id" uuid_ops,"team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_date" ON "transactions" USING btree ("date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_fts" ON "transactions" USING gin ("fts_vector" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_fts_vector" ON "transactions" USING gin ("fts_vector" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_id" ON "transactions" USING btree ("id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_name" ON "transactions" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_merchant_name_trgm" ON "transactions" USING gin ("merchant_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_team_id_date_name" ON "transactions" USING btree ("team_id","date" date_ops,"name");--> statement-breakpoint
CREATE INDEX "idx_transactions_team_id_name" ON "transactions" USING btree ("team_id" uuid_ops,"name");--> statement-breakpoint
CREATE INDEX "idx_trgm_name" ON "transactions" USING gist ("name" gist_trgm_ops);--> statement-breakpoint
CREATE INDEX "transactions_assigned_id_idx" ON "transactions" USING btree ("assigned_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transactions_bank_account_id_idx" ON "transactions" USING btree ("bank_account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transactions_category_slug_idx" ON "transactions" USING btree ("category_slug" text_ops);--> statement-breakpoint
CREATE INDEX "transactions_team_id_date_currency_bank_account_id_category_idx" ON "transactions" USING btree ("team_id","date" date_ops,"currency" text_ops,"bank_account_id");--> statement-breakpoint
CREATE INDEX "transactions_team_id_idx" ON "transactions" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_transactions_reports" ON "transactions" USING btree ("team_id" uuid_ops,"date" date_ops,"category_slug" text_ops) WHERE internal = false AND status != 'excluded';--> statement-breakpoint
CREATE INDEX "user_invites_team_id_idx" ON "user_invites" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_team_id_idx" ON "users" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_on_team_team_id_idx" ON "users_on_team" USING btree ("team_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_on_team_user_id_idx" ON "users_on_team" USING btree ("user_id" uuid_ops);