import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { addresses } from "./addresses";
import { apiKeys } from "./api-keys";
import { profileTypeEnum } from "./enums";
import { roles } from "./roles";
import { settings } from "./settings";
import { teamMembers } from "./team-members";
import { userAccountsTags } from "./user-account-tags";

/**
 * Represents the user_accounts table in the database.
 * This table stores essential information about user accounts.
 *
 * @property {number} id - Unique identifier for the user account.
 * @property {string} email - User's email address (unique and required).
 * @property {string | null} bio - Short biography of the user (max 200 characters).
 * @property {string | null} headline - User's headline or tagline.
 * @property {string | null} phoneNumber - User's phone number.
 * @property {number | null} authnAccountId - ID of the associated authentication account.
 * @property {boolean} isActive - Indicates if the account is active (default: true).
 * @property {string | null} firstname - User's first name.
 * @property {string | null} lastname - User's last name.
 * @property {string} username - User's unique username (required).
 * @property {boolean} isPrivate - Indicates if the account is private (default: false).
 * @property {boolean} isEmailVerified - Indicates if the user's email is verified (default: false).
 * @property {Date} createdAt - Timestamp of when the account was created.
 * @property {Date | null} verifiedAt - Timestamp of when the account was verified.
 * @property {ProfileType | null} accountType - Type of the user account.
 * @property {string | null} profileImageUrl - URL of the user's profile image.
 * @property {string | null} supabaseAuth0UserId - Unique identifier for Supabase Auth0 integration.
 * @property {string | null} algoliaUserId - Unique identifier for Algolia integration.
 *
 * @remarks
 * - Consider adding indexes on frequently queried fields like email and username.
 * - The isActive field can be used for soft deletion or account suspension.
 * - The accountType field uses an enum to restrict possible values.
 */
export const userAccounts = sqliteTable("user_accounts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  bio: text("bio", { length: 200 }),
  headline: text("headline"),
  phoneNumber: text("phone_number"),
  authnAccountId: integer("authn_account_id"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  firstname: text("firstname"),
  lastname: text("lastname"),
  username: text("username").notNull().unique(),
  isPrivate: integer("is_private", { mode: "boolean" }).default(false),
  isEmailVerified: integer("is_email_verified", { mode: "boolean" }).default(
    false,
  ),
  createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
  verifiedAt: text("verifiedAt").default(sql`(CURRENT_TIMESTAMP)`),
  accountType: profileTypeEnum,
  profileImageUrl: text("profile_image_url"),
  supabaseAuth0UserId: text("supabase_auth0_user_id").unique(),
  algoliaUserId: text("algolia_user_id"),
});

/**
 * Defines the relationships between the userAccounts table and other tables in the database.
 *
 * @property {Relation} address - One-to-one relationship with the addresses table.
 * @property {Relation} tags - Many-to-many relationship with the tags table through userAccountsTags.
 * @property {Relation} settings - One-to-one relationship with the settings table.
 * @property {Relation} teams - One-to-many relationship with the teamMembers table.
 * @property {Relation} roles - One-to-many relationship with the roles table.
 * @property {Relation} apiKeys - One-to-many relationship with the apiKeys table.
 *
 * @remarks
 * - The address relationship allows for storing detailed location information separately.
 * - The tags relationship facilitates flexible categorization of user accounts.
 * - The settings relationship allows for user-specific configuration options.
 * - The teams relationship enables users to be part of multiple teams.
 * - The roles relationship allows for role-based access control.
 * - The apiKeys relationship allows users to have multiple API keys for different purposes.
 */
export const userAccountsRelations = relations(
  userAccounts,
  ({ one, many }) => ({
    address: one(addresses, {
      fields: [userAccounts.id],
      references: [addresses.userAccountId],
    }),
    tags: many(userAccountsTags),
    settings: one(settings, {
      fields: [userAccounts.id],
      references: [settings.userAccountId],
    }),
    teams: many(teamMembers),
    roles: many(roles),
    apiKeys: many(apiKeys),
  }),
);

export type UserAccount = typeof userAccounts.$inferSelect; // return type when queried
export type NewUserAccount = typeof userAccounts.$inferInsert; // insert type
