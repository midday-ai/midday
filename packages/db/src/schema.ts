import type { UIChatMessage } from "@api/ai/types";
import { type SQL, relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  date,
  foreignKey,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return "tsvector";
  },
});

type NumericConfig = {
  precision?: number;
  scale?: number;
};

export const numericCasted = customType<{
  data: number;
  driverData: string;
  config: NumericConfig;
}>({
  dataType: (config) => {
    if (config?.precision && config?.scale) {
      return `numeric(${config.precision}, ${config.scale})`;
    }
    return "numeric";
  },
  fromDriver: (value: string) => Number.parseFloat(value),
  toDriver: (value: number) => value.toString(),
});

export const accountTypeEnum = pgEnum("account_type", [
  "depository",
  "credit",
  "other_asset",
  "loan",
  "other_liability",
]);

export const bankProvidersEnum = pgEnum("bank_providers", [
  "gocardless",
  "plaid",
  "teller",
  "enablebanking",
]);

export const connectionStatusEnum = pgEnum("connection_status", [
  "disconnected",
  "connected",
  "unknown",
]);

export const documentProcessingStatusEnum = pgEnum(
  "document_processing_status",
  ["pending", "processing", "completed", "failed"],
);

export const inboxAccountProvidersEnum = pgEnum("inbox_account_providers", [
  "gmail",
  "outlook",
]);

export const inboxAccountStatusEnum = pgEnum("inbox_account_status", [
  "connected",
  "disconnected",
]);

export const accountingProviderEnum = pgEnum("accounting_provider", [
  "xero",
  "quickbooks",
  "fortnox",
]);

export const accountingSyncStatusEnum = pgEnum("accounting_sync_status", [
  "synced",
  "failed",
  "pending",
  "partial",
]);

export const accountingSyncTypeEnum = pgEnum("accounting_sync_type", [
  "auto",
  "manual",
]);

export const inboxStatusEnum = pgEnum("inbox_status", [
  "processing",
  "pending",
  "archived",
  "new",
  "analyzing",
  "suggested_match",
  "no_match",
  "done",
  "deleted",
]);

export const inboxTypeEnum = pgEnum("inbox_type", ["deal", "expense"]);
export const inboxBlocklistTypeEnum = pgEnum("inbox_blocklist_type", [
  "email",
  "domain",
]);
export const dealDeliveryTypeEnum = pgEnum("deal_delivery_type", [
  "create",
  "create_and_send",
  "scheduled",
]);

export const dealSizeEnum = pgEnum("deal_size", ["a4", "letter"]);
export const dealStatusEnum = pgEnum("deal_status", [
  "draft",
  "overdue",
  "paid",
  "unpaid",
  "canceled",
  "scheduled",
  "refunded",
]);

export const dealRecurringFrequencyEnum = pgEnum(
  "deal_recurring_frequency",
  [
    "weekly",
    "biweekly", // Every 2 weeks on the same weekday
    "monthly_date", // Monthly on specific date (e.g., 15th)
    "monthly_weekday", // Monthly on nth weekday (e.g., 1st Friday)
    "monthly_last_day", // Monthly on the last day of the month
    "quarterly", // Every 3 months
    "semi_annual", // Every 6 months
    "annual", // Every 12 months
    "custom", // Every X days
  ],
);

export const dealRecurringEndTypeEnum = pgEnum(
  "deal_recurring_end_type",
  ["never", "on_date", "after_count"],
);

export const dealRecurringStatusEnum = pgEnum("deal_recurring_status", [
  "active",
  "paused",
  "completed",
  "canceled",
]);

export const plansEnum = pgEnum("plans", ["trial", "starter", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
]);
export const reportTypesEnum = pgEnum("reportTypes", [
  "profit",
  "revenue",
  "burn_rate",
  "expense",
  "monthly_revenue",
  "revenue_forecast",
  "runway",
  "category_expenses",
]);

export const teamRolesEnum = pgEnum("teamRoles", [
  "owner",
  "admin",
  "member",
  "broker",
  "syndicate",
  "merchant",
  "bookkeeper",
]);

export const transactionMethodsEnum = pgEnum("transactionMethods", [
  "payment",
  "card_purchase",
  "card_atm",
  "transfer",
  "other",
  "unknown",
  "ach",
  "interest",
  "deposit",
  "wire",
  "fee",
]);

export const transactionStatusEnum = pgEnum("transactionStatus", [
  "pending",
  "posted",
  "failed",
  "refund",
  "funding",
  "excluded",
]);

export const transactionFrequencyEnum = pgEnum("transaction_frequency", [
  "weekly",
  "biweekly",
  "monthly",
  "semi_monthly",
  "annually",
  "irregular",
  "unknown",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "credit",
  "debit",
  "refund",
  "fee",
  "adjustment",
  "transfer",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "completed",
  "failed",
  "pending",
  "refunded",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "unmatched",
  "auto_matched",
  "suggested",
  "manual_matched",
  "flagged",
  "excluded",
]);

