import { type SQL, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return "tsvector";
  },
});

// Enums
export const plansEnum = pgEnum("plans", ["trial", "starter", "pro"]);
export const teamRolesEnum = pgEnum("teamRoles", ["owner", "member"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "overdue",
  "paid",
  "unpaid",
  "canceled",
]);
export const trackerStatusEnum = pgEnum("trackerStatus", [
  "in_progress",
  "completed",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().notNull(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    email: text("email"),
    teamId: uuid("team_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    locale: text("locale").default("en"),
    weekStartsOnMonday: boolean("week_starts_on_monday").default(false),
    timezone: text("timezone"),
    timeFormat: numeric("time_format").default("24"),
    dateFormat: text("date_format"),
  },
  (table) => [
    {
      columns: [table.id],
      foreignTable: "auth.users",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "users_id_fkey",
    },
    {
      columns: [table.teamId],
      foreignTable: "teams",
      foreignColumns: ["id"],
      onDelete: "set null",
      name: "users_team_id_fkey",
    },
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    name: text("name"),
    logoUrl: text("logo_url"),
    inboxId: text("inbox_id").default("generate_inbox(10)"),
    email: text("email"),
    inboxEmail: text("inbox_email"),
    inboxForwarding: boolean("inbox_forwarding").default(true),
    baseCurrency: text("base_currency"),
    documentClassification: boolean("document_classification").default(false),
    flags: text("flags").array(),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    plan: plansEnum("plan").default("trial").notNull(),
  },
  (table) => [
    {
      columns: [table.id],
      isPrimaryKey: true,
      name: "teams_pkey",
    },
    {
      columns: [table.inboxId],
      isUnique: true,
      name: "teams_inbox_id_key",
    },
  ],
);

export const usersOnTeam = pgTable(
  "users_on_team",
  {
    userId: uuid("user_id").notNull(),
    teamId: uuid("team_id").notNull(),
    id: uuid("id").defaultRandom().notNull(),
    role: teamRolesEnum("role"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    {
      columns: [table.userId, table.teamId, table.id],
      isPrimaryKey: true,
      name: "members_pkey",
    },
    {
      columns: [table.teamId],
      foreignTable: "teams",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "users_on_team_team_id_fkey",
    },
    {
      columns: [table.userId],
      foreignTable: "users",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "users_on_team_user_id_fkey",
    },
    // Indexes
    {
      columns: [table.teamId],
      name: "users_on_team_team_id_idx",
    },
    {
      columns: [table.userId],
      name: "users_on_team_user_id_idx",
    },
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    invoiceNumber: text("invoice_number"),
    customerId: uuid("customer_id"),
    amount: numeric("amount"),
    currency: text("currency"),
    lineItems: jsonb("line_items"),
    paymentDetails: jsonb("payment_details"),
    customerDetails: jsonb("customer_details"),
    note: text("note"),
    internalNote: text("internal_note"),
    teamId: uuid("team_id").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
        to_tsvector(
          'english',
          (
            (COALESCE((${invoices.amount})::text, ''::text) || ' '::text) || COALESCE(${invoices.invoiceNumber}, ''::text)
          )
        )
      `,
      ),
    vat: numeric("vat"),
    tax: numeric("tax"),
    url: text("url"),
    filePath: text("file_path").array(),
    status: invoiceStatusEnum("status").default("draft").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    fromDetails: jsonb("from_details"),
    issueDate: timestamp("issue_date", { withTimezone: true }),
    template: jsonb("template"),
    noteDetails: jsonb("note_details"),
    customerName: text("customer_name"),
    token: text("token").notNull().default(""),
    sentTo: text("sent_to"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    discount: numeric("discount"),
    fileSize: bigint("file_size", { mode: "number" }),
    userId: uuid("user_id"),
    subtotal: numeric("subtotal"),
    topBlock: jsonb("top_block"),
    bottomBlock: jsonb("bottom_block"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    scheduledJobId: text("scheduled_job_id"),
  },
  (table) => [
    {
      columns: [table.scheduledJobId],
      isUnique: true,
      name: "invoices_scheduled_job_id_key",
    },
    {
      columns: [table.userId],
      foreignTable: "users",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "invoices_created_by_fkey",
    },
    {
      columns: [table.customerId],
      foreignTable: "customers",
      foreignColumns: ["id"],
      onDelete: "set null",
      name: "invoices_customer_id_fkey",
    },
    {
      columns: [table.teamId],
      foreignTable: "teams",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "invoices_team_id_fkey",
    },
    // Indexes
    {
      columns: [table.createdAt],
      name: "invoices_created_at_idx",
    },
    {
      columns: [table.fts],
      name: "invoices_fts",
    },
    {
      columns: [table.teamId],
      name: "invoices_team_id_idx",
    },
  ],
);

export const trackerProjects = pgTable(
  "tracker_projects",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id"),
    rate: numeric("rate"),
    currency: text("currency"),
    status: trackerStatusEnum("status").default("in_progress").notNull(),
    description: text("description"),
    name: text("name").notNull(),
    billable: boolean("billable").default(false),
    estimate: bigint("estimate", { mode: "number" }),
    customerId: uuid("customer_id"),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
        to_tsvector(
          'english',
          (
            (COALESCE(${trackerProjects.name}, ''::text) || ' '::text) || COALESCE(${trackerProjects.description}, ''::text)
          )
        )
      `,
      ),
  },
  (table) => [
    {
      columns: [table.customerId],
      foreignTable: "customers",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "tracker_projects_customer_id_fkey",
    },
    {
      columns: [table.teamId],
      foreignTable: "teams",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "tracker_projects_team_id_fkey",
    },
    // Indexes
    {
      columns: [table.fts],
      name: "tracker_projects_fts",
    },
    {
      columns: [table.teamId],
      name: "tracker_projects_team_id_idx",
    },
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    country: text("country"),
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    note: text("note"),
    teamId: uuid("team_id").notNull().defaultRandom(),
    website: text("website"),
    phone: text("phone"),
    vatNumber: text("vat_number"),
    countryCode: text("country_code"),
    token: text("token").notNull().default(""),
    contact: text("contact"),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
      to_tsvector(
        'english',
        concat_ws(
          ' ',
          coalesce(${customers.name}, ''),
          coalesce(${customers.contact}, ''),
          coalesce(${customers.phone}, ''),
          coalesce(${customers.email}, ''),
          coalesce(${customers.addressLine1}, ''),
          coalesce(${customers.addressLine2}, ''),
          coalesce(${customers.city}, ''),
          coalesce(${customers.state}, ''),
          coalesce(${customers.zip}, ''),
          coalesce(${customers.country}, '')
        )
      )
    `,
      ),
  },
  (table) => [
    {
      columns: [table.id],
      isPrimaryKey: true,
      name: "customers_pkey",
    },
    {
      columns: [table.teamId],
      foreignTable: "teams",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "customers_team_id_fkey",
    },
    // Index for full-text search
    {
      columns: [table.fts],
      isUnique: false,
      name: "customers_fts",
      // Note: In Drizzle, index type (GIN) may need to be set in migration, not here
    },
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    teamId: uuid("team_id").notNull(),
    name: text("name").notNull(),
  },
  (table) => [
    {
      columns: [table.teamId, table.name],
      isUnique: true,
      name: "unique_tag_name",
    },
    {
      columns: [table.teamId],
      foreignTable: "teams",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "tags_team_id_fkey",
    },
    // Indexes
    {
      columns: [table.teamId],
      name: "tags_team_id_idx",
    },
  ],
);

export const customerTags = pgTable(
  "customer_tags",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    customerId: uuid("customer_id").notNull(),
    teamId: uuid("team_id").notNull(),
    tagId: uuid("tag_id").notNull(),
  },
  (table) => [
    {
      columns: [table.customerId, table.tagId],
      isUnique: true,
      name: "unique_customer_tag",
    },
    {
      columns: [table.customerId],
      foreignTable: "customers",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "customer_tags_customer_id_fkey",
    },
    {
      columns: [table.tagId],
      foreignTable: "tags",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "customer_tags_tag_id_fkey",
    },
    {
      columns: [table.teamId],
      foreignTable: "teams",
      foreignColumns: ["id"],
      onDelete: "cascade",
      name: "customer_tags_team_id_fkey",
    },
    // Indexes
    {
      columns: [table.customerId],
      name: "customer_tags_customer_id_idx",
    },
    {
      columns: [table.tagId],
      name: "customer_tags_tag_id_idx",
    },
    {
      columns: [table.teamId],
      name: "customer_tags_team_id_idx",
    },
  ],
);
