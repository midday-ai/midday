import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { businessAccounts } from "./business-accounts";
import { userAccounts } from "./user-accounts";

/**
 * Represents the addresses table in the database.
 * This table stores address information for both user and business accounts.
 */
export const addresses = sqliteTable("addresses", {
  /** Unique identifier for the address */
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  /** Street address */
  address: text("address"),
  /** Unit or apartment number */
  unit: text("unit"),
  /** ZIP code (5 characters) */
  zipcode: text("zipcode", { length: 5 }),
  /** City name */
  city: text("city"),
  /** State name */
  state: text("state"),
  /** Longitude coordinate */
  longitude: text("longitude"),
  /** Latitude coordinate */
  latitude: text("latitude"),
  /** Foreign key referencing the user account associated with this address */
  userAccountId: integer("user_account_id").references(() => userAccounts.id, {
    onDelete: "cascade",
  }),
  /** Foreign key referencing the business account associated with this address */
  businessAccountId: integer("business_account_id").references(
    () => businessAccounts.id,
    { onDelete: "cascade" },
  ),
});

export type Address = typeof addresses.$inferSelect; // return type when queried
export type NewAddress = typeof addresses.$inferInsert; // insert type