export const achBatchStatusEnum = pgEnum("ach_batch_status", [
  "draft",
  "validated",
  "submitted",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

export const discrepancyTypeEnum = pgEnum("discrepancy_type", [
  "nsf",
  "partial_payment",
  "overpayment",
  "unrecognized",
  "bank_fee",
  "duplicate",
  "split_payment",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  // System-generated activities
  "transactions_enriched",
  "transactions_created",
  "deal_paid",
  "inbox_new",
  "inbox_auto_matched",
  "inbox_needs_review",
  "inbox_cross_currency_matched",
  "deal_overdue",
  "deal_sent",
  "inbox_match_confirmed",
  "deal_refunded",

  // Recurring deal activities
  "recurring_series_started",
  "recurring_series_completed",
  "recurring_series_paused",
  "recurring_deal_upcoming",

  // User actions
  "document_uploaded",
  "document_processed",
  "deal_duplicated",
  "deal_scheduled",
  "deal_reminder_sent",
  "deal_cancelled",
  "deal_created",
  "draft_deal_created",
  "transactions_categorized",
  "transactions_assigned",
  "transaction_attachment_created",
  "transaction_category_created",
  "transactions_exported",
  "merchant_created",
]);

export const activitySourceEnum = pgEnum("activity_source", [
  "system", // Automated system processes
  "user", // Direct user actions
]);

export const activityStatusEnum = pgEnum("activity_status", [
  "unread",
  "read",
  "archived",
]);

export const documentTagEmbeddings = pgTable(
  "document_tag_embeddings",
  {
    slug: text().primaryKey().notNull(),
    embedding: vector({ dimensions: 768 }),
    name: text().notNull(),
    model: text().notNull().default("gemini-embedding-001"),
  },
  (table) => [
    index("document_tag_embeddings_idx")
      .using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops"))
      .with({ m: "16", ef_construction: "64" }),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
  ],
);

export const transactionCategoryEmbeddings = pgTable(
  "transaction_category_embeddings",
  {
    name: text().primaryKey().notNull(), // Unique by name - same embedding for all teams
    embedding: vector({ dimensions: 768 }),
    model: text().notNull().default("gemini-embedding-001"),
    system: boolean().default(false).notNull(), // Whether this comes from system categories
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Vector similarity index for fast cosine similarity search
    index("transaction_category_embeddings_vector_idx")
      .using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops"))
      .with({ m: "16", ef_construction: "64" }),
    // System categories index for filtering
    index("transaction_category_embeddings_system_idx").using(
      "btree",
      table.system.asc().nullsLast().op("bool_ops"),
    ),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable update for authenticated users only", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
      using: sql`true`,
    }),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    date: date().notNull(),
    name: text().notNull(),
    method: transactionMethodsEnum().notNull(),
    amount: numericCasted({ precision: 10, scale: 2 }).notNull(),
    currency: text().notNull(),
    teamId: uuid("team_id").notNull(),
    assignedId: uuid("assigned_id"),
    note: varchar(),
    bankAccountId: uuid("bank_account_id"),
    internalId: text("internal_id").notNull(),
    status: transactionStatusEnum().default("posted"),
    balance: numericCasted({ precision: 10, scale: 2 }),
    manual: boolean().default(false),
    notified: boolean().default(false),
    internal: boolean().default(false),
    description: text(),
    categorySlug: text("category_slug"),
    baseAmount: numericCasted({ precision: 10, scale: 2 }),
    counterpartyName: text("counterparty_name"),
    baseCurrency: text("base_currency"),
    recurring: boolean(),
    frequency: transactionFrequencyEnum(),
    merchantName: text("merchant_name"),
    enrichmentCompleted: boolean("enrichment_completed").default(false),
    dealCode: text("deal_code"),
    transactionType: transactionTypeEnum("transaction_type"),
    paymentStatus: paymentStatusEnum("payment_status"),
    // Reconciliation columns
    matchStatus: matchStatusEnum("match_status").default("unmatched"),
    matchConfidence: numericCasted("match_confidence", { precision: 5, scale: 2 }),
    matchedPaymentId: uuid("matched_payment_id"),
    matchedDealId: uuid("matched_deal_id"),
    matchedAt: timestamp("matched_at", { withTimezone: true, mode: "string" }),
    matchedBy: uuid("matched_by"),
    matchRule: text("match_rule"),
    matchSuggestions: jsonb("match_suggestions"),
    reconciliationNote: text("reconciliation_note"),
    discrepancyType: discrepancyTypeEnum("discrepancy_type"),
    ftsVector: tsvector("fts_vector")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
				to_tsvector(
					'english',
					(
						(COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)
					)
				)
			`,
      ),
  },
  (table) => [
    index("idx_transactions_date").using(
      "btree",
      table.date.asc().nullsLast().op("date_ops"),
    ),
    index("idx_transactions_fts").using(
      "gin",
      table.ftsVector.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_transactions_fts_vector").using(
      "gin",
      table.ftsVector.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_transactions_id").using(
      "btree",
      table.id.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_transactions_name").using(
      "btree",
      table.name.asc().nullsLast().op("text_ops"),
    ),
    index("idx_transactions_name_trigram").using(
      "gin",
      table.name.asc().nullsLast().op("gin_trgm_ops"),
    ),
    index("idx_transactions_team_id_date_name").using(
      "btree",
      table.teamId.asc().nullsLast().op("date_ops"),
      table.date.asc().nullsLast().op("date_ops"),
      table.name.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_transactions_team_id_name").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
      table.name.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_trgm_name").using(
      "gist",
      table.name.asc().nullsLast().op("gist_trgm_ops"),
    ),
    index("transactions_assigned_id_idx").using(
      "btree",
      table.assignedId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transactions_bank_account_id_idx").using(
      "btree",
      table.bankAccountId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transactions_category_slug_idx").using(
      "btree",
      table.categorySlug.asc().nullsLast().op("text_ops"),
    ),
    index(
      "transactions_team_id_date_currency_bank_account_id_category_idx",
    ).using(
      "btree",
      table.teamId.asc().nullsLast().op("enum_ops"),
      table.date.asc().nullsLast().op("date_ops"),
      table.currency.asc().nullsLast().op("text_ops"),
      table.bankAccountId.asc().nullsLast().op("date_ops"),
    ),
    index("transactions_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.assignedId],
      foreignColumns: [users.id],
      name: "public_transactions_assigned_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "public_transactions_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.bankAccountId],
      foreignColumns: [bankAccounts.id],
      name: "transactions_bank_account_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId, table.categorySlug],
      foreignColumns: [
        transactionCategories.teamId,
        transactionCategories.slug,
      ],
      name: "transactions_category_slug_team_id_fkey",
    }),
    // Reconciliation indexes and FKs
    index("idx_transactions_match_status").on(table.matchStatus),
    index("idx_transactions_matched_payment").on(table.matchedPaymentId),
    index("idx_transactions_matched_deal").on(table.matchedDealId),
    foreignKey({
      columns: [table.matchedPaymentId],
      foreignColumns: [mcaPayments.id],
      name: "transactions_matched_payment_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.matchedDealId],
      foreignColumns: [mcaDeals.id],
      name: "transactions_matched_deal_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.matchedBy],
      foreignColumns: [users.id],
      name: "transactions_matched_by_fkey",
    }).onDelete("set null"),
    unique("transactions_internal_id_key").on(table.internalId),
    pgPolicy("Transactions can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Transactions can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("Transactions can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Transactions can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const merchantTags = pgTable(
  "merchant_tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    merchantId: uuid("merchant_id").notNull(),
    teamId: uuid("team_id").notNull(),
    tagId: uuid("tag_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "merchant_tags_merchant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [tags.id],
      name: "merchant_tags_tag_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "merchant_tags_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_merchant_tag").on(table.merchantId, table.tagId),
    pgPolicy("Tags can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const inboxAccounts = pgTable(
  "inbox_accounts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    email: text().notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    teamId: uuid("team_id").notNull(),
    lastAccessed: timestamp("last_accessed", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    provider: inboxAccountProvidersEnum().notNull(),
    externalId: text("external_id").notNull(),
    expiryDate: timestamp("expiry_date", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    scheduleId: text("schedule_id"),
    status: inboxAccountStatusEnum().default("connected").notNull(),
    errorMessage: text("error_message"),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "inbox_accounts_team_id_fkey",
    }).onDelete("cascade"),
    unique("inbox_accounts_email_key").on(table.email),
    unique("inbox_accounts_external_id_key").on(table.externalId),
    pgPolicy("Inbox accounts can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Inbox accounts can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Inbox accounts can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    createdBy: uuid("created_by").notNull(),
    teamId: uuid("team_id").notNull(),
    name: text(),
    currency: text(),
    bankConnectionId: uuid("bank_connection_id"),
    enabled: boolean().default(true).notNull(),
    accountId: text("account_id").notNull(),
    balance: numericCasted({ precision: 10, scale: 2 }).default(0),
    manual: boolean().default(false),
    type: accountTypeEnum(),
    baseCurrency: text("base_currency"),
    baseBalance: numericCasted({ precision: 10, scale: 2 }),
    errorDetails: text("error_details"),
    errorRetries: smallint("error_retries"),
    accountReference: text("account_reference"),
    // Additional account data for reconnect matching and user display
    iban: text(), // IBAN (EU/UK) - encrypted at rest
    subtype: text(), // Granular type: checking, savings, credit_card, money_market, etc.
    bic: text(), // Bank Identifier Code / SWIFT
    // US bank account details (Teller, Plaid)
    routingNumber: text("routing_number"), // ACH routing number
    wireRoutingNumber: text("wire_routing_number"), // Wire routing number
    accountNumber: text("account_number"), // Full account number - encrypted at rest
    sortCode: text("sort_code"), // UK BACS sort code
    // Credit account balances
    availableBalance: numericCasted({ precision: 10, scale: 2 }), // Available credit (cards) or available funds
    creditLimit: numericCasted({ precision: 10, scale: 2 }), // Credit limit (cards only)
  },
  (table) => [
    index("bank_accounts_bank_connection_id_idx").using(
      "btree",
      table.bankConnectionId.asc().nullsLast().op("uuid_ops"),
    ),
    index("bank_accounts_created_by_idx").using(
      "btree",
      table.createdBy.asc().nullsLast().op("uuid_ops"),
    ),
    index("bank_accounts_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.bankConnectionId],
      foreignColumns: [bankConnections.id],
      name: "bank_accounts_bank_connection_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "bank_accounts_created_by_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "public_bank_accounts_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Bank Accounts can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Bank Accounts can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("Bank Accounts can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Bank Accounts can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const dealRecurring = pgTable(
  "deal_recurring",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id").notNull(),
    merchantId: uuid("merchant_id"),
    // Frequency settings
    frequency: dealRecurringFrequencyEnum().notNull(),
    frequencyDay: integer("frequency_day"), // 0-6 for weekly (day of week), 1-31 for monthly_date
    frequencyWeek: integer("frequency_week"), // 1-5 for monthly_weekday (e.g., 1st, 2nd Friday)
    frequencyInterval: integer("frequency_interval"), // For custom: every X days
    // End conditions
    endType: dealRecurringEndTypeEnum("end_type").notNull(),
    endDate: timestamp("end_date", { withTimezone: true, mode: "string" }),
    endCount: integer("end_count"),
    // Status tracking
    status: dealRecurringStatusEnum().default("active").notNull(),
    dealsGenerated: integer("deals_generated").default(0).notNull(),
    consecutiveFailures: integer("consecutive_failures").default(0).notNull(), // Track failures for auto-pause
    nextScheduledAt: timestamp("next_scheduled_at", {
      withTimezone: true,
      mode: "string",
    }),
    lastGeneratedAt: timestamp("last_generated_at", {
      withTimezone: true,
      mode: "string",
    }),
    timezone: text().notNull(), // User's timezone for correct day-of-week calculation
    // Deal template data
    dueDateOffset: integer("due_date_offset").default(30).notNull(), // Days from issue date to due date
    amount: numericCasted({ precision: 10, scale: 2 }),
    currency: text(),
    lineItems: jsonb("line_items"),
    template: jsonb(), // Deal template snapshot (labels, settings, etc.)
    paymentDetails: jsonb("payment_details"),
    fromDetails: jsonb("from_details"),
    noteDetails: jsonb("note_details"),
    merchantName: text("merchant_name"),
    vat: numericCasted({ precision: 10, scale: 2 }),
    tax: numericCasted({ precision: 10, scale: 2 }),
    discount: numericCasted({ precision: 10, scale: 2 }),
    subtotal: numericCasted({ precision: 10, scale: 2 }),
    topBlock: jsonb("top_block"),
    bottomBlock: jsonb("bottom_block"),
    templateId: uuid("template_id"),
    // Notification tracking
    upcomingNotificationSentAt: timestamp("upcoming_notification_sent_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    index("deal_recurring_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("deal_recurring_next_scheduled_at_idx").using(
      "btree",
      table.nextScheduledAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("deal_recurring_status_idx").using(
      "btree",
      table.status.asc().nullsLast(),
    ),
    // Compound partial index for scheduler query
    index("deal_recurring_active_scheduled_idx")
      .using(
        "btree",
        table.nextScheduledAt.asc().nullsLast().op("timestamptz_ops"),
      )
      .where(sql`status = 'active'`),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "deal_recurring_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "deal_recurring_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "deal_recurring_merchant_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [dealTemplates.id],
      name: "deal_recurring_template_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Deal recurring can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const deals = pgTable(
  "deals",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    dueDate: timestamp("due_date", { withTimezone: true, mode: "string" }),
    dealNumber: text("deal_number"),
    merchantId: uuid("merchant_id"),
    amount: numericCasted({ precision: 10, scale: 2 }),
    currency: text(),
    lineItems: jsonb("line_items"),
    paymentDetails: jsonb("payment_details"),
    merchantDetails: jsonb("merchant_details"),
    companyDatails: jsonb("company_datails"),
    note: text(),
    internalNote: text("internal_note"),
    teamId: uuid("team_id").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
        to_tsvector(
          'english',
          (
            (COALESCE((amount)::text, ''::text) || ' '::text) || COALESCE(deal_number, ''::text)
          )
        )
      `,
      ),
    vat: numericCasted({ precision: 10, scale: 2 }),
    tax: numericCasted({ precision: 10, scale: 2 }),
    url: text(),
    filePath: text("file_path").array(),
    status: dealStatusEnum().default("draft").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true, mode: "string" }),
    fromDetails: jsonb("from_details"),
    issueDate: timestamp("issue_date", { withTimezone: true, mode: "string" }),
    template: jsonb(),
    noteDetails: jsonb("note_details"),
    merchantName: text("merchant_name"),
    token: text().default("").notNull(),
    sentTo: text("sent_to"),
    reminderSentAt: timestamp("reminder_sent_at", {
      withTimezone: true,
      mode: "string",
    }),
    discount: numericCasted({ precision: 10, scale: 2 }),
    fileSize: bigint("file_size", { mode: "number" }),
    userId: uuid("user_id"),
    subtotal: numericCasted({ precision: 10, scale: 2 }),
    topBlock: jsonb("top_block"),
    bottomBlock: jsonb("bottom_block"),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),
    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
      mode: "string",
    }),
    scheduledJobId: text("scheduled_job_id"),
    templateId: uuid("template_id"),
    paymentIntentId: text("payment_intent_id"),
    refundedAt: timestamp("refunded_at", {
      withTimezone: true,
      mode: "string",
    }),
    // Recurring deal fields
    dealRecurringId: uuid("deal_recurring_id"),
    recurringSequence: integer("recurring_sequence"), // Which number in the series (1, 2, 3...)
  },
  (table) => [
    index("deals_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("deals_fts").using(
      "gin",
      table.fts.asc().nullsLast().op("tsvector_ops"),
    ),
    index("deals_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("deals_template_id_idx").using(
      "btree",
      table.templateId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "deals_created_by_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "deals_merchant_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "deals_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [dealTemplates.id],
      name: "deals_template_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.dealRecurringId],
      foreignColumns: [dealRecurring.id],
      name: "deals_deal_recurring_id_fkey",
    }).onDelete("set null"),
    index("deals_deal_recurring_id_idx").using(
      "btree",
      table.dealRecurringId.asc().nullsLast().op("uuid_ops"),
    ),
    // Unique constraint for idempotency (prevents duplicate deals for same sequence)
    uniqueIndex("deals_recurring_sequence_unique_idx")
      .on(table.dealRecurringId, table.recurringSequence)
      .where(sql`deal_recurring_id IS NOT NULL`),
    unique("deals_scheduled_job_id_key").on(table.scheduledJobId),
    pgPolicy("Deals can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const merchants = pgTable(
  "merchants",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().notNull(),
    email: text().notNull(),
    billingEmail: text(),
    country: text(),
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text(),
    state: text(),
    zip: text(),
    note: text(),
    teamId: uuid("team_id").defaultRandom().notNull(),
    website: text(),
    phone: text(),
    vatNumber: text("vat_number"),
    countryCode: text("country_code"),
    token: text().default("").notNull(),
    contact: text(),

    // Merchant relationship fields
    status: text().default("active"), // active, inactive, prospect, churned
    preferredCurrency: text("preferred_currency"),
    defaultPaymentTerms: integer("default_payment_terms"), // days (30, 60, etc.)
    isArchived: boolean("is_archived").default(false),
    source: text().default("manual"), // manual, import, quickbooks, xero, etc.
    externalId: text("external_id"), // for external system sync

    // Enrichment fields (from Gemini + Google Search grounding)
    logoUrl: text("logo_url"),
    description: text(), // AI-generated company description
    industry: text(), // Software, Healthcare, Finance, etc.
    companyType: text("company_type"), // B2B, B2C, SaaS, Agency, etc.
    employeeCount: text("employee_count"), // 1-10, 11-50, 51-200, etc.
    foundedYear: integer("founded_year"),
    estimatedRevenue: text("estimated_revenue"), // <$1M, $1-10M, etc.
    fundingStage: text("funding_stage"), // Bootstrapped, Seed, Series A, etc.
    totalFunding: text("total_funding"), // e.g., "$25M"
    headquartersLocation: text("headquarters_location"), // City, Country
    timezone: text(), // IANA timezone
    linkedinUrl: text("linkedin_url"),
    twitterUrl: text("twitter_url"),
    instagramUrl: text("instagram_url"),
    facebookUrl: text("facebook_url"),
    ceoName: text("ceo_name"), // CEO or founder name
    financeContact: text("finance_contact"), // Finance/AP contact name for invoicing
    financeContactEmail: text("finance_contact_email"), // Finance/AP contact email
    primaryLanguage: text("primary_language"), // Primary business language (e.g., "en", "sv", "de")
    fiscalYearEnd: text("fiscal_year_end"), // Fiscal year end month (e.g., "December", "March")

    // Enrichment metadata
    enrichmentStatus: text("enrichment_status"), // null = not attempted, pending, processing, completed, failed
    enrichedAt: timestamp("enriched_at", {
      withTimezone: true,
      mode: "string",
    }),

    // Portal fields
    portalEnabled: boolean("portal_enabled").default(false),
    portalId: text("portal_id"),

    // Notification preferences
    notificationEmail: boolean("notification_email").default(true),
    notificationSms: boolean("notification_sms").default(false),
    notificationPhone: text("notification_phone"),

    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
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
			`,
      ),
  },
  (table) => [
    index("merchants_fts").using(
      "gin",
      table.fts.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_merchants_status").on(table.status),
    index("idx_merchants_is_archived").on(table.isArchived),
    index("idx_merchants_enrichment_status").on(table.enrichmentStatus),
    index("idx_merchants_website").on(table.website),
    index("idx_merchants_industry").on(table.industry),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "merchants_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Merchants can be handled by members of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    base: text(),
    rate: numericCasted({ precision: 10, scale: 2 }),
    target: text(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("exchange_rates_base_target_idx").using(
      "btree",
      table.base.asc().nullsLast().op("text_ops"),
      table.target.asc().nullsLast().op("text_ops"),
    ),
    unique("unique_rate").on(table.base, table.target),
    pgPolicy("Enable read access for authenticated users", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`true`,
    }),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
  },
  (table) => [
    index("tags_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "tags_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_tag_name").on(table.teamId, table.name),
    pgPolicy("Tags can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const dealComments = pgTable("deal_comments", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const reports = pgTable(
  "reports",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    linkId: text("link_id"),
    teamId: uuid("team_id"),
    shortLink: text("short_link"),
    from: timestamp({ withTimezone: true, mode: "string" }),
    to: timestamp({ withTimezone: true, mode: "string" }),
    type: reportTypesEnum(),
    expireAt: timestamp("expire_at", { withTimezone: true, mode: "string" }),
    currency: text(),
    createdBy: uuid("created_by"),
  },
  (table) => [
    index("reports_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "public_reports_created_by_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "reports_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Reports can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Reports can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("Reports can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Reports can be updated by member of team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const bankConnections = pgTable(
  "bank_connections",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    institutionId: text("institution_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
    logoUrl: text("logo_url"),
    accessToken: text("access_token"),
    enrollmentId: text("enrollment_id"),
    provider: bankProvidersEnum().notNull(),
    lastAccessed: timestamp("last_accessed", {
      withTimezone: true,
      mode: "string",
    }),
    referenceId: text("reference_id"),
    status: connectionStatusEnum().default("connected"),
    errorDetails: text("error_details"),
    errorRetries: smallint("error_retries").default(sql`'0'`),
  },
  (table) => [
    index("bank_connections_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "bank_connections_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_bank_connections").on(table.institutionId, table.teamId),
    pgPolicy("Bank Connections can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Bank Connections can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("Bank Connections can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Bank Connections can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const userInvites = pgTable(
  "user_invites",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id"),
    email: text(),
    role: teamRolesEnum(),
    code: text().default("nanoid(24)"),
    invitedBy: uuid("invited_by"),
    entityId: uuid("entity_id"),
    entityType: text("entity_type"),
  },
  (table) => [
    index("user_invites_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "public_user_invites_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [users.id],
      name: "user_invites_invited_by_fkey",
    }).onDelete("cascade"),
    unique("unique_team_invite").on(table.teamId, table.email),
    unique("user_invites_code_key").on(table.code),
    pgPolicy("Enable select for users based on email", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`((auth.jwt() ->> 'email'::text) = email)`,
    }),
    pgPolicy("User Invites can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("User Invites can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("User Invites can be deleted by invited email", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("User Invites can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("User Invites can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const documentTags = pgTable(
  "document_tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    teamId: uuid("team_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "document_tags_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_slug_per_team").on(table.slug, table.teamId),
    pgPolicy("Tags can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const transactionTags = pgTable(
  "transaction_tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id").notNull(),
    tagId: uuid("tag_id").notNull(),
    transactionId: uuid("transaction_id").notNull(),
  },
  (table) => [
    index("transaction_tags_tag_id_idx").using(
      "btree",
      table.tagId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_tags_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_tags_transaction_id_tag_id_team_id_idx").using(
      "btree",
      table.transactionId.asc().nullsLast().op("uuid_ops"),
      table.tagId.asc().nullsLast().op("uuid_ops"),
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [tags.id],
      name: "transaction_tags_tag_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "transaction_tags_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactions.id],
      name: "transaction_tags_transaction_id_fkey",
    }).onDelete("cascade"),
    unique("unique_tag").on(table.tagId, table.transactionId),
    pgPolicy("Transaction Tags can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const transactionAttachments = pgTable(
  "transaction_attachments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    type: text(),
    transactionId: uuid("transaction_id"),
    teamId: uuid("team_id"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    size: bigint({ mode: "number" }),
    name: text(),
    path: text().array(),
  },
  (table) => [
    index("transaction_attachments_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_attachments_transaction_id_idx").using(
      "btree",
      table.transactionId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "public_transaction_attachments_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactions.id],
      name: "public_transaction_attachments_transaction_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Transaction Attachments can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Transaction Attachments can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy(
      "Transaction Attachments can be selected by a member of the team",
      { as: "permissive", for: "select", to: ["public"] },
    ),
    pgPolicy("Transaction Attachments can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text(),
    logoUrl: text("logo_url"),
    inboxId: text("inbox_id").default("generate_inbox(10)"),
    email: text(),
    inboxEmail: text("inbox_email"),
    inboxForwarding: boolean("inbox_forwarding").default(true),
    baseCurrency: text("base_currency"),
    countryCode: text("country_code"),
    fiscalYearStartMonth: smallint("fiscal_year_start_month"),
    documentClassification: boolean("document_classification").default(false),
    flags: text().array(),
    canceledAt: timestamp("canceled_at", {
      withTimezone: true,
      mode: "string",
    }),
    plan: plansEnum().default("trial").notNull(),
    subscriptionStatus: subscriptionStatusEnum("subscription_status"),
    exportSettings: jsonb("export_settings"),
    stripeAccountId: text("stripe_account_id"),
    stripeConnectStatus: text("stripe_connect_status"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    // Branding customization for merchant portal
    branding: jsonb().$type<TeamBranding>().default({}),
  },
  (table) => [
    unique("teams_inbox_id_key").on(table.inboxId),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Invited users can select team if they are invited.", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Teams can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
    pgPolicy("Teams can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Teams can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    metadata: jsonb(),
    pathTokens: text("path_tokens").array(),
    teamId: uuid("team_id"),
    parentId: text("parent_id"),
    objectId: uuid("object_id"),
    ownerId: uuid("owner_id"),
    tag: text(),
    title: text(),
    body: text(),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`to_tsvector('english'::regconfig, ((title || ' '::text) || body))`,
      ),
    summary: text(),
    content: text(),
    date: date(),
    language: text(),
    processingStatus:
      documentProcessingStatusEnum("processing_status").default("pending"),
    ftsSimple: tsvector("fts_simple"),
    ftsEnglish: tsvector("fts_english"),
    ftsLanguage: tsvector("fts_language"),
  },
  (table) => [
    index("documents_name_idx").using(
      "btree",
      table.name.asc().nullsLast().op("text_ops"),
    ),
    index("documents_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("documents_team_id_parent_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("text_ops"),
      table.parentId.asc().nullsLast().op("text_ops"),
    ),
    // Composite index for common query pattern: teamId + createdAt DESC
    // Used by getDocuments and getRecentDocuments
    index("documents_team_id_created_at_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
      table.createdAt.desc().nullsLast(),
    ),
    // Composite index for date range queries
    // Used by getDocuments when filtering by date range
    index("documents_team_id_date_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
      table.date.asc().nullsLast(),
    ),
    // Composite index for teamId + name queries
    // Used by getDocumentById, updateDocumentByFileName, updateDocuments
    index("documents_team_id_name_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
      table.name.asc().nullsLast().op("text_ops"),
    ),
    index("idx_documents_fts_english").using(
      "gin",
      table.ftsEnglish.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_documents_fts_language").using(
      "gin",
      table.ftsLanguage.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_documents_fts_simple").using(
      "gin",
      table.ftsSimple.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_gin_documents_title").using(
      "gin",
      table.title.asc().nullsLast().op("gin_trgm_ops"),
    ),
    index("idx_gin_documents_name").using(
      "gin",
      table.name.asc().nullsLast().op("gin_trgm_ops"),
    ),
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [users.id],
      name: "documents_created_by_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "storage_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Documents can be deleted by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Documents can be selected by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
    }),
    pgPolicy("Documents can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
    }),
  ],
);

export const apps = pgTable(
  "apps",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").defaultRandom(),
    config: jsonb(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    appId: text("app_id").notNull(),
    createdBy: uuid("created_by").defaultRandom(),
    settings: jsonb(),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "apps_created_by_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "integrations_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_app_id_team_id").on(table.teamId, table.appId),
    pgPolicy("Apps can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Apps can be inserted by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
    }),
    pgPolicy("Apps can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Apps can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const dealTemplates = pgTable(
  "deal_templates",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().default("Default").notNull(),
    isDefault: boolean("is_default").default(false),
    customerLabel: text("customer_label"),
    fromLabel: text("from_label"),
    dealNoLabel: text("deal_no_label"),
    issueDateLabel: text("issue_date_label"),
    dueDateLabel: text("due_date_label"),
    descriptionLabel: text("description_label"),
    priceLabel: text("price_label"),
    quantityLabel: text("quantity_label"),
    totalLabel: text("total_label"),
    vatLabel: text("vat_label"),
    taxLabel: text("tax_label"),
    paymentLabel: text("payment_label"),
    noteLabel: text("note_label"),
    logoUrl: text("logo_url"),
    currency: text(),
    paymentDetails: jsonb("payment_details"),
    fromDetails: jsonb("from_details"),
    noteDetails: jsonb("note_details"),
    size: dealSizeEnum().default("a4"),
    dateFormat: text("date_format"),
    includeVat: boolean("include_vat"),
    includeTax: boolean("include_tax"),
    taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
    deliveryType: dealDeliveryTypeEnum("delivery_type")
      .default("create")
      .notNull(),
    discountLabel: text("discount_label"),
    includeDiscount: boolean("include_discount"),
    includeDecimals: boolean("include_decimals"),
    includeQr: boolean("include_qr"),
    totalSummaryLabel: text("total_summary_label"),
    title: text(),
    vatRate: numericCasted("vat_rate", { precision: 10, scale: 2 }),
    includeUnits: boolean("include_units"),
    subtotalLabel: text("subtotal_label"),
    includePdf: boolean("include_pdf"),
    sendCopy: boolean("send_copy"),
    includeLineItemTax: boolean("include_line_item_tax").default(false),
    lineItemTaxLabel: text("line_item_tax_label"),
    paymentEnabled: boolean("payment_enabled").default(false),
    paymentTermsDays: integer("payment_terms_days").default(30),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "deal_templates_team_id_fkey",
    }).onDelete("cascade"),
    index("idx_deal_templates_team_id").on(table.teamId),
    pgPolicy("Deal templates can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const dealProducts = pgTable(
  "deal_products",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    teamId: uuid("team_id").notNull(),
    createdBy: uuid("created_by"),
    name: text().notNull(),
    description: text(),
    price: numericCasted({ precision: 10, scale: 2 }),
    currency: text(),
    unit: text(),
    taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
    isActive: boolean().default(true).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
    // Full-text search for product names and descriptions
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
          to_tsvector(
            'english',
            (
              (COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)
            )
          )
        `,
      ),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "deal_products_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "deal_products_created_by_fkey",
    }).onDelete("set null"),
    index("deal_products_team_id_idx").on(table.teamId),
    index("deal_products_created_by_idx").on(table.createdBy),
    index("deal_products_fts_idx").using("gin", table.fts),
    index("deal_products_name_idx").on(table.name),
    index("deal_products_usage_count_idx").on(table.usageCount),
    index("deal_products_last_used_at_idx").on(table.lastUsedAt),
    // Composite index for team + active status for fast filtering
    index("deal_products_team_active_idx").on(table.teamId, table.isActive),
    // Unique constraint for upsert operations (team + name + currency + price combination)
    unique("deal_products_team_name_currency_price_unique").on(
      table.teamId,
      table.name,
      table.currency,
      table.price,
    ),
    pgPolicy("Enable read access for team members", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`team_id = (select auth.jwt() ->> 'team_id')::uuid`,
    }),
    pgPolicy("Enable insert access for team members", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`team_id = (select auth.jwt() ->> 'team_id')::uuid`,
    }),
    pgPolicy("Enable update access for team members", {
      as: "permissive",
      for: "update",
      to: ["public"],
      using: sql`team_id = (select auth.jwt() ->> 'team_id')::uuid`,
    }),
    pgPolicy("Enable delete access for team members", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`team_id = (select auth.jwt() ->> 'team_id')::uuid`,
    }),
  ],
);

