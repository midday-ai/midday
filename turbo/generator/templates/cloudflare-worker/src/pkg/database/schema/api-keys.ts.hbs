import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { businessAccounts } from "./business-accounts";
import { apiKeyStatusEnum } from "./enums";
import { userAccounts } from "./user-accounts";

// Tables
/**
 * Represents the API keys table in the database.
 * This table stores information about API keys associated with user or business accounts.
 *
 * @property {number} id - The unique identifier for the API key.
 * @property {string} key - The actual API key string (64 characters long).
 * @property {string} name - A human-readable name for the API key (up to 255 characters).
 * @property {ApiKeyStatus} status - The current status of the API key (e.g., 'ACTIVE', 'INACTIVE').
 * @property {Date | null} expiresAt - The expiration date and time of the API key (if applicable).
 * @property {Date | null} lastUsedAt - The date and time when the API key was last used.
 * @property {Date} createdAt - The date and time when the API key was created.
 * @property {Date} updatedAt - The date and time when the API key was last updated.
 * @property {number | null} userAccountId - The ID of the associated user account (if applicable).
 * @property {number | null} businessAccountId - The ID of the associated business account (if applicable).
 */
export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    key: text("key", { length: 64 }).notNull().unique(),
    name: text("name", { length: 255 }).notNull(),
    status: apiKeyStatusEnum,
    expiresAt: text("expires_at"),
    lastUsedAt: text("last_used_at"),
    createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updatedAt").default(sql`(CURRENT_TIMESTAMP)`),
    userAccountId: integer("user_account_id").references(() => userAccounts.id),
    businessAccountId: integer("business_account_id").references(
      () => businessAccounts.id,
    ),
  },
  (table) => {
    return {
      userAccountIdx: uniqueIndex("user_account_idx").on(
        table.userAccountId,
        table.name,
      ),
      businessAccountIdx: uniqueIndex("business_account_idx").on(
        table.businessAccountId,
        table.name,
      ),
    };
  },
);

/**
 * Defines the relationships between the apiKeys table and other tables.
 *
 * @property {Relation} userAccount - One-to-one relationship with the userAccounts table.
 *                                    Links an API key to its associated user account.
 * @property {Relation} businessAccount - One-to-one relationship with the businessAccounts table.
 *                                        Links an API key to its associated business account.
 */
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  userAccount: one(userAccounts, {
    fields: [apiKeys.userAccountId],
    references: [userAccounts.id],
  }),
  businessAccount: one(businessAccounts, {
    fields: [apiKeys.businessAccountId],
    references: [businessAccounts.id],
  }),
}));

export type ApiKey = typeof apiKeys.$inferSelect; // return type when queried
export type NewApiKey = typeof apiKeys.$inferInsert; // insert type
