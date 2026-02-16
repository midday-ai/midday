import { relations, type SQL, sql } from "drizzle-orm";
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

export const institutionStatusEnum = pgEnum("institution_status", [
  "active",
  "removed",
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
  "other",
]);

export const inboxTypeEnum = pgEnum("inbox_type", [
  "invoice",
  "expense",
  "other",
]);
export const inboxBlocklistTypeEnum = pgEnum("inbox_blocklist_type", [
  "email",
  "domain",
]);
export const invoiceDeliveryTypeEnum = pgEnum("invoice_delivery_type", [
  "create",
  "create_and_send",
  "scheduled",
]);

export const invoiceSizeEnum = pgEnum("invoice_size", ["a4", "letter"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "overdue",
  "paid",
  "unpaid",
  "canceled",
  "scheduled",
  "refunded",
]);

export const invoiceRecurringFrequencyEnum = pgEnum(
  "invoice_recurring_frequency",
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

export const invoiceRecurringEndTypeEnum = pgEnum(
  "invoice_recurring_end_type",
  ["never", "on_date", "after_count"],
);

export const invoiceRecurringStatusEnum = pgEnum("invoice_recurring_status", [
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

export const teamRolesEnum = pgEnum("teamRoles", ["owner", "member"]);
export const trackerStatusEnum = pgEnum("trackerStatus", [
  "in_progress",
  "completed",
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
  "posted",
  "pending",
  "excluded",
  "completed",
  "archived",
  "exported",
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

export const activityTypeEnum = pgEnum("activity_type", [
  // System-generated activities
  "transactions_enriched",
  "transactions_created",
  "invoice_paid",
  "inbox_new",
  "inbox_auto_matched",
  "inbox_needs_review",
  "inbox_cross_currency_matched",
  "invoice_overdue",
  "invoice_sent",
  "inbox_match_confirmed",
  "invoice_refunded",

  // Recurring invoice activities
  "recurring_series_started",
  "recurring_series_completed",
  "recurring_series_paused",
  "recurring_invoice_upcoming",

  // User actions
  "document_uploaded",
  "document_processed",
  "invoice_duplicated",
  "invoice_scheduled",
  "invoice_reminder_sent",
  "invoice_cancelled",
  "invoice_created",
  "draft_invoice_created",
  "tracker_entry_created",
  "tracker_project_created",
  "transactions_categorized",
  "transactions_assigned",
  "transaction_attachment_created",
  "transaction_category_created",
  "transactions_exported",
  "customer_created",
  "insight_ready",
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

export const insightPeriodTypeEnum = pgEnum("insight_period_type", [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const insightStatusEnum = pgEnum("insight_status", [
  "pending",
  "generating",
  "completed",
  "failed",
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
    taxAmount: numericCasted("tax_amount", { precision: 10, scale: 2 }),
    taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
    taxType: text("tax_type"),
    recurring: boolean(),
    frequency: transactionFrequencyEnum(),
    merchantName: text("merchant_name"),
    enrichmentCompleted: boolean("enrichment_completed").default(false),
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

export const trackerEntries = pgTable(
  "tracker_entries",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    duration: bigint({ mode: "number" }),
    projectId: uuid("project_id"),
    start: timestamp({ withTimezone: true, mode: "string" }),
    stop: timestamp({ withTimezone: true, mode: "string" }),
    assignedId: uuid("assigned_id"),
    teamId: uuid("team_id"),
    description: text(),
    rate: numericCasted({ precision: 10, scale: 2 }),
    currency: text(),
    billed: boolean().default(false),
    date: date().defaultNow(),
  },
  (table) => [
    index("tracker_entries_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    // Composite index for insights activity date range queries
    index("tracker_entries_team_date_idx").on(table.teamId, table.date),
    foreignKey({
      columns: [table.assignedId],
      foreignColumns: [users.id],
      name: "tracker_entries_assigned_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [trackerProjects.id],
      name: "tracker_entries_project_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "tracker_entries_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Entries can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Entries can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["authenticated"],
    }),
    pgPolicy("Entries can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Entries can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
  ],
);

export const customerTags = pgTable(
  "customer_tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    customerId: uuid("customer_id").notNull(),
    teamId: uuid("team_id").notNull(),
    tagId: uuid("tag_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "customer_tags_customer_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [tags.id],
      name: "customer_tags_tag_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "customer_tags_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_customer_tag").on(table.customerId, table.tagId),
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

export const invoiceRecurring = pgTable(
  "invoice_recurring",
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
    customerId: uuid("customer_id"),
    // Frequency settings
    frequency: invoiceRecurringFrequencyEnum().notNull(),
    frequencyDay: integer("frequency_day"), // 0-6 for weekly (day of week), 1-31 for monthly_date
    frequencyWeek: integer("frequency_week"), // 1-5 for monthly_weekday (e.g., 1st, 2nd Friday)
    frequencyInterval: integer("frequency_interval"), // For custom: every X days
    // End conditions
    endType: invoiceRecurringEndTypeEnum("end_type").notNull(),
    endDate: timestamp("end_date", { withTimezone: true, mode: "string" }),
    endCount: integer("end_count"),
    // Status tracking
    status: invoiceRecurringStatusEnum().default("active").notNull(),
    invoicesGenerated: integer("invoices_generated").default(0).notNull(),
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
    // Invoice template data
    dueDateOffset: integer("due_date_offset").default(30).notNull(), // Days from issue date to due date
    amount: numericCasted({ precision: 10, scale: 2 }),
    currency: text(),
    lineItems: jsonb("line_items"),
    template: jsonb(), // Invoice template snapshot (labels, settings, etc.)
    paymentDetails: jsonb("payment_details"),
    fromDetails: jsonb("from_details"),
    noteDetails: jsonb("note_details"),
    customerName: text("customer_name"),
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
    index("invoice_recurring_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("invoice_recurring_next_scheduled_at_idx").using(
      "btree",
      table.nextScheduledAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("invoice_recurring_status_idx").using(
      "btree",
      table.status.asc().nullsLast(),
    ),
    // Compound partial index for scheduler query
    index("invoice_recurring_active_scheduled_idx")
      .using(
        "btree",
        table.nextScheduledAt.asc().nullsLast().op("timestamptz_ops"),
      )
      .where(sql`status = 'active'`),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "invoice_recurring_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "invoice_recurring_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "invoice_recurring_customer_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [invoiceTemplates.id],
      name: "invoice_recurring_template_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Invoice recurring can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const invoices = pgTable(
  "invoices",
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
    invoiceNumber: text("invoice_number"),
    customerId: uuid("customer_id"),
    amount: numericCasted({ precision: 10, scale: 2 }),
    currency: text(),
    lineItems: jsonb("line_items"),
    paymentDetails: jsonb("payment_details"),
    customerDetails: jsonb("customer_details"),
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
            (COALESCE((amount)::text, ''::text) || ' '::text) || COALESCE(invoice_number, ''::text)
          )
        )
      `,
      ),
    vat: numericCasted({ precision: 10, scale: 2 }),
    tax: numericCasted({ precision: 10, scale: 2 }),
    url: text(),
    filePath: text("file_path").array(),
    status: invoiceStatusEnum().default("draft").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true, mode: "string" }),
    fromDetails: jsonb("from_details"),
    issueDate: timestamp("issue_date", { withTimezone: true, mode: "string" }),
    template: jsonb(),
    noteDetails: jsonb("note_details"),
    customerName: text("customer_name"),
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
    // Recurring invoice fields
    invoiceRecurringId: uuid("invoice_recurring_id"),
    recurringSequence: integer("recurring_sequence"), // Which number in the series (1, 2, 3...)
  },
  (table) => [
    index("invoices_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("invoices_fts").using(
      "gin",
      table.fts.asc().nullsLast().op("tsvector_ops"),
    ),
    index("invoices_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("invoices_template_id_idx").using(
      "btree",
      table.templateId.asc().nullsLast().op("uuid_ops"),
    ),
    // Composite indexes for insights activity queries
    index("invoices_team_sent_at_idx").on(table.teamId, table.sentAt),
    index("invoices_team_status_paid_at_idx").on(
      table.teamId,
      table.status,
      table.paidAt,
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "invoices_created_by_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "invoices_customer_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "invoices_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.templateId],
      foreignColumns: [invoiceTemplates.id],
      name: "invoices_template_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.invoiceRecurringId],
      foreignColumns: [invoiceRecurring.id],
      name: "invoices_invoice_recurring_id_fkey",
    }).onDelete("set null"),
    index("invoices_invoice_recurring_id_idx").using(
      "btree",
      table.invoiceRecurringId.asc().nullsLast().op("uuid_ops"),
    ),
    // Unique constraint for idempotency (prevents duplicate invoices for same sequence)
    uniqueIndex("invoices_recurring_sequence_unique_idx")
      .on(table.invoiceRecurringId, table.recurringSequence)
      .where(sql`invoice_recurring_id IS NOT NULL`),
    unique("invoices_scheduled_job_id_key").on(table.scheduledJobId),
    pgPolicy("Invoices can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const customers = pgTable(
  "customers",
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

    // Customer relationship fields
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
    index("customers_fts").using(
      "gin",
      table.fts.asc().nullsLast().op("tsvector_ops"),
    ),
    index("idx_customers_status").on(table.status),
    index("idx_customers_is_archived").on(table.isArchived),
    index("idx_customers_enrichment_status").on(table.enrichmentStatus),
    index("idx_customers_website").on(table.website),
    index("idx_customers_industry").on(table.industry),
    // Team and date indexes for insights activity queries
    index("customers_team_id_idx").on(table.teamId),
    index("customers_team_created_at_idx").on(table.teamId, table.createdAt),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "customers_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Customers can be handled by members of the team", {
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

export const trackerReports = pgTable(
  "tracker_reports",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    linkId: text("link_id"),
    shortLink: text("short_link"),
    teamId: uuid("team_id").defaultRandom(),
    projectId: uuid("project_id").defaultRandom(),
    createdBy: uuid("created_by"),
  },
  (table) => [
    index("tracker_reports_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "public_tracker_reports_created_by_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [trackerProjects.id],
      name: "public_tracker_reports_project_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "tracker_reports_team_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    pgPolicy("Reports can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const invoiceComments = pgTable("invoice_comments", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const trackerProjectTags = pgTable(
  "tracker_project_tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    trackerProjectId: uuid("tracker_project_id").notNull(),
    tagId: uuid("tag_id").notNull(),
    teamId: uuid("team_id").notNull(),
  },
  (table) => [
    index("tracker_project_tags_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    index("tracker_project_tags_tracker_project_id_tag_id_team_id_idx").using(
      "btree",
      table.trackerProjectId.asc().nullsLast().op("uuid_ops"),
      table.tagId.asc().nullsLast().op("uuid_ops"),
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [tags.id],
      name: "project_tags_tag_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.trackerProjectId],
      foreignColumns: [trackerProjects.id],
      name: "project_tags_tracker_project_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "tracker_project_tags_team_id_fkey",
    }).onDelete("cascade"),
    unique("unique_project_tag").on(table.trackerProjectId, table.tagId),
    pgPolicy("Tags can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

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

export const institutions = pgTable(
  "institutions",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    logo: text(),
    provider: bankProvidersEnum().notNull(),
    countries: text().array().notNull(),
    availableHistory: integer("available_history"),
    maximumConsentValidity: integer("maximum_consent_validity"),
    popularity: integer().default(0).notNull(),
    type: text(),
    status: institutionStatusEnum().default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("institutions_country_idx").using("gin", table.countries),
    index("institutions_name_trgm_idx").using(
      "gin",
      sql`${table.name} gin_trgm_ops`,
    ),
    index("institutions_status_idx").on(table.status),
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

export const invoiceTemplates = pgTable(
  "invoice_templates",
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
    invoiceNoLabel: text("invoice_no_label"),
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
    size: invoiceSizeEnum().default("a4"),
    dateFormat: text("date_format"),
    includeVat: boolean("include_vat"),
    includeTax: boolean("include_tax"),
    taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
    deliveryType: invoiceDeliveryTypeEnum("delivery_type")
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
    emailSubject: text("email_subject"),
    emailHeading: text("email_heading"),
    emailBody: text("email_body"),
    emailButtonText: text("email_button_text"),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "invoice_settings_team_id_fkey",
    }).onDelete("cascade"),
    index("idx_invoice_templates_team_id").on(table.teamId),
    pgPolicy("Invoice templates can be handled by a member of the team", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const invoiceProducts = pgTable(
  "invoice_products",
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
      name: "invoice_products_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "invoice_products_created_by_fkey",
    }).onDelete("set null"),
    index("invoice_products_team_id_idx").on(table.teamId),
    index("invoice_products_created_by_idx").on(table.createdBy),
    index("invoice_products_fts_idx").using("gin", table.fts),
    index("invoice_products_name_idx").on(table.name),
    index("invoice_products_usage_count_idx").on(table.usageCount),
    index("invoice_products_last_used_at_idx").on(table.lastUsedAt),
    // Composite index for team + active status for fast filtering
    index("invoice_products_team_active_idx").on(table.teamId, table.isActive),
    // Unique constraint for upsert operations (team + name + currency + price combination)
    unique("invoice_products_team_name_currency_price_unique").on(
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

export const trackerProjects = pgTable(
  "tracker_projects",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id"),
    rate: numericCasted({ precision: 10, scale: 2 }),
    currency: text(),
    status: trackerStatusEnum().default("in_progress").notNull(),
    description: text(),
    name: text().notNull(),
    billable: boolean().default(false),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    estimate: bigint({ mode: "number" }),
    customerId: uuid("customer_id"),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
          to_tsvector(
            'english'::regconfig,
            (
              (COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)
            )
          )
        `,
      ),
  },
  (table) => [
    index("tracker_projects_fts").using(
      "gin",
      table.fts.asc().nullsLast().op("tsvector_ops"),
    ),
    index("tracker_projects_team_id_idx").using(
      "btree",
      table.teamId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "tracker_projects_customer_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "tracker_projects_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Projects can be created by a member of the team", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
    pgPolicy("Projects can be deleted by a member of the team", {
      as: "permissive",
      for: "delete",
      to: ["authenticated"],
    }),
    pgPolicy("Projects can be selected by a member of the team", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Projects can be updated by a member of the team", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
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
    taxAmount: numericCasted("tax_amount", { precision: 10, scale: 2 }),
    taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
    taxType: text("tax_type"),
    inboxAccountId: uuid("inbox_account_id"),
    invoiceNumber: text("invoice_number"),
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
    index("inbox_invoice_number_idx").using(
      "btree",
      table.invoiceNumber.asc().nullsLast().op("text_ops"),
    ),
    index("inbox_grouped_inbox_id_idx").using(
      "btree",
      table.groupedInboxId.asc().nullsLast().op("uuid_ops"),
    ),
    // Composite index for insights activity queries
    index("inbox_team_status_created_at_idx").on(
      table.teamId,
      table.status,
      table.createdAt,
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
    taxRate: numericCasted("tax_rate", { precision: 10, scale: 2 }),
    taxType: text("tax_type"),
    taxReportingCode: text("tax_reporting_code"),
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
  trackerEntries: many(trackerEntries),
  bankAccounts: many(bankAccounts),
  invoices: many(invoices),
  trackerReports: many(trackerReports),
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
  trackerEntries: many(trackerEntries),
  customerTags: many(customerTags),
  inboxAccounts: many(inboxAccounts),
  bankAccounts: many(bankAccounts),
  invoices: many(invoices),
  customers: many(customers),
  tags: many(tags),
  trackerReports: many(trackerReports),
  trackerProjectTags: many(trackerProjectTags),
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
  invoiceTemplates: many(invoiceTemplates),
  transactionEnrichments: many(transactionEnrichments),
  users: many(users),
  trackerProjects: many(trackerProjects),
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

export const trackerEntriesRelations = relations(trackerEntries, ({ one }) => ({
  user: one(users, {
    fields: [trackerEntries.assignedId],
    references: [users.id],
  }),
  trackerProject: one(trackerProjects, {
    fields: [trackerEntries.projectId],
    references: [trackerProjects.id],
  }),
  team: one(teams, {
    fields: [trackerEntries.teamId],
    references: [teams.id],
  }),
}));

export const trackerProjectsRelations = relations(
  trackerProjects,
  ({ one, many }) => ({
    trackerEntries: many(trackerEntries),
    trackerReports: many(trackerReports),
    trackerProjectTags: many(trackerProjectTags),
    customer: one(customers, {
      fields: [trackerProjects.customerId],
      references: [customers.id],
    }),
    team: one(teams, {
      fields: [trackerProjects.teamId],
      references: [teams.id],
    }),
  }),
);

export const customerTagsRelations = relations(customerTags, ({ one }) => ({
  customer: one(customers, {
    fields: [customerTags.customerId],
    references: [customers.id],
  }),
  tag: one(tags, {
    fields: [customerTags.tagId],
    references: [tags.id],
  }),
  team: one(teams, {
    fields: [customerTags.teamId],
    references: [teams.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  customerTags: many(customerTags),
  invoices: many(invoices),
  team: one(teams, {
    fields: [customers.teamId],
    references: [teams.id],
  }),
  trackerProjects: many(trackerProjects),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  customerTags: many(customerTags),
  team: one(teams, {
    fields: [tags.teamId],
    references: [teams.id],
  }),
  trackerProjectTags: many(trackerProjectTags),
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

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  team: one(teams, {
    fields: [invoices.teamId],
    references: [teams.id],
  }),
  invoiceRecurring: one(invoiceRecurring, {
    fields: [invoices.invoiceRecurringId],
    references: [invoiceRecurring.id],
  }),
}));

export const invoiceRecurringRelations = relations(
  invoiceRecurring,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [invoiceRecurring.teamId],
      references: [teams.id],
    }),
    user: one(users, {
      fields: [invoiceRecurring.userId],
      references: [users.id],
    }),
    customer: one(customers, {
      fields: [invoiceRecurring.customerId],
      references: [customers.id],
    }),
    invoiceTemplate: one(invoiceTemplates, {
      fields: [invoiceRecurring.templateId],
      references: [invoiceTemplates.id],
    }),
    invoices: many(invoices),
  }),
);

export const trackerReportsRelations = relations(trackerReports, ({ one }) => ({
  user: one(users, {
    fields: [trackerReports.createdBy],
    references: [users.id],
  }),
  trackerProject: one(trackerProjects, {
    fields: [trackerReports.projectId],
    references: [trackerProjects.id],
  }),
  team: one(teams, {
    fields: [trackerReports.teamId],
    references: [teams.id],
  }),
}));

export const trackerProjectTagsRelations = relations(
  trackerProjectTags,
  ({ one }) => ({
    tag: one(tags, {
      fields: [trackerProjectTags.tagId],
      references: [tags.id],
    }),
    trackerProject: one(trackerProjects, {
      fields: [trackerProjectTags.trackerProjectId],
      references: [trackerProjects.id],
    }),
    team: one(teams, {
      fields: [trackerProjectTags.teamId],
      references: [teams.id],
    }),
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

export const invoiceTemplatesRelations = relations(
  invoiceTemplates,
  ({ one }) => ({
    team: one(teams, {
      fields: [invoiceTemplates.teamId],
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
// INSIGHTS - AI-generated business insights (weekly, monthly, quarterly, yearly)
// ============================================================================

// Type definitions for JSONB columns
export type InsightMetric = {
  type: string;
  label: string;
  value: number;
  previousValue: number;
  change: number; // percentage
  changeDirection: "up" | "down" | "flat";
  unit?: string;
  historicalContext?: string; // "Highest since October"
};

export type InsightAnomaly = {
  type: string;
  severity: "info" | "warning" | "alert";
  message: string;
  metricType?: string;
};

export type ExpenseAnomaly = {
  type: "category_spike" | "new_category" | "category_decrease";
  severity: "info" | "warning" | "alert";
  categoryName: string;
  categorySlug: string;
  currentAmount: number;
  previousAmount: number;
  change: number; // percentage change
  currency: string;
  message: string;
  tip?: string; // actionable tip for the user
};

export type InsightMilestone = {
  type: string;
  description: string;
  achievedAt: string;
};

export type InsightActivity = {
  invoicesSent: number;
  invoicesPaid: number;
  invoicesOverdue: number;
  overdueAmount?: number;
  hoursTracked: number;
  largestPayment?: { customer: string; amount: number };
  newCustomers: number;
  receiptsMatched: number;
  transactionsCategorized: number;
  // Upcoming scheduled/recurring invoices
  upcomingInvoices?: {
    count: number;
    totalAmount: number;
    nextDueDate?: string;
    items?: Array<{
      customerName: string;
      amount: number;
      scheduledAt: string;
      frequency?: string;
    }>;
  };
};

// Forward-looking predictions stored for follow-through in next insight
export type InsightPredictions = {
  // Invoices due next week
  invoicesDue?: {
    count: number;
    totalAmount: number;
    currency: string;
  };
  // Current streak info to track if maintained
  streakAtRisk?: {
    type: string;
    count: number;
  };
  // Any other forward-looking items
  notes?: string[];
};

export type InsightContent = {
  title: string;
  summary: string;
  story: string;
  actions: Array<{
    text: string;
    type?: string;
    entityType?: "invoice" | "project" | "customer" | "transaction";
    entityId?: string;
  }>;
};

export const insights = pgTable(
  "insights",
  {
    id: uuid().defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    // Flexible period definition
    periodType: insightPeriodTypeEnum("period_type").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    periodYear: smallint("period_year").notNull(),
    periodNumber: smallint("period_number").notNull(), // Week 1-53, Month 1-12, Quarter 1-4

    status: insightStatusEnum().default("pending").notNull(),

    // Selected 4 key metrics (dynamically chosen)
    selectedMetrics: jsonb("selected_metrics").$type<InsightMetric[]>(),

    // Full metrics snapshot (for drill-down)
    allMetrics: jsonb("all_metrics").$type<Record<string, InsightMetric>>(),

    // Detected anomalies and patterns
    anomalies: jsonb().$type<InsightAnomaly[]>(),

    // Expense category anomalies (spikes, new categories, etc.)
    expenseAnomalies: jsonb("expense_anomalies").$type<ExpenseAnomaly[]>(),

    // Streaks and milestones
    milestones: jsonb().$type<InsightMilestone[]>(),

    // Activity context
    activity: jsonb().$type<InsightActivity>(),

    currency: varchar({ length: 3 }).notNull(),

    // AI-generated title (for card headers and email subjects)
    title: text(),

    // AI-generated content (relief-first structure)
    content: jsonb().$type<InsightContent>(),

    // Forward-looking predictions for follow-through tracking
    predictions: jsonb().$type<InsightPredictions>(),

    // Audio narration storage path: {teamId}/insights/{insightId}.mp3
    audioPath: text("audio_path"),

    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("insights_team_period_unique").on(
      table.teamId,
      table.periodType,
      table.periodYear,
      table.periodNumber,
    ),
    index("insights_team_id_idx").on(table.teamId),
    index("insights_team_period_type_idx").on(
      table.teamId,
      table.periodType,
      table.generatedAt.desc(),
    ),
    pgPolicy("Team members can view their insights", {
      as: "permissive",
      for: "select",
      to: ["public"],
    }),
  ],
);

export const insightsRelations = relations(insights, ({ one, many }) => ({
  team: one(teams, {
    fields: [insights.teamId],
    references: [teams.id],
  }),
  userStatuses: many(insightUserStatus),
}));

// Per-user insight interaction tracking (read/dismiss state)
export const insightUserStatus = pgTable(
  "insight_user_status",
  {
    insightId: uuid("insight_id")
      .notNull()
      .references(() => insights.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.insightId, table.userId] }),
    index("insight_user_status_user_idx").on(table.userId),
    index("insight_user_status_insight_idx").on(table.insightId),
    pgPolicy("Users can manage their own insight status", {
      as: "permissive",
      for: "all",
      to: ["public"],
    }),
  ],
);

export const insightUserStatusRelations = relations(
  insightUserStatus,
  ({ one }) => ({
    insight: one(insights, {
      fields: [insightUserStatus.insightId],
      references: [insights.id],
    }),
    user: one(users, {
      fields: [insightUserStatus.userId],
      references: [users.id],
    }),
  }),
);