export const transactionEnrichments = pgTable(
  "transaction_enrichments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    name: text(),
    teamId: uuid("team_id"),
    categorySlug: text("category_slug"),
    system: boolean().default(false),
  },
  (table) => [
    index("transaction_enrichments_category_slug_team_id_idx").using(
      "btree",
      table.categorySlug.asc().nullsLast().op("text_ops"),
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId, table.categorySlug],
      foreignColumns: [
        transactionCategories.teamId,
        transactionCategories.slug,
      ],
      name: "transaction_enrichments_category_slug_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "transaction_enrichments_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_team_name").on(table.name, table.teamId),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable update for authenticated users only", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().notNull(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    email: text(),
    teamId: uuid("team_id"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    locale: text().default("en"),
    weekStartsOnMonday: boolean("week_starts_on_monday").default(false),
    timezone: text(),
    timezoneAutoSync: boolean("timezone_auto_sync").default(true),
    timeFormat: numericCasted("time_format").default(24),
    dateFormat: text("date_format"),
  },
  (table) => [
    index("users_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.id],
      foreignColumns: [table.id],
      name: "users_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "users_team_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Users can insert their own profile.", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(auth.uid() = id)`,
    }),
    pgPolicy("Users can select their own profile.", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Users can select users if they are in the same team", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Users can update own profile.", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const inbox = pgTable(
  "inbox",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id"),
    filePath: text("file_path").array(),
    fileName: text("file_name"),
    transactionId: uuid("transaction_id"),
    amount: numericCasted("amount", { precision: 10, scale: 2 }),
    currency: text(),
    contentType: text("content_type"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    size: bigint({ mode: "number" }),
    attachmentId: uuid("attachment_id"),
    date: date(),
    forwardedTo: text("forwarded_to"),
    referenceId: text("reference_id"),
    meta: json(),
    status: inboxStatusEnum().default("new"),
    website: text(),
    senderEmail: text("sender_email"),
    displayName: text("display_name"),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`generate_inbox_fts(display_name, extract_product_names((meta -> 'products'::text)))`,
      ),
    type: inboxTypeEnum(),
    description: text(),
    baseAmount: numericCasted("base_amount", { precision: 10, scale: 2 }),
    baseCurrency: text("base_currency"),
    inboxAccountId: uuid("inbox_account_id"),
    dealNumber: text("deal_number"),
    groupedInboxId: uuid("grouped_inbox_id"),
  },
  (table) => [
    index("inbox_attachment_id_idx").using(
      "btree",
      table.attachmentId.asc().nullsLast().op("uuid_ops"),
    ),
    index("inbox_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("inbox_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("inbox_transaction_id_idx").using(
      "btree",
      table.transactionId.asc().nullsLast().op("uuid_ops"),
    ),
    index("inbox_inbox_account_id_idx").using(
      "btree",
      table.inboxAccountId.asc().nullsLast().op("uuid_ops"),
    ),
    index("inbox_deal_number_idx").using(
      "btree",
      table.dealNumber.asc().nullsLast().op("text_ops"),
    ),
    index("inbox_grouped_inbox_id_idx").using(
      "btree",
      table.groupedInboxId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.attachmentId],
      foreignColumns: [transactionAttachments.id],
      name: "inbox_attachment_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "public_inbox_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactions.id],
      name: "public_inbox_transaction_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.inboxAccountId],
      foreignColumns: [inboxAccounts.id],
      name: "inbox_inbox_account_id_fkey",
    }).onDelete("set null"),
    // Note: groupedInboxId self-referential foreign key constraint is defined in migration
    // to avoid TypeScript circular reference error (inbox.id referenced before inbox is fully defined)
    unique("inbox_reference_id_key").on(table.referenceId),
    pgPolicy("Inbox can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Inbox can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Inbox can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const inboxBlocklist = pgTable(
  "inbox_blocklist",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id").notNull(),
    type: inboxBlocklistTypeEnum().notNull(),
    value: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "inbox_blocklist_team_id_fkey",
    }).onDelete("cascade"),
    unique("inbox_blocklist_team_id_type_value_key").on(
      table.teamId,
      table.type,
      table.value,
    ),
    pgPolicy("Inbox blocklist can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Inbox blocklist can be inserted by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Inbox blocklist can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const transactionEmbeddings = pgTable(
  "transaction_embeddings",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    transactionId: uuid("transaction_id").notNull(),
    teamId: uuid("team_id").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    sourceText: text("source_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    model: text("model").notNull().default("gemini-embedding-001"),
  },
  (table) => [
    index("transaction_embeddings_transaction_id_idx").using(
      "btree",
      table.transactionId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_embeddings_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    // Vector similarity index for fast cosine similarity searches
    index("transaction_embeddings_vector_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactions.id],
      name: "transaction_embeddings_transaction_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "transaction_embeddings_team_id_fkey",
    }).onDelete("cascade"),
    unique("transaction_embeddings_unique").on(table.transactionId),
  ],
);

export const inboxEmbeddings = pgTable(
  "inbox_embeddings",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    inboxId: uuid("inbox_id").notNull(),
    teamId: uuid("team_id").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    sourceText: text("source_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    model: text("model").notNull().default("gemini-embedding-001"),
  },
  (table) => [
    index("inbox_embeddings_inbox_id_idx").using(
      "btree",
      table.inboxId.asc().nullsLast().op("uuid_ops"),
    ),
    index("inbox_embeddings_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    // Vector similarity index for fast cosine similarity searches
    index("inbox_embeddings_vector_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    foreignKey({
      columns: [table.inboxId],
      foreignColumns: [inbox.id],
      name: "inbox_embeddings_inbox_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "inbox_embeddings_team_id_fkey",
    }).onDelete("cascade"),
    unique("inbox_embeddings_unique").on(table.inboxId),
  ],
);

export const transactionMatchSuggestions = pgTable(
  "transaction_match_suggestions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Core relationship
    teamId: uuid("team_id").notNull(),
    inboxId: uuid("inbox_id").notNull(),
    transactionId: uuid("transaction_id").notNull(),

    // Match scores for transparency
    confidenceScore: numericCasted("confidence_score", {
      precision: 4,
      scale: 3,
    }).notNull(),
    amountScore: numericCasted("amount_score", { precision: 4, scale: 3 }),
    currencyScore: numericCasted("currency_score", { precision: 4, scale: 3 }),
    dateScore: numericCasted("date_score", { precision: 4, scale: 3 }),
    embeddingScore: numericCasted("embedding_score", {
      precision: 4,
      scale: 3,
    }),
    nameScore: numericCasted("name_score", { precision: 4, scale: 3 }),

    // Match context
    matchType: text("match_type").notNull(), // 'auto_matched', 'high_confidence', 'suggested'
    matchDetails: jsonb("match_details"),

    // User interaction tracking
    status: text("status").default("pending").notNull(), // 'pending', 'confirmed', 'declined', 'expired', 'unmatched'
    userActionAt: timestamp("user_action_at", {
      withTimezone: true,
      mode: "string",
    }),
    userId: uuid("user_id"),
  },
  (table) => [
    index("transaction_match_suggestions_inbox_id_idx").using(
      "btree",
      table.inboxId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_match_suggestions_transaction_id_idx").using(
      "btree",
      table.transactionId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_match_suggestions_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_match_suggestions_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("transaction_match_suggestions_confidence_idx").using(
      "btree",
      table.confidenceScore.desc().nullsLast(),
    ),
    index("transaction_match_suggestions_lookup_idx").using(
      "btree",
      table.transactionId.asc().nullsLast().op("uuid_ops"),
      table.teamId.asc().nullsLast().op("uuid_ops"),
      table.status.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.inboxId],
      foreignColumns: [inbox.id],
      name: "transaction_match_suggestions_inbox_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactions.id],
      name: "transaction_match_suggestions_transaction_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "transaction_match_suggestions_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "transaction_match_suggestions_user_id_fkey",
    }).onDelete("set null"),
    unique("transaction_match_suggestions_unique").on(
      table.inboxId,
      table.transactionId,
    ),
  ],
);

export const documentTagAssignments = pgTable(
  "document_tag_assignments",
  {
    documentId: uuid("document_id").notNull(),
    tagId: uuid("tag_id").notNull(),
    teamId: uuid("team_id").notNull(),
  },
  (table) => [
    index("idx_document_tag_assignments_document_id").using(
      "btree",
      table.documentId.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_document_tag_assignments_tag_id").using(
      "btree",
      table.tagId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [documents.id],
      name: "document_tag_assignments_document_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [documentTags.id],
      name: "document_tag_assignments_tag_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "document_tag_assignments_team_id_fkey",
    }).onDelete("cascade"),
    primaryKey({
      columns: [table.documentId, table.tagId],
      name: "document_tag_assignments_pkey",
    }),
    unique("document_tag_assignments_unique").on(table.documentId, table.tagId),
    pgPolicy("Tags can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const usersOnTeam = pgTable(
  "users_on_team",
  {
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    id: uuid().defaultRandom().notNull(),
    role: teamRolesEnum(),
    entityId: uuid("entity_id"),
    entityType: text("entity_type"),
    hasCollectionsPermission: boolean("has_collections_permission").default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("users_on_team_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("users_on_team_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "users_on_team_team_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "users_on_team_user_id_fkey",
    }).onDelete("cascade"),
    primaryKey({
      columns: [table.userId, table.teamId, table.id],
      name: "members_pkey",
    }),
    pgPolicy("Enable insert for authenticated users only", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`true`,
    }),
    pgPolicy("Enable updates for users on team", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
    pgPolicy("Select for current user teams", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Users on team can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["public"],
    }),
  ],
);

