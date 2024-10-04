import { integer, pgTable, serial } from "drizzle-orm/pg-core";
import { businessAccounts } from "./business-accounts";
import { userAccounts } from "./user-accounts";

/**
 * Represents the settings table in the database.
 * This table stores configuration settings associated with user accounts and business accounts.
 *
 * @property {number} id - Unique identifier for the settings entry.
 * @property {number | null} userAccountId - Foreign key referencing the associated user account.
 *                                           This field is unique, ensuring one-to-one relationship.
 * @property {number | null} businessAccountId - Foreign key referencing the associated business account.
 *                                               This field is unique, ensuring one-to-one relationship.
 *
 * @remarks
 * - Each settings entry is associated with either a user account or a business account, but not both.
 * - The unique constraints on userAccountId and businessAccountId ensure that each account has at most one settings entry.
 * - Additional setting fields can be added to this table as needed for various configuration options.
 */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userAccountId: integer("user_account_id")
    .references(() => userAccounts.id)
    .unique(),
  businessAccountId: integer("business_account_id")
    .references(() => businessAccounts.id)
    .unique(),
});

export type Setting = typeof settings.$inferSelect; // return type when queried
export type NewSetting = typeof settings.$inferInsert; // insert type
