import { type SQL, sql } from "drizzle-orm";
import {
  boolean,
  customType,
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