export const transactionCategories = pgTable(
  "transaction_categories",
  {
    id: uuid().defaultRandom().notNull(),
    name: text().notNull(),
    teamId: uuid("team_id").notNull(),
    color: text(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    system: boolean().default(false),
    slug: text(), // Generated in database
    excluded: boolean("excluded").default(false),
    description: text(),
    parentId: uuid("parent_id"),
  },
  (table) => [
    index("transaction_categories_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("transaction_categories_parent_id_idx").using(
      "btree",
      table.parentId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "transaction_categories_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "transaction_categories_parent_id_fkey",
    }).onDelete("set null"),
    primaryKey({
      columns: [table.teamId, table.slug],
      name: "transaction_categories_pkey",
    }),
    unique("unique_team_slug").on(table.teamId, table.slug),
    pgPolicy("Users on team can manage categories", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const usersInAuth = pgTable(
  "auth.users",
  {
    instanceId: uuid("instance_id"),
    id: uuid("id").notNull(),
    aud: varchar("aud", { length: 255 }),
    role: varchar("role", { length: 255 }),
    email: varchar("email", { length: 255 }),
    encryptedPassword: varchar("encrypted_password", { length: 255 }),
    emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true }),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    confirmationToken: varchar("confirmation_token", { length: 255 }),
    confirmationSentAt: timestamp("confirmation_sent_at", {
      withTimezone: true,
    }),
    recoveryToken: varchar("recovery_token", { length: 255 }),
    recoverySentAt: timestamp("recovery_sent_at", { withTimezone: true }),
    emailChangeTokenNew: varchar("email_change_token_new", { length: 255 }),
    emailChange: varchar("email_change", { length: 255 }),
    emailChangeSentAt: timestamp("email_change_sent_at", {
      withTimezone: true,
    }),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
    rawAppMetaData: jsonb("raw_app_meta_data"),
    rawUserMetaData: jsonb("raw_user_meta_data"),
    isSuperAdmin: boolean("is_super_admin"),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    phone: text("phone").default(sql`null::character varying`),
    phoneConfirmedAt: timestamp("phone_confirmed_at", { withTimezone: true }),
    phoneChange: text("phone_change").default(sql`''::character varying`),
    phoneChangeToken: varchar("phone_change_token", { length: 255 }).default(
      sql`''::character varying`,
    ),
    phoneChangeSentAt: timestamp("phone_change_sent_at", {
      withTimezone: true,
    }),
    // Drizzle ORM does not support .stored() for generated columns, so we omit it
    confirmedAt: timestamp("confirmed_at", {
      withTimezone: true,
      mode: "string",
    }).generatedAlwaysAs(sql`LEAST(email_confirmed_at, phone_confirmed_at)`),
    emailChangeTokenCurrent: varchar("email_change_token_current", {
      length: 255,
    }).default(sql`''::character varying`),
    emailChangeConfirmStatus: smallint("email_change_confirm_status").default(
      0,
    ),
    bannedUntil: timestamp("banned_until", { withTimezone: true }),
    reauthenticationToken: varchar("reauthentication_token", {
      length: 255,
    }).default(sql`''::character varying`),
    reauthenticationSentAt: timestamp("reauthentication_sent_at", {
      withTimezone: true,
    }),
    isSsoUser: boolean("is_sso_user").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: "users_pkey" }),
    unique("users_phone_key").on(table.phone),
    unique("confirmation_token_idx").on(table.confirmationToken),
    unique("email_change_token_current_idx").on(table.emailChangeTokenCurrent),
    unique("email_change_token_new_idx").on(table.emailChangeTokenNew),
    unique("reauthentication_token_idx").on(table.reauthenticationToken),
    unique("recovery_token_idx").on(table.recoveryToken),
    unique("users_email_partial_key").on(table.email),
    index("users_instance_id_email_idx").on(
      table.instanceId,
      sql`lower((email)::text)`,
    ),
    index("users_instance_id_idx").on(table.instanceId),
    index("users_is_anonymous_idx").on(table.isAnonymous),
    // Check constraint for email_change_confirm_status
    {
      kind: "check",
      name: "users_email_change_confirm_status_check",
      expression: sql`((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2))`,
    },
  ],
);

export const shortLinks = pgTable(
  "short_links",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    shortId: text("short_id").notNull(),
    url: text().notNull(),
    type: text("type"),
    size: numericCasted("size", { precision: 10, scale: 2 }),
    mimeType: text("mime_type"),
    fileName: text("file_name"),
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("short_links_short_id_idx").using(
      "btree",
      table.shortId.asc().nullsLast().op("text_ops"),
    ),
    index("short_links_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("short_links_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "short_links_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "short_links_team_id_fkey",
    }).onDelete("cascade"),
    unique("short_links_short_id_unique").on(table.shortId),
    pgPolicy("Short links can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Short links can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Short links can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Short links can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["authenticated"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    keyEncrypted: text("key_encrypted").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    keyHash: text("key_hash"),
    scopes: text("scopes").array().notNull().default(sql`'{}'::text[]`),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    index("api_keys_key_idx").using(
      "btree",
      table.keyHash.asc().nullsLast().op("text_ops"),
    ),
    index("api_keys_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    index("api_keys_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "api_keys_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "api_keys_team_id_fkey",
    }).onDelete("cascade"),
    unique("api_keys_key_unique").on(table.keyHash),
  ],
);

// Relations
// OAuth Applications
export const oauthApplications = pgTable(
  "oauth_applications",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    overview: text("overview"),
    developerName: text("developer_name"),
    logoUrl: text("logo_url"),
    website: text("website"),
    installUrl: text("install_url"),
    screenshots: text("screenshots").array().default(sql`'{}'::text[]`),
    redirectUris: text("redirect_uris").array().notNull(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret").notNull(),
    scopes: text("scopes").array().notNull().default(sql`'{}'::text[]`),
    teamId: uuid("team_id").notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    isPublic: boolean("is_public").default(false),
    active: boolean("active").default(true),
    status: text("status", {
      enum: ["draft", "pending", "approved", "rejected"],
    }).default("draft"),
  },
  (table) => [
    index("oauth_applications_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("oauth_applications_client_id_idx").using(
      "btree",
      table.clientId.asc().nullsLast().op("text_ops"),
    ),
    index("oauth_applications_slug_idx").using(
      "btree",
      table.slug.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "oauth_applications_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "oauth_applications_created_by_fkey",
    }).onDelete("cascade"),
    pgPolicy("OAuth applications can be managed by team members", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

// OAuth Authorization Codes
export const oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    applicationId: uuid("application_id").notNull(),
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    scopes: text("scopes").array().notNull(),
    redirectUri: text("redirect_uri").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    used: boolean("used").default(false),
    codeChallenge: text("code_challenge"),
    codeChallengeMethod: text("code_challenge_method"),
  },
  (table) => [
    index("oauth_authorization_codes_code_idx").using(
      "btree",
      table.code.asc().nullsLast().op("text_ops"),
    ),
    index("oauth_authorization_codes_application_id_idx").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops"),
    ),
    index("oauth_authorization_codes_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [oauthApplications.id],
      name: "oauth_authorization_codes_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "oauth_authorization_codes_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "oauth_authorization_codes_team_id_fkey",
    }).onDelete("cascade"),
  ],
);

// OAuth Access Tokens
export const oauthAccessTokens = pgTable(
  "oauth_access_tokens",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    token: text("token").notNull().unique(),
    refreshToken: text("refresh_token").unique(),
    applicationId: uuid("application_id").notNull(),
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    scopes: text("scopes").array().notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
    revoked: boolean("revoked").default(false),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("oauth_access_tokens_token_idx").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops"),
    ),
    index("oauth_access_tokens_refresh_token_idx").using(
      "btree",
      table.refreshToken.asc().nullsLast().op("text_ops"),
    ),
    index("oauth_access_tokens_application_id_idx").using(
      "btree",
      table.applicationId.asc().nullsLast().op("uuid_ops"),
    ),
    index("oauth_access_tokens_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [oauthApplications.id],
      name: "oauth_access_tokens_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "oauth_access_tokens_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "oauth_access_tokens_team_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [transactions.assignedId],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [transactions.teamId],
      references: [teams.id],
    }),
    bankAccount: one(bankAccounts, {
      fields: [transactions.bankAccountId],
      references: [bankAccounts.id],
    }),
    transactionCategory: one(transactionCategories, {
      fields: [transactions.teamId],
      references: [transactionCategories.teamId],
    }),
    transactionTags: many(transactionTags),
    transactionAttachments: many(transactionAttachments),
    inboxes: many(inbox),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  transactions: many(transactions),
  bankAccounts: many(bankAccounts),
  deals: many(deals),
  reports: many(reports),
  userInvites: many(userInvites),
  documents: many(documents),
  apps: many(apps),
  apiKeys: many(apiKeys),
  shortLinks: many(shortLinks),
  oauthApplications: many(oauthApplications),
  oauthAuthorizationCodes: many(oauthAuthorizationCodes),
  oauthAccessTokens: many(oauthAccessTokens),
  usersInAuth: one(usersInAuth, {
    fields: [users.id],
    references: [usersInAuth.id],
  }),
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  usersOnTeams: many(usersOnTeam),
}));

export const shortLinksRelations = relations(shortLinks, ({ one }) => ({
  user: one(users, {
    fields: [shortLinks.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [shortLinks.teamId],
    references: [teams.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [apiKeys.teamId],
    references: [teams.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  transactions: many(transactions),
  merchantTags: many(merchantTags),
  inboxAccounts: many(inboxAccounts),
  bankAccounts: many(bankAccounts),
  deals: many(deals),
  merchants: many(merchants),
  tags: many(tags),
  reports: many(reports),
  bankConnections: many(bankConnections),
  userInvites: many(userInvites),
  documentTags: many(documentTags),
  transactionTags: many(transactionTags),
  transactionAttachments: many(transactionAttachments),
  documents: many(documents),
  apps: many(apps),
  apiKeys: many(apiKeys),
  shortLinks: many(shortLinks),
  dealTemplates: many(dealTemplates),
  transactionEnrichments: many(transactionEnrichments),
  users: many(users),
  inboxes: many(inbox),
  inboxBlocklist: many(inboxBlocklist),
  documentTagAssignments: many(documentTagAssignments),
  usersOnTeams: many(usersOnTeam),
  transactionCategories: many(transactionCategories),
}));

export const bankAccountsRelations = relations(
  bankAccounts,
  ({ one, many }) => ({
    transactions: many(transactions),
    bankConnection: one(bankConnections, {
      fields: [bankAccounts.bankConnectionId],
      references: [bankConnections.id],
    }),
    user: one(users, {
      fields: [bankAccounts.createdBy],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [bankAccounts.teamId],
      references: [teams.id],
    }),
  }),
);

export const transactionCategoriesRelations = relations(
  transactionCategories,
  ({ one, many }) => ({
    transactions: many(transactions),
    transactionEnrichments: many(transactionEnrichments),
    team: one(teams, {
      fields: [transactionCategories.teamId],
      references: [teams.id],
    }),
    parent: one(transactionCategories, {
      fields: [transactionCategories.parentId],
      references: [transactionCategories.id],
      relationName: "parent_child",
    }),
    children: many(transactionCategories, {
      relationName: "parent_child",
    }),
  }),
);

export const merchantTagsRelations = relations(merchantTags, ({ one }) => ({
  merchant: one(merchants, {
    fields: [merchantTags.merchantId],
    references: [merchants.id],
  }),
  tag: one(tags, {
    fields: [merchantTags.tagId],
    references: [tags.id],
  }),
  team: one(teams, {
    fields: [merchantTags.teamId],
    references: [teams.id],
  }),
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  merchantTags: many(merchantTags),
  deals: many(deals),
  team: one(teams, {
    fields: [merchants.teamId],
    references: [teams.id],
  }),
  mcaDeals: many(mcaDeals),
  merchantPortalSessions: many(merchantPortalSessions),
  merchantPortalInvites: many(merchantPortalInvites),
  merchantPortalAccess: many(merchantPortalAccess),
  payoffLetterRequests: many(payoffLetterRequests),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  merchantTags: many(merchantTags),
  team: one(teams, {
    fields: [tags.teamId],
    references: [teams.id],
  }),
  transactionTags: many(transactionTags),
}));

export const inboxAccountsRelations = relations(inboxAccounts, ({ one }) => ({
  team: one(teams, {
    fields: [inboxAccounts.teamId],
    references: [teams.id],
  }),
}));

export const inboxBlocklistRelations = relations(inboxBlocklist, ({ one }) => ({
  team: one(teams, {
    fields: [inboxBlocklist.teamId],
    references: [teams.id],
  }),
}));

export const bankConnectionsRelations = relations(
  bankConnections,
  ({ one, many }) => ({
    bankAccounts: many(bankAccounts),
    team: one(teams, {
      fields: [bankConnections.teamId],
      references: [teams.id],
    }),
  }),
);

export const dealsRelations = relations(deals, ({ one }) => ({
  user: one(users, {
    fields: [deals.userId],
    references: [users.id],
  }),
  merchant: one(merchants, {
    fields: [deals.merchantId],
    references: [merchants.id],
  }),
  team: one(teams, {
    fields: [deals.teamId],
    references: [teams.id],
  }),
  dealRecurring: one(dealRecurring, {
    fields: [deals.dealRecurringId],
    references: [dealRecurring.id],
  }),
}));

export const dealRecurringRelations = relations(
  dealRecurring,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [dealRecurring.teamId],
      references: [teams.id],
    }),
    user: one(users, {
      fields: [dealRecurring.userId],
      references: [users.id],
    }),
    merchant: one(merchants, {
      fields: [dealRecurring.merchantId],
      references: [merchants.id],
    }),
    dealTemplate: one(dealTemplates, {
      fields: [dealRecurring.templateId],
      references: [dealTemplates.id],
    }),
    deals: many(deals),
  }),
);

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.createdBy],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [reports.teamId],
    references: [teams.id],
  }),
}));

export const userInvitesRelations = relations(userInvites, ({ one }) => ({
  team: one(teams, {
    fields: [userInvites.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [userInvites.invitedBy],
    references: [users.id],
  }),
}));

export const documentTagsRelations = relations(
  documentTags,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [documentTags.teamId],
      references: [teams.id],
    }),
    documentTagAssignments: many(documentTagAssignments),
  }),
);

export const transactionTagsRelations = relations(
  transactionTags,
  ({ one }) => ({
    tag: one(tags, {
      fields: [transactionTags.tagId],
      references: [tags.id],
    }),
    team: one(teams, {
      fields: [transactionTags.teamId],
      references: [teams.id],
    }),
    transaction: one(transactions, {
      fields: [transactionTags.transactionId],
      references: [transactions.id],
    }),
  }),
);

export const transactionAttachmentsRelations = relations(
  transactionAttachments,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [transactionAttachments.teamId],
      references: [teams.id],
    }),
    transaction: one(transactions, {
      fields: [transactionAttachments.transactionId],
      references: [transactions.id],
    }),
    inboxes: many(inbox),
  }),
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [documents.teamId],
    references: [teams.id],
  }),
  documentTagAssignments: many(documentTagAssignments),
}));

export const appsRelations = relations(apps, ({ one }) => ({
  user: one(users, {
    fields: [apps.createdBy],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [apps.teamId],
    references: [teams.id],
  }),
}));

export const dealTemplatesRelations = relations(
  dealTemplates,
  ({ one }) => ({
    team: one(teams, {
      fields: [dealTemplates.teamId],
      references: [teams.id],
    }),
  }),
);

export const transactionEnrichmentsRelations = relations(
  transactionEnrichments,
  ({ one }) => ({
    transactionCategory: one(transactionCategories, {
      fields: [transactionEnrichments.teamId],
      references: [transactionCategories.teamId],
    }),
    team: one(teams, {
      fields: [transactionEnrichments.teamId],
      references: [teams.id],
    }),
  }),
);

export const usersInAuthRelations = relations(usersInAuth, ({ many }) => ({
  users: many(users),
}));

export const inboxRelations = relations(inbox, ({ one }) => ({
  transactionAttachment: one(transactionAttachments, {
    fields: [inbox.attachmentId],
    references: [transactionAttachments.id],
  }),
  team: one(teams, {
    fields: [inbox.teamId],
    references: [teams.id],
  }),
  transaction: one(transactions, {
    fields: [inbox.transactionId],
    references: [transactions.id],
  }),
}));

export const documentTagAssignmentsRelations = relations(
  documentTagAssignments,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentTagAssignments.documentId],
      references: [documents.id],
    }),
    documentTag: one(documentTags, {
      fields: [documentTagAssignments.tagId],
      references: [documentTags.id],
    }),
    team: one(teams, {
      fields: [documentTagAssignments.teamId],
      references: [teams.id],
    }),
  }),
);

export const usersOnTeamRelations = relations(usersOnTeam, ({ one }) => ({
  team: one(teams, {
    fields: [usersOnTeam.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [usersOnTeam.userId],
    references: [users.id],
  }),
}));

// OAuth Relations
export const oauthApplicationsRelations = relations(
  oauthApplications,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [oauthApplications.teamId],
      references: [teams.id],
    }),
    createdBy: one(users, {
      fields: [oauthApplications.createdBy],
      references: [users.id],
    }),
    authorizationCodes: many(oauthAuthorizationCodes),
    accessTokens: many(oauthAccessTokens),
  }),
);

export const oauthAuthorizationCodesRelations = relations(
  oauthAuthorizationCodes,
  ({ one }) => ({
    application: one(oauthApplications, {
      fields: [oauthAuthorizationCodes.applicationId],
      references: [oauthApplications.id],
    }),
    user: one(users, {
      fields: [oauthAuthorizationCodes.userId],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [oauthAuthorizationCodes.teamId],
      references: [teams.id],
    }),
  }),
);

export const oauthAccessTokensRelations = relations(
  oauthAccessTokens,
  ({ one }) => ({
    application: one(oauthApplications, {
      fields: [oauthAccessTokens.applicationId],
      references: [oauthApplications.id],
    }),
    user: one(users, {
      fields: [oauthAccessTokens.userId],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [oauthAccessTokens.teamId],
      references: [teams.id],
    }),
  }),
);

export const activities = pgTable(
  "activities",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Core fields
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id"),
    type: activityTypeEnum().notNull(),
    priority: smallint().default(5), // 1-3 = notifications, 4-10 = insights only

    // Group related activities together (e.g., same business event across multiple users)
    groupId: uuid("group_id"),

    // Source of the activity
    source: activitySourceEnum().notNull(),

    // All the data
    metadata: jsonb().notNull(),

    // Simple lifecycle (only for notifications)
    status: activityStatusEnum().default("unread").notNull(),

    // Timestamp of last system use (e.g. insight generation, digest inclusion)
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    // Optimized indexes
    index("activities_notifications_idx").using(
      "btree",
      table.teamId,
      table.priority,
      table.status,
      table.createdAt.desc(),
    ),
    index("activities_insights_idx").using(
      "btree",
      table.teamId,
      table.type,
      table.source,
      table.createdAt.desc(),
    ),
    index("activities_metadata_gin_idx").using("gin", table.metadata),
    index("activities_group_id_idx").on(table.groupId),
    index("activities_insights_group_idx").using(
      "btree",
      table.teamId,
      table.groupId,
      table.type,
      table.createdAt.desc(),
    ),

    // Foreign keys
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "activities_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "activities_user_id_fkey",
    }).onDelete("set null"),
  ],
);

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    notificationType: text("notification_type").notNull(),
    channel: text("channel").notNull(), // 'in_app', 'email', 'push'
    enabled: boolean().default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("notification_settings_user_team_type_channel_key").on(
      table.userId,
      table.teamId,
      table.notificationType,
      table.channel,
    ),
    index("notification_settings_user_team_idx").on(table.userId, table.teamId),
    index("notification_settings_type_channel_idx").on(
      table.notificationType,
      table.channel,
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "notification_settings_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "notification_settings_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can manage their own notification settings", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(user_id = auth.uid())`,
    }),
  ],
);

/**
 * Accounting Sync Records
 * Tracks which transactions have been synced to which accounting providers
 * Supports multiple providers per transaction (Xero AND QuickBooks, etc.)
 */
export const accountingSyncRecords = pgTable(
  "accounting_sync_records",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    transactionId: uuid("transaction_id").notNull(),
    teamId: uuid("team_id").notNull(),
    provider: accountingProviderEnum().notNull(),
    providerTenantId: text("provider_tenant_id").notNull(),
    providerTransactionId: text("provider_transaction_id"),
    // Maps Midday attachment IDs to provider attachment IDs for sync tracking
    // Format: { "midday-attachment-id": "provider-attachment-id" }
    syncedAttachmentMapping: jsonb("synced_attachment_mapping")
      .default(sql`'{}'::jsonb`)
      .notNull()
      .$type<Record<string, string | null>>(),
    syncedAt: timestamp("synced_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    syncType: accountingSyncTypeEnum("sync_type"),
    status: accountingSyncStatusEnum().default("synced").notNull(),
    errorMessage: text("error_message"),
    // Standardized error code for frontend handling (e.g., "ATTACHMENT_UNSUPPORTED_TYPE", "AUTH_EXPIRED")
    errorCode: text("error_code"),
    // Provider-specific entity type (e.g., "Purchase", "SalesReceipt", "Voucher", "BankTransaction")
    providerEntityType: text("provider_entity_type"),
    // When the record was first created (synced_at gets updated on every sync)
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Primary lookup: find syncs for a transaction
    index("idx_accounting_sync_transaction").on(table.transactionId),
    // Query syncs by team and provider
    index("idx_accounting_sync_team_provider").on(table.teamId, table.provider),
    // Query by status for retry logic
    index("idx_accounting_sync_status").on(table.teamId, table.status),
    // Unique constraint: one sync record per transaction per provider
    unique("accounting_sync_records_transaction_provider_key").on(
      table.transactionId,
      table.provider,
    ),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactions.id],
      name: "accounting_sync_records_transaction_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "accounting_sync_records_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can view their sync records", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
    pgPolicy("Team members can insert sync records", {
      as: "permissive",
      for: "insert",
      to: ["public"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Team members can update sync records", {
      as: "permissive",
      for: "update",
      to: ["public"],
    }),
  ],
);

export const accountingSyncRecordsRelations = relations(
  accountingSyncRecords,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [accountingSyncRecords.transactionId],
      references: [transactions.id],
    }),
    team: one(teams, {
      fields: [accountingSyncRecords.teamId],
      references: [teams.id],
    }),
  }),
);

// ============================================================================
// MCA (Merchant Cash Advance) Tables
// ============================================================================

export const mcaDealStatusEnum = pgEnum("mca_deal_status", [
  "active",
  "paid_off",
  "defaulted",
  "paused",
  "late",
  "in_collections",
]);

export const collectionPriorityEnum = pgEnum("collection_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const collectionOutcomeEnum = pgEnum("collection_outcome", [
  "paid_in_full",
  "settled",
  "payment_plan",
  "defaulted",
  "written_off",
  "sent_to_agency",
]);

export const collectionContactMethodEnum = pgEnum("collection_contact_method", [
  "phone",
  "email",
  "text",
  "in_person",
  "other",
]);

export const collectionNotificationTypeEnum = pgEnum("collection_notification_type", [
  "follow_up_due",
  "sla_breach",
  "escalation",
  "assignment",
]);

export const collectionEscalationTriggerEnum = pgEnum("collection_escalation_trigger", [
  "time_based",
  "event_based",
]);

export const collectionSlaMetricEnum = pgEnum("collection_sla_metric", [
  "time_in_stage",
  "response_time",
  "resolution_time",
]);

export const mcaPaymentTypeEnum = pgEnum("mca_payment_type", [
  "ach",
  "wire",
  "check",
  "manual",
  "other",
]);

export const mcaPaymentStatusEnum = pgEnum("mca_payment_status", [
  "completed",
  "returned",
  "pending",
  "failed",
]);

export const merchantPortalInviteStatusEnum = pgEnum(
  "merchant_portal_invite_status",
  ["pending", "accepted", "expired", "revoked"],
);

export const merchantPortalAccessStatusEnum = pgEnum(
  "merchant_portal_access_status",
  ["active", "suspended", "revoked"],
);

export const payoffLetterStatusEnum = pgEnum("payoff_letter_status", [
  "pending",
  "approved",
  "sent",
  "expired",
  "rejected",
]);

/**
 * MCA Deals - Core MCA funding records
 */
export const mcaDeals = pgTable(
  "mca_deals",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),

    // Relationships
    merchantId: uuid("merchant_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // Deal Terms
    dealCode: text("deal_code").notNull(),
    fundingAmount: numericCasted({ precision: 12, scale: 2 }).notNull(),
    factorRate: numericCasted({ precision: 5, scale: 4 }).notNull(),
    paybackAmount: numericCasted({ precision: 12, scale: 2 }).notNull(),
    dailyPayment: numericCasted({ precision: 10, scale: 2 }),
    paymentFrequency: text("payment_frequency").default("daily"),

    // Deal Status
    status: mcaDealStatusEnum().default("active"),
    fundedAt: timestamp("funded_at", { withTimezone: true, mode: "string" }),
    expectedPayoffDate: date("expected_payoff_date"),

    // Balance Tracking
    currentBalance: numericCasted({ precision: 12, scale: 2 }).notNull(),
    totalPaid: numericCasted({ precision: 12, scale: 2 }).default(0),
    nsfCount: integer("nsf_count").default(0),

    // External References (for spreadsheet sync)
    externalId: text("external_id"),

    // Broker who originated this deal
    brokerId: uuid("broker_id"),

    // Contract Dates
    startDate: date("start_date"),
    maturityDate: date("maturity_date"),
    firstPaymentDate: date("first_payment_date"),

    // Holdback
    holdbackPercentage: numericCasted("holdback_percentage", { precision: 5, scale: 2 }),

    // Legal Terms
    uccFilingStatus: text("ucc_filing_status"),
    personalGuarantee: boolean("personal_guarantee").default(false),
    defaultTerms: text("default_terms"),
    curePeriodDays: integer("cure_period_days"),
  },
  (table) => [
    index("mca_deals_merchant_id_idx").on(table.merchantId),
    index("mca_deals_team_id_idx").on(table.teamId),
    index("mca_deals_status_idx").on(table.status),
    index("mca_deals_deal_code_idx").on(table.dealCode),
    index("mca_deals_broker_id_idx").on(table.brokerId),
    unique("mca_deals_team_deal_code_unique").on(table.teamId, table.dealCode),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "mca_deals_merchant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "mca_deals_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage MCA deals", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

// ============================================================================
// Collections Module
// ============================================================================

export const collectionStages = pgTable(
  "collection_stages",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    position: integer().notNull(),
    color: text().default("#6B7280"),
    isDefault: boolean("is_default").default(false),
    isTerminal: boolean("is_terminal").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_stages_team_id_idx").on(table.teamId),
    unique("collection_stages_team_slug_unique").on(table.teamId, table.slug),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_stages_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage collection stages", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const collectionAgencies = pgTable(
  "collection_agencies",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    notes: text(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_agencies_team_id_idx").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_agencies_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage collection agencies", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const collectionCases = pgTable(
  "collection_cases",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    dealId: uuid("deal_id").notNull(),
    stageId: uuid("stage_id").notNull(),
    assignedTo: uuid("assigned_to"),
    priority: collectionPriorityEnum().default("medium"),
    outcome: collectionOutcomeEnum(),
    agencyId: uuid("agency_id"),
    nextFollowUp: timestamp("next_follow_up", { withTimezone: true, mode: "string" }),
    stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true, mode: "string" })
      .defaultNow(),
    enteredCollectionsAt: timestamp("entered_collections_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),
  },
  (table) => [
    index("collection_cases_team_id_idx").on(table.teamId),
    index("collection_cases_deal_id_idx").on(table.dealId),
    index("collection_cases_stage_id_idx").on(table.stageId),
    index("collection_cases_assigned_to_idx").on(table.assignedTo),
    unique("collection_cases_deal_id_unique").on(table.dealId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_cases_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "collection_cases_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.stageId],
      foreignColumns: [collectionStages.id],
      name: "collection_cases_stage_id_fkey",
    }),
    foreignKey({
      columns: [table.assignedTo],
      foreignColumns: [users.id],
      name: "collection_cases_assigned_to_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [collectionAgencies.id],
      name: "collection_cases_agency_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can manage collection cases", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const collectionNotes = pgTable(
  "collection_notes",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    caseId: uuid("case_id").notNull(),
    authorId: uuid("author_id"),
    contactName: text("contact_name"),
    contactMethod: collectionContactMethodEnum("contact_method"),
    followUpDate: timestamp("follow_up_date", { withTimezone: true, mode: "string" }),
    summary: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_notes_case_id_idx").on(table.caseId),
    foreignKey({
      columns: [table.caseId],
      foreignColumns: [collectionCases.id],
      name: "collection_notes_case_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [users.id],
      name: "collection_notes_author_id_fkey",
    }),
    pgPolicy("Team members can manage collection notes", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(case_id IN ( SELECT cc.id FROM collection_cases cc WHERE cc.team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)))`,
    }),
  ],
);

export const collectionEscalationRules = pgTable(
  "collection_escalation_rules",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    triggerType: collectionEscalationTriggerEnum("trigger_type").notNull(),
    fromStageId: uuid("from_stage_id").notNull(),
    toStageId: uuid("to_stage_id").notNull(),
    condition: jsonb().notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_escalation_rules_team_id_idx").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_escalation_rules_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.fromStageId],
      foreignColumns: [collectionStages.id],
      name: "collection_escalation_rules_from_stage_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.toStageId],
      foreignColumns: [collectionStages.id],
      name: "collection_escalation_rules_to_stage_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage escalation rules", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const collectionSlaConfigs = pgTable(
  "collection_sla_configs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    stageId: uuid("stage_id"),
    metric: collectionSlaMetricEnum().notNull(),
    thresholdMinutes: integer("threshold_minutes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_sla_configs_team_id_idx").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_sla_configs_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.stageId],
      foreignColumns: [collectionStages.id],
      name: "collection_sla_configs_stage_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage SLA configs", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const collectionNotifications = pgTable(
  "collection_notifications",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id").notNull(),
    caseId: uuid("case_id").notNull(),
    type: collectionNotificationTypeEnum().notNull(),
    message: text().notNull(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_notifications_user_id_idx").on(table.userId),
    index("collection_notifications_case_id_idx").on(table.caseId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_notifications_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "collection_notifications_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.caseId],
      foreignColumns: [collectionCases.id],
      name: "collection_notifications_case_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can view their own notifications", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(user_id = auth.uid())`,
    }),
  ],
);

/**
 * MCA Payments - Payment ledger for MCA deals
 */
export const mcaPayments = pgTable(
  "mca_payments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Relationships
    dealId: uuid("deal_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // Payment Details
    amount: numericCasted({ precision: 10, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    paymentType: mcaPaymentTypeEnum("payment_type").default("ach"),
    status: mcaPaymentStatusEnum().default("completed"),
    description: text(),

    // NSF Tracking
    nsfAt: timestamp("nsf_at", { withTimezone: true, mode: "string" }),
    nsfFee: numericCasted({ precision: 10, scale: 2 }),

    // Balance Snapshot (for audit trail)
    balanceBefore: numericCasted({ precision: 12, scale: 2 }),
    balanceAfter: numericCasted({ precision: 12, scale: 2 }),

    // External References
    externalId: text("external_id"),
  },
  (table) => [
    index("mca_payments_deal_id_idx").on(table.dealId),
    index("mca_payments_team_id_idx").on(table.teamId),
    index("mca_payments_payment_date_idx").on(table.paymentDate),
    index("mca_payments_status_idx").on(table.status),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "mca_payments_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "mca_payments_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage MCA payments", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

/**
 * Merchant Portal Sessions - Magic link authentication for merchants
 */
export const merchantPortalSessions = pgTable(
  "merchant_portal_sessions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Link to merchant
    merchantId: uuid("merchant_id").notNull(),
    portalId: text("portal_id").notNull(),

    // Email verification
    email: text().notNull(),
    verificationToken: text("verification_token").notNull().unique(),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "string" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" })
      .notNull(),

    // Session tracking
    lastActiveAt: timestamp("last_active_at", {
      withTimezone: true,
      mode: "string",
    }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Session type and device
    sessionType: text("session_type").default("magic_link").notNull(),
    deviceFingerprint: text("device_fingerprint"),
  },
  (table) => [
    index("merchant_sessions_merchant_idx").on(table.merchantId),
    index("merchant_sessions_token_idx").on(table.verificationToken),
    index("merchant_sessions_portal_idx").on(table.portalId),
    index("merchant_sessions_email_idx").on(table.email),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "merchant_portal_sessions_merchant_id_fkey",
    }).onDelete("cascade"),
  ],
);

/**
 * Merchant Portal Invites - Access invitations for merchants
 */
export const merchantPortalInvites = pgTable(
  "merchant_portal_invites",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" })
      .default(sql`(now() + interval '7 days')`),

    // Who is being invited
    email: text().notNull(),

    // What they're being invited to access
    merchantId: uuid("merchant_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // Invite details
    code: text().notNull().unique(),
    invitedBy: uuid("invited_by").notNull(),

    // Status
    status: merchantPortalInviteStatusEnum().default("pending"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("merchant_invites_code_idx").on(table.code),
    index("merchant_invites_email_idx").on(table.email),
    index("merchant_invites_merchant_idx").on(table.merchantId),
    index("merchant_invites_team_idx").on(table.teamId),
    unique("merchant_invites_email_merchant_unique").on(
      table.email,
      table.merchantId,
    ),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "merchant_portal_invites_merchant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "merchant_portal_invites_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [users.id],
      name: "merchant_portal_invites_invited_by_fkey",
    }),
  ],
);

/**
 * Merchant Portal Access - Who can access what in the merchant portal
 */
export const merchantPortalAccess = pgTable(
  "merchant_portal_access",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Who has access
    userId: uuid("user_id").notNull(),

    // What they can access
    merchantId: uuid("merchant_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // Status
    status: merchantPortalAccessStatusEnum().default("active"),

    // Revocation tracking
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
    revokedBy: uuid("revoked_by"),
    revokedReason: text("revoked_reason"),
  },
  (table) => [
    index("merchant_access_user_idx").on(table.userId),
    index("merchant_access_merchant_idx").on(table.merchantId),
    index("merchant_access_team_idx").on(table.teamId),
    unique("merchant_access_user_merchant_unique").on(
      table.userId,
      table.merchantId,
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "merchant_portal_access_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "merchant_portal_access_merchant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "merchant_portal_access_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.revokedBy],
      foreignColumns: [users.id],
      name: "merchant_portal_access_revoked_by_fkey",
    }),
  ],
);

/**
 * Payoff Letter Requests - Document requests from merchants
 */
export const payoffLetterRequests = pgTable(
  "payoff_letter_requests",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Relationships
    dealId: uuid("deal_id").notNull(),
    merchantId: uuid("merchant_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // Request details
    requestedPayoffDate: date("requested_payoff_date").notNull(),
    requestedByEmail: text("requested_by_email").notNull(),

    // Calculated amounts
    balanceAtRequest: numericCasted({ precision: 12, scale: 2 }).notNull(),
    payoffAmount: numericCasted({ precision: 12, scale: 2 }).notNull(),

    // Status workflow
    status: payoffLetterStatusEnum().default("pending"),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "string" }),
    approvedBy: uuid("approved_by"),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),

    // Generated document
    documentPath: text("document_path"),
    expiresAt: date("expires_at"),
  },
  (table) => [
    index("payoff_requests_deal_idx").on(table.dealId),
    index("payoff_requests_merchant_idx").on(table.merchantId),
    index("payoff_requests_team_idx").on(table.teamId),
    index("payoff_requests_status_idx").on(table.status),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "payoff_letter_requests_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "payoff_letter_requests_merchant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "payoff_letter_requests_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [users.id],
      name: "payoff_letter_requests_approved_by_fkey",
    }),
    pgPolicy("Team members can manage payoff letter requests", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

// ============================================================================
// Merchant Portal Self-Service Tables
// ============================================================================

export const merchantMessageStatusEnum = pgEnum("merchant_message_status", [
  "pending",
  "read",
  "replied",
  "archived",
]);

export const merchantMessageDirectionEnum = pgEnum(
  "merchant_message_direction",
  ["inbound", "outbound"],
);

export const merchantDocumentTypeEnum = pgEnum("merchant_document_type", [
  "contract",
  "disclosure",
  "payoff_letter",
  "monthly_statement",
  "tax_doc",
  "other",
]);

export const merchantNotificationTypeEnum = pgEnum(
  "merchant_notification_type",
  [
    "payment_received",
    "payment_nsf",
    "payoff_approved",
    "message_received",
    "document_uploaded",
    "balance_alert",
    "deal_paid_off",
    "general",
  ],
);

/**
 * Merchant Messages — merchant↔funder messaging
 */
export const merchantMessages = pgTable(
  "merchant_messages",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    merchantId: uuid("merchant_id").notNull(),
    teamId: uuid("team_id").notNull(),

    direction: merchantMessageDirectionEnum().notNull(),
    subject: text(),
    message: text().notNull(),

    status: merchantMessageStatusEnum().default("pending").notNull(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    repliedAt: timestamp("replied_at", { withTimezone: true, mode: "string" }),

    fromEmail: text("from_email"),
    fromName: text("from_name"),
    sentByUserId: uuid("sent_by_user_id"),
    sessionId: uuid("session_id"),
  },
  (table) => [
    index("merchant_messages_merchant_idx").on(table.merchantId),
    index("merchant_messages_team_idx").on(table.teamId),
    index("merchant_messages_status_idx").on(table.status),
    index("merchant_messages_created_at_idx").on(table.createdAt),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "merchant_messages_merchant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "merchant_messages_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sentByUserId],
      foreignColumns: [users.id],
      name: "merchant_messages_sent_by_user_id_fkey",
    }),
    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [merchantPortalSessions.id],
      name: "merchant_messages_session_id_fkey",
    }),
    pgPolicy("Team members can manage merchant messages", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

/**
 * Merchant Documents — document library for portal
 */
export const merchantDocuments = pgTable(
  "merchant_documents",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    merchantId: uuid("merchant_id").notNull(),
    teamId: uuid("team_id").notNull(),
    dealId: uuid("deal_id"),

    documentType: merchantDocumentTypeEnum("document_type").notNull(),
    title: text().notNull(),
    description: text(),

    filePath: text("file_path").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type").default("application/pdf"),

    visibleInPortal: boolean("visible_in_portal").default(true).notNull(),
    uploadedBy: uuid("uploaded_by"),
  },
  (table) => [
    index("merchant_documents_merchant_idx").on(table.merchantId),
    index("merchant_documents_team_idx").on(table.teamId),
    index("merchant_documents_type_idx").on(table.documentType),
    index("merchant_documents_deal_idx").on(table.dealId),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "merchant_documents_merchant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "merchant_documents_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "merchant_documents_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [users.id],
      name: "merchant_documents_uploaded_by_fkey",
    }),
    pgPolicy("Team members can manage merchant documents", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

/**
 * Merchant Notifications — notification log for portal
 */
export const merchantNotifications = pgTable(
  "merchant_notifications",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    merchantId: uuid("merchant_id").notNull(),
    teamId: uuid("team_id").notNull(),

    notificationType: merchantNotificationTypeEnum("notification_type").notNull(),
    title: text().notNull(),
    message: text().notNull(),

    emailSent: boolean("email_sent").default(false),
    emailSentAt: timestamp("email_sent_at", {
      withTimezone: true,
      mode: "string",
    }),
    smsSent: boolean("sms_sent").default(false),
    smsSentAt: timestamp("sms_sent_at", {
      withTimezone: true,
      mode: "string",
    }),

    readInPortal: boolean("read_in_portal").default(false),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),

    dealId: uuid("deal_id"),
    paymentId: uuid("payment_id"),
  },
  (table) => [
    index("merchant_notifications_merchant_idx").on(table.merchantId),
    index("merchant_notifications_team_idx").on(table.teamId),
    index("merchant_notifications_created_at_idx").on(table.createdAt),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "merchant_notifications_merchant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "merchant_notifications_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "merchant_notifications_deal_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [mcaPayments.id],
      name: "merchant_notifications_payment_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can manage merchant notifications", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

// ============================================================================
// MCA Relations
// ============================================================================

export const mcaDealsRelations = relations(mcaDeals, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [mcaDeals.merchantId],
    references: [merchants.id],
  }),
  team: one(teams, {
    fields: [mcaDeals.teamId],
    references: [teams.id],
  }),
  broker: one(brokers, {
    fields: [mcaDeals.brokerId],
    references: [brokers.id],
  }),
  payments: many(mcaPayments),
  payoffLetterRequests: many(payoffLetterRequests),
  brokerCommissions: many(brokerCommissions),
  syndicationParticipants: many(syndicationParticipants),
  dealBankAccounts: many(dealBankAccounts),
  collectionCase: one(collectionCases, {
    fields: [mcaDeals.id],
    references: [collectionCases.dealId],
  }),
}));

export const mcaPaymentsRelations = relations(mcaPayments, ({ one }) => ({
  deal: one(mcaDeals, {
    fields: [mcaPayments.dealId],
    references: [mcaDeals.id],
  }),
  team: one(teams, {
    fields: [mcaPayments.teamId],
    references: [teams.id],
  }),
}));

// ============================================================================
// Collections Relations
// ============================================================================

export const collectionStagesRelations = relations(collectionStages, ({ one }) => ({
  team: one(teams, {
    fields: [collectionStages.teamId],
    references: [teams.id],
  }),
}));

export const collectionAgenciesRelations = relations(collectionAgencies, ({ one }) => ({
  team: one(teams, {
    fields: [collectionAgencies.teamId],
    references: [teams.id],
  }),
}));

export const collectionCasesRelations = relations(collectionCases, ({ one, many }) => ({
  team: one(teams, {
    fields: [collectionCases.teamId],
    references: [teams.id],
  }),
  deal: one(mcaDeals, {
    fields: [collectionCases.dealId],
    references: [mcaDeals.id],
  }),
  stage: one(collectionStages, {
    fields: [collectionCases.stageId],
    references: [collectionStages.id],
  }),
  assignedUser: one(users, {
    fields: [collectionCases.assignedTo],
    references: [users.id],
  }),
  agency: one(collectionAgencies, {
    fields: [collectionCases.agencyId],
    references: [collectionAgencies.id],
  }),
  notes: many(collectionNotes),
}));

export const collectionNotesRelations = relations(collectionNotes, ({ one }) => ({
  case: one(collectionCases, {
    fields: [collectionNotes.caseId],
    references: [collectionCases.id],
  }),
  author: one(users, {
    fields: [collectionNotes.authorId],
    references: [users.id],
  }),
}));

export const collectionEscalationRulesRelations = relations(collectionEscalationRules, ({ one }) => ({
  team: one(teams, { fields: [collectionEscalationRules.teamId], references: [teams.id] }),
  fromStage: one(collectionStages, { fields: [collectionEscalationRules.fromStageId], references: [collectionStages.id], relationName: "fromStage" }),
  toStage: one(collectionStages, { fields: [collectionEscalationRules.toStageId], references: [collectionStages.id], relationName: "toStage" }),
}));

export const collectionSlaConfigsRelations = relations(collectionSlaConfigs, ({ one }) => ({
  team: one(teams, { fields: [collectionSlaConfigs.teamId], references: [teams.id] }),
  stage: one(collectionStages, { fields: [collectionSlaConfigs.stageId], references: [collectionStages.id] }),
}));

export const collectionNotificationsRelations = relations(collectionNotifications, ({ one }) => ({
  team: one(teams, { fields: [collectionNotifications.teamId], references: [teams.id] }),
  user: one(users, { fields: [collectionNotifications.userId], references: [users.id] }),
  case: one(collectionCases, { fields: [collectionNotifications.caseId], references: [collectionCases.id] }),
}));

export const merchantPortalSessionsRelations = relations(
  merchantPortalSessions,
  ({ one }) => ({
    merchant: one(merchants, {
      fields: [merchantPortalSessions.merchantId],
      references: [merchants.id],
    }),
  }),
);

export const merchantPortalInvitesRelations = relations(
  merchantPortalInvites,
  ({ one }) => ({
    merchant: one(merchants, {
      fields: [merchantPortalInvites.merchantId],
      references: [merchants.id],
    }),
    team: one(teams, {
      fields: [merchantPortalInvites.teamId],
      references: [teams.id],
    }),
    inviter: one(users, {
      fields: [merchantPortalInvites.invitedBy],
      references: [users.id],
    }),
  }),
);

export const merchantPortalAccessRelations = relations(
  merchantPortalAccess,
  ({ one }) => ({
    user: one(users, {
      fields: [merchantPortalAccess.userId],
      references: [users.id],
    }),
    merchant: one(merchants, {
      fields: [merchantPortalAccess.merchantId],
      references: [merchants.id],
    }),
    team: one(teams, {
      fields: [merchantPortalAccess.teamId],
      references: [teams.id],
    }),
    revoker: one(users, {
      fields: [merchantPortalAccess.revokedBy],
      references: [users.id],
    }),
  }),
);

export const payoffLetterRequestsRelations = relations(
  payoffLetterRequests,
  ({ one }) => ({
    deal: one(mcaDeals, {
      fields: [payoffLetterRequests.dealId],
      references: [mcaDeals.id],
    }),
    merchant: one(merchants, {
      fields: [payoffLetterRequests.merchantId],
      references: [merchants.id],
    }),
    team: one(teams, {
      fields: [payoffLetterRequests.teamId],
      references: [teams.id],
    }),
    approver: one(users, {
      fields: [payoffLetterRequests.approvedBy],
      references: [users.id],
    }),
  }),
);

// ============================================================================
// Transaction Rules
// ============================================================================

export const transactionRules = pgTable(
  "transaction_rules",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
    enabled: boolean().notNull().default(true),
    priority: integer().notNull().default(0),

    // Criteria
    merchantMatch: text("merchant_match"),
    merchantMatchType: text("merchant_match_type").notNull().default("contains"),
    amountOperator: text("amount_operator"),
    amountValue: numericCasted("amount_value", { precision: 10, scale: 2 }),
    amountValueMax: numericCasted("amount_value_max", {
      precision: 10,
      scale: 2,
    }),
    accountId: uuid("account_id"),

    // Actions
    setCategorySlug: text("set_category_slug"),
    setMerchantName: text("set_merchant_name"),
    addTagIds: text("add_tag_ids").array(),
    setExcluded: boolean("set_excluded"),
    setAssignedId: uuid("set_assigned_id"),

    // Deal assignment actions
    setDealCode: text("set_deal_code"),
    autoResolveDeal: boolean("auto_resolve_deal").notNull().default(false),

    // Date range criteria
    dateStart: date("date_start"),
    dateEnd: date("date_end"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_transaction_rules_team_id").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "transaction_rules_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [bankAccounts.id],
      name: "transaction_rules_account_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.setAssignedId],
      foreignColumns: [users.id],
      name: "transaction_rules_set_assigned_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Transaction rules can be managed by team members", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const transactionRulesRelations = relations(
  transactionRules,
  ({ one }) => ({
    team: one(teams, {
      fields: [transactionRules.teamId],
      references: [teams.id],
    }),
    account: one(bankAccounts, {
      fields: [transactionRules.accountId],
      references: [bankAccounts.id],
    }),
    assignedUser: one(users, {
      fields: [transactionRules.setAssignedId],
      references: [users.id],
    }),
  }),
);

// ============================================================================
// Underwriting Buy Box
// ============================================================================

export const underwritingBuyBox = pgTable(
  "underwriting_buy_box",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").notNull(),

    // Criteria
    minMonthlyRevenue: numericCasted("min_monthly_revenue", {
      precision: 12,
      scale: 2,
    }),
    minTimeInBusiness: integer("min_time_in_business"), // months
    maxExistingPositions: integer("max_existing_positions"),
    minAvgDailyBalance: numericCasted("min_avg_daily_balance", {
      precision: 12,
      scale: 2,
    }),
    maxNsfCount: integer("max_nsf_count"),
    excludedIndustries: text("excluded_industries").array(),
    minCreditScore: integer("min_credit_score"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("underwriting_buy_box_team_id_unique").on(table.teamId),
    index("idx_underwriting_buy_box_team_id").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "underwriting_buy_box_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage underwriting buy box", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const underwritingBuyBoxRelations = relations(
  underwritingBuyBox,
  ({ one }) => ({
    team: one(teams, {
      fields: [underwritingBuyBox.teamId],
      references: [teams.id],
    }),
  }),
);

// ============================================================================
// Brokers & Commissions
// ============================================================================

export const brokerStatusEnum = pgEnum("broker_status", [
  "active",
  "inactive",
]);

export const brokerCommissionStatusEnum = pgEnum("broker_commission_status", [
  "pending",
  "paid",
  "cancelled",
]);

export const brokerCommissionTypeEnum = pgEnum("broker_commission_type", [
  "percentage",
  "flat",
]);

/**
 * Brokers - ISOs who originate MCA deals
 */
export const brokers = pgTable(
  "brokers",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),

    // Team relationship
    teamId: uuid("team_id").notNull(),

    // Basic info
    name: text().notNull(),
    email: text(),
    phone: text(),
    companyName: text("company_name"),
    website: text(),

    // Address
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text(),
    state: text(),
    zip: text(),
    country: text(),

    // Default commission model
    commissionType: brokerCommissionTypeEnum("commission_type").default(
      "percentage",
    ),
    commissionPercentage: numericCasted("commission_percentage", {
      precision: 5,
      scale: 2,
    }),
    flatFee: numericCasted("flat_fee", { precision: 12, scale: 2 }),

    // Portal access
    portalEnabled: boolean("portal_enabled").default(false),
    portalId: text("portal_id").unique(),

    // Status
    status: brokerStatusEnum().default("active"),

    // Notes & external sync
    note: text(),
    externalId: text("external_id"),
  },
  (table) => [
    index("brokers_team_id_idx").on(table.teamId),
    index("brokers_portal_id_idx").on(table.portalId),
    index("brokers_status_idx").on(table.status),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "brokers_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage brokers", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

/**
 * Broker Commissions - Per-deal commission tracking for brokers
 */
export const brokerCommissions = pgTable(
  "broker_commissions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Relationships
    dealId: uuid("deal_id").notNull(),
    brokerId: uuid("broker_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // Commission details
    commissionType: brokerCommissionTypeEnum("commission_type").default(
      "percentage",
    ),
    commissionPercentage: numericCasted("commission_percentage", {
      precision: 5,
      scale: 2,
    }),
    commissionAmount: numericCasted("commission_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    // Status
    status: brokerCommissionStatusEnum().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),

    // Notes
    note: text(),
  },
  (table) => [
    index("broker_commissions_deal_id_idx").on(table.dealId),
    index("broker_commissions_broker_id_idx").on(table.brokerId),
    index("broker_commissions_team_id_idx").on(table.teamId),
    index("broker_commissions_status_idx").on(table.status),
    unique("broker_commissions_deal_broker_unique").on(
      table.dealId,
      table.brokerId,
    ),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "broker_commissions_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.brokerId],
      foreignColumns: [brokers.id],
      name: "broker_commissions_broker_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "broker_commissions_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage broker commissions", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

// Broker Relations
export const brokersRelations = relations(brokers, ({ one, many }) => ({
  team: one(teams, {
    fields: [brokers.teamId],
    references: [teams.id],
  }),
  deals: many(mcaDeals),
  commissions: many(brokerCommissions),
}));

export const brokerCommissionsRelations = relations(
  brokerCommissions,
  ({ one }) => ({
    deal: one(mcaDeals, {
      fields: [brokerCommissions.dealId],
      references: [mcaDeals.id],
    }),
    broker: one(brokers, {
      fields: [brokerCommissions.brokerId],
      references: [brokers.id],
    }),
    team: one(teams, {
      fields: [brokerCommissions.teamId],
      references: [teams.id],
    }),
  }),
);

// ============================================================================
// Syndicators - External funding partners who co-fund MCA deals
// ============================================================================

export const syndicatorStatusEnum = pgEnum("syndicator_status", [
  "active",
  "inactive",
]);

export const syndicationParticipantStatusEnum = pgEnum(
  "syndication_participant_status",
  ["active", "bought_out", "defaulted"],
);

/**
 * Syndicators - External funding partners who co-fund MCA deals
 */
export const syndicators = pgTable(
  "syndicators",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),

    // Team relationship
    teamId: uuid("team_id").notNull(),

    // Basic info
    name: text().notNull(),
    email: text(),
    phone: text(),
    companyName: text("company_name"),
    website: text(),

    // Address
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text(),
    state: text(),
    zip: text(),
    country: text(),

    // Portal access
    portalEnabled: boolean("portal_enabled").default(false),
    portalId: text("portal_id").unique(),

    // Status
    status: syndicatorStatusEnum().default("active"),

    // Notes & external sync
    note: text(),
    externalId: text("external_id"),
  },
  (table) => [
    index("syndicators_team_id_idx").on(table.teamId),
    index("syndicators_portal_id_idx").on(table.portalId),
    index("syndicators_status_idx").on(table.status),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "syndicators_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage syndicators", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

/**
 * Syndication Participants - Per-deal participation tracking for syndicators
 */
export const syndicationParticipants = pgTable(
  "syndication_participants",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Relationships
    dealId: uuid("deal_id").notNull(),
    syndicatorId: uuid("syndicator_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // Syndication details
    fundingShare: numericCasted("funding_share", {
      precision: 12,
      scale: 2,
    }).notNull(),
    ownershipPercentage: numericCasted("ownership_percentage", {
      precision: 5,
      scale: 4,
    }).notNull(),

    // Status
    status: syndicationParticipantStatusEnum().default("active"),

    // Notes
    note: text(),
  },
  (table) => [
    index("syndication_participants_deal_id_idx").on(table.dealId),
    index("syndication_participants_syndicator_id_idx").on(table.syndicatorId),
    index("syndication_participants_team_id_idx").on(table.teamId),
    index("syndication_participants_status_idx").on(table.status),
    unique("syndication_participants_deal_syndicator_unique").on(
      table.dealId,
      table.syndicatorId,
    ),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "syndication_participants_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.syndicatorId],
      foreignColumns: [syndicators.id],
      name: "syndication_participants_syndicator_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "syndication_participants_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage syndication participants", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

// Syndicator Relations
export const syndicatorsRelations = relations(syndicators, ({ one, many }) => ({
  team: one(teams, {
    fields: [syndicators.teamId],
    references: [teams.id],
  }),
  participants: many(syndicationParticipants),
  transactions: many(syndicatorTransactions, {
    relationName: "syndicatorTransactions",
  }),
  counterpartyTransactions: many(syndicatorTransactions, {
    relationName: "counterpartyTransactions",
  }),
}));

export const syndicationParticipantsRelations = relations(
  syndicationParticipants,
  ({ one }) => ({
    deal: one(mcaDeals, {
      fields: [syndicationParticipants.dealId],
      references: [mcaDeals.id],
    }),
    syndicator: one(syndicators, {
      fields: [syndicationParticipants.syndicatorId],
      references: [syndicators.id],
    }),
    team: one(teams, {
      fields: [syndicationParticipants.teamId],
      references: [teams.id],
    }),
  }),
);

// ============================================================================
// Syndicator Transactions - Per-syndicator capital flow ledger
// ============================================================================

export const syndicatorTransactionTypeEnum = pgEnum(
  "syndicator_transaction_type",
  [
    "contribution",
    "withdrawal",
    "profit_distribution",
    "refund",
    "fee",
    "chargeback",
    "transfer",
    "deal_allocation",
  ],
);

export const syndicatorPaymentMethodEnum = pgEnum(
  "syndicator_payment_method",
  ["ach", "wire", "check", "zelle", "other"],
);

/**
 * Syndicator Transactions - Per-syndicator capital flow ledger
 *
 * Tracks contributions, withdrawals, profit distributions, refunds, fees,
 * chargebacks, transfers between syndicators, and deal allocations.
 * Each syndicator has a virtual account with a running balance.
 *
 * Direction rules (amount is always positive):
 *   Increases balance: contribution, refund, transfer (incoming)
 *   Decreases balance: withdrawal, profit_distribution, fee, chargeback, deal_allocation, transfer (outgoing)
 */
export const syndicatorTransactions = pgTable(
  "syndicator_transactions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    date: date().notNull(),

    // Team relationship
    teamId: uuid("team_id").notNull(),

    // Syndicator whose ledger this entry belongs to
    syndicatorId: uuid("syndicator_id").notNull(),

    // Transaction classification
    transactionType: syndicatorTransactionTypeEnum("transaction_type").notNull(),
    method: syndicatorPaymentMethodEnum(),

    // Amount (always positive; transaction_type determines direction)
    amount: numericCasted({ precision: 12, scale: 2 }).notNull(),
    currency: text().notNull().default("USD"),

    // Description & notes
    description: text(),
    note: text(),

    // Optional deal link (null = unallocated capital)
    dealId: uuid("deal_id"),
    participationId: uuid("participation_id"),

    // For transfers between syndicators (buyout scenarios)
    counterpartySyndicatorId: uuid("counterparty_syndicator_id"),

    // Status tracking
    status: text().default("completed"),

    // Balance snapshot (audit trail, same pattern as mca_payments)
    balanceBefore: numericCasted("balance_before", { precision: 12, scale: 2 }),
    balanceAfter: numericCasted("balance_after", { precision: 12, scale: 2 }),

    // Bridge to bank transaction
    linkedTransactionId: uuid("linked_transaction_id"),

    // External reference number
    reference: text(),

    // Who created this entry
    createdBy: uuid("created_by"),

    // Flexible metadata
    metadata: jsonb().default({}),
  },
  (table) => [
    index("syndicator_transactions_team_id_idx").on(table.teamId),
    index("syndicator_transactions_syndicator_id_idx").on(table.syndicatorId),
    index("syndicator_transactions_deal_id_idx").on(table.dealId),
    index("syndicator_transactions_date_idx").on(table.date),
    index("syndicator_transactions_type_idx").on(table.transactionType),
    index("syndicator_transactions_status_idx").on(table.status),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "syndicator_transactions_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.syndicatorId],
      foreignColumns: [syndicators.id],
      name: "syndicator_transactions_syndicator_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "syndicator_transactions_deal_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.participationId],
      foreignColumns: [syndicationParticipants.id],
      name: "syndicator_transactions_participation_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.counterpartySyndicatorId],
      foreignColumns: [syndicators.id],
      name: "syndicator_transactions_counterparty_syndicator_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.linkedTransactionId],
      foreignColumns: [transactions.id],
      name: "syndicator_transactions_linked_transaction_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can manage syndicator transactions", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

// Syndicator Transaction Relations
export const syndicatorTransactionsRelations = relations(
  syndicatorTransactions,
  ({ one }) => ({
    team: one(teams, {
      fields: [syndicatorTransactions.teamId],
      references: [teams.id],
    }),
    syndicator: one(syndicators, {
      fields: [syndicatorTransactions.syndicatorId],
      references: [syndicators.id],
      relationName: "syndicatorTransactions",
    }),
    deal: one(mcaDeals, {
      fields: [syndicatorTransactions.dealId],
      references: [mcaDeals.id],
    }),
    participation: one(syndicationParticipants, {
      fields: [syndicatorTransactions.participationId],
      references: [syndicationParticipants.id],
    }),
    counterpartySyndicator: one(syndicators, {
      fields: [syndicatorTransactions.counterpartySyndicatorId],
      references: [syndicators.id],
      relationName: "counterpartyTransactions",
    }),
    linkedTransaction: one(transactions, {
      fields: [syndicatorTransactions.linkedTransactionId],
      references: [transactions.id],
    }),
  }),
);

// ============================================================================
// Deal Fees - Fee line items per MCA deal (for disclosure calculations)
// ============================================================================

export const dealFees = pgTable(
  "deal_fees",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),

    // Relationships
    dealId: uuid("deal_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // Fee details
    feeType: text("fee_type").notNull(),
    feeName: text("fee_name").notNull(),
    amount: numericCasted({ precision: 10, scale: 2 }).notNull(),
    percentage: numericCasted({ precision: 5, scale: 4 }),
  },
  (table) => [
    index("deal_fees_deal_id_idx").on(table.dealId),
    index("deal_fees_team_id_idx").on(table.teamId),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "deal_fees_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "deal_fees_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage deal fees", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const dealFeeRelations = relations(dealFees, ({ one }) => ({
  deal: one(mcaDeals, {
    fields: [dealFees.dealId],
    references: [mcaDeals.id],
  }),
  team: one(teams, {
    fields: [dealFees.teamId],
    references: [teams.id],
  }),
}));

// ============================================================================
// Disclosures - State-mandated commercial financing disclosure documents
// ============================================================================

export const disclosures = pgTable(
  "disclosures",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),

    // Relationships
    dealId: uuid("deal_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // State & Template versioning
    stateCode: text("state_code").notNull(),
    disclosureType: text("disclosure_type").notNull().default("mca"),
    templateVersion: text("template_version").notNull(),

    // Status lifecycle
    status: text().notNull().default("pending"),

    // Calculated figures (immutable snapshot)
    figures: jsonb().notNull().default({}),

    // Document artifact
    documentHash: text("document_hash"),
    filePath: text("file_path").array(),
    fileSize: integer("file_size"),

    // Audit trail
    generatedBy: uuid("generated_by"),
    generatedAt: timestamp("generated_at", {
      withTimezone: true,
      mode: "string",
    }),

    // Deal terms snapshot (frozen at generation time)
    dealSnapshot: jsonb("deal_snapshot").notNull().default({}),

    // Merchant acknowledgment / signature
    acknowledgedAt: timestamp("acknowledged_at", {
      withTimezone: true,
      mode: "string",
    }),
    acknowledgedBy: text("acknowledged_by"),
    signatureData: jsonb("signature_data"),
  },
  (table) => [
    index("disclosures_deal_id_idx").on(table.dealId),
    index("disclosures_team_id_idx").on(table.teamId),
    index("disclosures_state_code_idx").on(table.stateCode),
    index("disclosures_status_idx").on(table.status),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "disclosures_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "disclosures_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage disclosures", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const disclosureRelations = relations(disclosures, ({ one }) => ({
  deal: one(mcaDeals, {
    fields: [disclosures.dealId],
    references: [mcaDeals.id],
  }),
  team: one(teams, {
    fields: [disclosures.teamId],
    references: [teams.id],
  }),
}));

// ============================================================================
// Deal Bank Accounts - Merchant bank details linked to a specific deal
// ============================================================================

export const dealBankAccounts = pgTable(
  "deal_bank_accounts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),

    // Relationships
    dealId: uuid("deal_id").notNull(),
    teamId: uuid("team_id").notNull(),

    // Bank Details
    bankName: text("bank_name").notNull(),
    routingNumber: text("routing_number").notNull(),
    accountNumber: text("account_number").notNull(),
    accountType: text("account_type").default("checking"),

    // Optional link to existing team bank account
    linkedBankAccountId: uuid("linked_bank_account_id"),

    // Flags
    isPrimary: boolean("is_primary").default(true),
  },
  (table) => [
    index("deal_bank_accounts_deal_id_idx").on(table.dealId),
    index("deal_bank_accounts_team_id_idx").on(table.teamId),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "deal_bank_accounts_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "deal_bank_accounts_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.linkedBankAccountId],
      foreignColumns: [bankAccounts.id],
      name: "deal_bank_accounts_linked_bank_account_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can manage deal bank accounts", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const dealBankAccountsRelations = relations(
  dealBankAccounts,
  ({ one }) => ({
    deal: one(mcaDeals, {
      fields: [dealBankAccounts.dealId],
      references: [mcaDeals.id],
    }),
    team: one(teams, {
      fields: [dealBankAccounts.teamId],
      references: [teams.id],
    }),
    linkedBankAccount: one(bankAccounts, {
      fields: [dealBankAccounts.linkedBankAccountId],
      references: [bankAccounts.id],
    }),
  }),
);

// ============================================================================
// Reconciliation Tables
// ============================================================================

/**
 * Reconciliation Sessions - Tracks bookkeeper reconciliation work sessions
 */
export const reconciliationSessions = pgTable(
  "reconciliation_sessions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id").notNull(),
    bankAccountId: uuid("bank_account_id"),
    dateFrom: date("date_from").notNull(),
    dateTo: date("date_to").notNull(),
    totalTransactions: integer("total_transactions").default(0),
    autoMatched: integer("auto_matched").default(0),
    manuallyMatched: integer("manually_matched").default(0),
    flagged: integer("flagged").default(0),
    unmatched: integer("unmatched").default(0),
    status: text().default("in_progress"),
  },
  (table) => [
    index("idx_recon_sessions_team").on(table.teamId),
    index("idx_recon_sessions_user").on(table.userId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "reconciliation_sessions_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.bankAccountId],
      foreignColumns: [bankAccounts.id],
      name: "reconciliation_sessions_bank_account_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can manage reconciliation sessions", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

/**
 * ACH Batches - ACH payment batch generation and tracking
 */
export const achBatches = pgTable(
  "ach_batches",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),
    teamId: uuid("team_id").notNull(),
    createdBy: uuid("created_by").notNull(),
    batchNumber: text("batch_number").notNull(),
    effectiveDate: date("effective_date").notNull(),
    description: text(),
    totalAmount: numericCasted("total_amount", { precision: 14, scale: 2 }).default(0),
    itemCount: integer("item_count").default(0),
    originatorBankAccountId: uuid("originator_bank_account_id"),
    originatorName: text("originator_name"),
    originatorRouting: text("originator_routing"),
    originatorAccount: text("originator_account"),
    status: achBatchStatusEnum().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "string" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    nachaFilePath: text("nacha_file_path"),
    validationErrors: jsonb("validation_errors").default([]),
  },
  (table) => [
    index("idx_ach_batches_team").on(table.teamId),
    index("idx_ach_batches_status").on(table.teamId, table.status),
    unique("ach_batches_team_batch_number_unique").on(table.teamId, table.batchNumber),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "ach_batches_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.originatorBankAccountId],
      foreignColumns: [bankAccounts.id],
      name: "ach_batches_originator_bank_account_id_fkey",
    }),
    pgPolicy("Team members can manage ACH batches", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

/**
 * ACH Batch Items - Individual entries within an ACH batch
 */
export const achBatchItems = pgTable(
  "ach_batch_items",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    batchId: uuid("batch_id").notNull(),
    teamId: uuid("team_id").notNull(),
    dealId: uuid("deal_id").notNull(),
    mcaPaymentId: uuid("mca_payment_id"),
    receiverName: text("receiver_name").notNull(),
    receiverRouting: text("receiver_routing").notNull(),
    receiverAccount: text("receiver_account").notNull(),
    amount: numericCasted({ precision: 10, scale: 2 }).notNull(),
    transactionCode: text("transaction_code").notNull().default("27"),
    individualId: text("individual_id"),
    addenda: text(),
    status: text().default("pending"),
  },
  (table) => [
    index("idx_ach_batch_items_batch").on(table.batchId),
    index("idx_ach_batch_items_deal").on(table.dealId),
    foreignKey({
      columns: [table.batchId],
      foreignColumns: [achBatches.id],
      name: "ach_batch_items_batch_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "ach_batch_items_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "ach_batch_items_deal_id_fkey",
    }),
    foreignKey({
      columns: [table.mcaPaymentId],
      foreignColumns: [mcaPayments.id],
      name: "ach_batch_items_mca_payment_id_fkey",
    }),
    pgPolicy("Team members can manage ACH batch items", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

/**
 * Export Templates - Saved export configurations for reconciliation reports
 */
export const exportTemplates = pgTable(
  "export_templates",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
    description: text(),
    format: text().notNull(),
    columns: jsonb().notNull().default([]),
    filters: jsonb().default({}),
    dateRange: text("date_range"),
    scheduleEnabled: boolean("schedule_enabled").default(false),
    scheduleCron: text("schedule_cron"),
    scheduleEmail: text("schedule_email"),
    lastExportedAt: timestamp("last_exported_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("idx_export_templates_team").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "export_templates_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage export templates", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

/**
 * Match Audit Log - Tracks all match decisions for compliance
 */
export const matchAuditLog = pgTable(
  "match_audit_log",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id").notNull(),
    transactionId: uuid("transaction_id").notNull(),
    action: text().notNull(),
    dealId: uuid("deal_id"),
    paymentId: uuid("payment_id"),
    confidence: numericCasted({ precision: 5, scale: 2 }),
    rule: text(),
    previousStatus: matchStatusEnum("previous_status"),
    newStatus: matchStatusEnum("new_status"),
    userId: uuid("user_id"),
    note: text(),
    metadata: jsonb().default({}),
  },
  (table) => [
    index("idx_match_audit_team").on(table.teamId),
    index("idx_match_audit_transaction").on(table.transactionId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "match_audit_log_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.transactionId],
      foreignColumns: [transactions.id],
      name: "match_audit_log_transaction_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "match_audit_log_deal_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [mcaPayments.id],
      name: "match_audit_log_payment_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can view match audit log", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

// Reconciliation Relations
export const reconciliationSessionsRelations = relations(
  reconciliationSessions,
  ({ one }) => ({
    team: one(teams, {
      fields: [reconciliationSessions.teamId],
      references: [teams.id],
    }),
  }),
);

export const achBatchesRelations = relations(achBatches, ({ one, many }) => ({
  team: one(teams, {
    fields: [achBatches.teamId],
    references: [teams.id],
  }),
  originatorBankAccount: one(bankAccounts, {
    fields: [achBatches.originatorBankAccountId],
    references: [bankAccounts.id],
  }),
  items: many(achBatchItems),
}));

export const achBatchItemsRelations = relations(achBatchItems, ({ one }) => ({
  batch: one(achBatches, {
    fields: [achBatchItems.batchId],
    references: [achBatches.id],
  }),
  deal: one(mcaDeals, {
    fields: [achBatchItems.dealId],
    references: [mcaDeals.id],
  }),
}));

export const exportTemplatesRelations = relations(exportTemplates, ({ one }) => ({
  team: one(teams, {
    fields: [exportTemplates.teamId],
    references: [teams.id],
  }),
}));

// ============================================================================
// Team Branding Type
// ============================================================================

export type CollectionsTeamMember = {
  userId: string;
  title?: string;
};

export type DocumentSigner = {
  userId: string;
  signerTitle?: string;
  signatureLineText?: string;
};

export type DocumentSignerConfig = {
  collectionsNotices?: DocumentSigner;
  payoffLetters?: DocumentSigner;
  disclosureDocuments?: DocumentSigner;
  deals?: DocumentSigner;
};

export type TeamBranding = {
  displayName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  emailFromName?: string;
  pdfFooterText?: string;
  emailReplyTo?: string;
  collectionsTeam?: CollectionsTeamMember[];
  documentSigners?: DocumentSignerConfig;
};

// ============================================================================
// Risk Scoring
// ============================================================================

export const riskConfig = pgTable(
  "risk_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").notNull(),
    preset: text("preset").notNull().default("balanced"),
    weights: jsonb("weights")
      .notNull()
      .default({
        consistency: 0.25,
        nsf: 0.25,
        velocity: 0.15,
        recovery: 0.15,
        progress: 0.1,
        amounts: 0.1,
      }),
    decayHalfLifeDays: integer("decay_half_life_days").notNull().default(30),
    baselineScore: integer("baseline_score").notNull().default(50),
    eventImpacts: jsonb("event_impacts"),
    bandThresholds: jsonb("band_thresholds")
      .notNull()
      .default({ low_max: 33, high_min: 67 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("risk_config_team_id_unique").on(table.teamId),
    index("idx_risk_config_team_id").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "risk_config_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage risk config", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const riskConfigRelations = relations(riskConfig, ({ one }) => ({
  team: one(teams, {
    fields: [riskConfig.teamId],
    references: [teams.id],
  }),
}));

export const riskScores = pgTable(
  "risk_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").notNull(),
    dealId: uuid("deal_id").notNull(),
    overallScore: numericCasted("overall_score", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default(50),
    previousScore: numericCasted("previous_score", {
      precision: 5,
      scale: 2,
    }),
    band: text("band").notNull().default("medium"),
    subScores: jsonb("sub_scores").notNull().default({}),
    calculatedAt: timestamp("calculated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    triggeringPaymentId: uuid("triggering_payment_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("risk_scores_deal_id_unique").on(table.dealId),
    index("idx_risk_scores_team_id").on(table.teamId),
    index("idx_risk_scores_deal_id").on(table.dealId),
    index("idx_risk_scores_band").on(table.band),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "risk_scores_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "risk_scores_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.triggeringPaymentId],
      foreignColumns: [mcaPayments.id],
      name: "risk_scores_triggering_payment_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can manage risk scores", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const riskScoresRelations = relations(riskScores, ({ one }) => ({
  team: one(teams, {
    fields: [riskScores.teamId],
    references: [teams.id],
  }),
  deal: one(mcaDeals, {
    fields: [riskScores.dealId],
    references: [mcaDeals.id],
  }),
  triggeringPayment: one(mcaPayments, {
    fields: [riskScores.triggeringPaymentId],
    references: [mcaPayments.id],
  }),
}));

export const riskEvents = pgTable(
  "risk_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").notNull(),
    dealId: uuid("deal_id").notNull(),
    paymentId: uuid("payment_id"),
    eventType: text("event_type").notNull(),
    eventDate: timestamp("event_date", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    rawImpact: numericCasted("raw_impact", { precision: 5, scale: 2 })
      .notNull()
      .default(0),
    decayedImpact: numericCasted("decayed_impact", { precision: 5, scale: 2 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_risk_events_deal_id").on(table.dealId),
    index("idx_risk_events_team_id").on(table.teamId),
    index("idx_risk_events_event_date").on(table.eventDate),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "risk_events_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "risk_events_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [mcaPayments.id],
      name: "risk_events_payment_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can manage risk events", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const riskEventsRelations = relations(riskEvents, ({ one }) => ({
  team: one(teams, {
    fields: [riskEvents.teamId],
    references: [teams.id],
  }),
  deal: one(mcaDeals, {
    fields: [riskEvents.dealId],
    references: [mcaDeals.id],
  }),
  payment: one(mcaPayments, {
    fields: [riskEvents.paymentId],
    references: [mcaPayments.id],
  }),
}));
